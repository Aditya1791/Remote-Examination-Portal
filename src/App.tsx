import React, { useState, useEffect } from "react";
import { User, UserRole } from "./types";
import Auth from "./components/Auth";
import Navbar from "./components/Navbar";
import AdminPortal from "./components/AdminPortal";
import TeacherPortal from "./components/TeacherPortal";
import StudentPortal from "./components/StudentPortal";
import { RefreshCw, ShieldAlert, GraduationCap, School } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const portalVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeInOut" } }
};

const authVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2, ease: "easeInOut" } }
};

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("exam_portal_token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Re-verify existing JWT token session on mount
  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          // Set default tabs based on role
          if (userData.role === "student") {
            setActiveTab("dashboard");
          } else if (userData.role === "teacher") {
            setActiveTab("dashboard");
          } else if (userData.role === "admin") {
            setActiveTab("dashboard");
          }
        } else {
          // Token expired or invalid, wipe storage
          handleLogout();
        }
      } catch (err) {
        console.error("Failed to verify active JWT session on startup:", err);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [token]);

  const handleLoginSuccess = (newToken: string, loggedUser: User) => {
    localStorage.setItem("exam_portal_token", newToken);
    setToken(newToken);
    setUser(loggedUser);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("exam_portal_token");
    setToken(null);
    setUser(null);
    setActiveTab("dashboard");
  };

  // Render Loader during re-auth checks
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center animate-pulse">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
          </div>
          <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin absolute -bottom-1 -right-1" />
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Authenticating Portal Gateway...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200">
      
      <AnimatePresence mode="wait">
        {/* 1. AUTHENTICATION MODULE */}
        {!user || !token ? (
          <motion.div 
            key="auth"
            variants={authVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative overflow-hidden min-h-screen flex flex-col justify-center"
          >
            {/* Subtle background grids */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
            <Auth onLoginSuccess={handleLoginSuccess} />
          </motion.div>
        ) : (
          
          /* 2. MAIN APPLICATION WORKSPACE */
          <motion.div 
            key="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
            exit={{ opacity: 0 }}
            className="relative pb-16"
          >
            <Navbar 
              user={user} 
              onLogout={handleLogout} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              theme={theme}
              onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              <AnimatePresence mode="wait">
                {/* Conditional Portal Rendering based on Authenticated Role */}
                {user.role === "admin" && (
                  <motion.div
                    key="admin-portal"
                    variants={portalVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <AdminPortal token={token} />
                  </motion.div>
                )}

                {user.role === "teacher" && (
                  <motion.div
                    key="teacher-portal"
                    variants={portalVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <TeacherPortal 
                      token={token} 
                      activeTab={activeTab} 
                      setActiveTab={setActiveTab} 
                    />
                  </motion.div>
                )}

                {user.role === "student" && (
                  <motion.div
                    key="student-portal"
                    variants={portalVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <StudentPortal 
                      token={token} 
                      onTokenRefresh={(newToken) => {
                        localStorage.setItem("exam_portal_token", newToken);
                        setToken(newToken);
                      }} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
