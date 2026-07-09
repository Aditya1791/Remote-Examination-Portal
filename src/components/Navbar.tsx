import React from "react";
import { LogOut, User, ShieldAlert, GraduationCap, School, Sun, Moon } from "lucide-react";
import { User as UserType } from "../types";

interface NavbarProps {
  user: UserType | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Navbar({ user, onLogout, activeTab, setActiveTab, theme, onToggleTheme }: NavbarProps) {
  if (!user) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3 h-3" />
            <span>Sys Admin</span>
          </span>
        );
      case "teacher":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <School className="w-3 h-3" />
            <span>Instructor</span>
          </span>
        );
      case "student":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <GraduationCap className="w-3 h-3" />
            <span>Candidate</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Branding Left */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-md font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">RemoteExam</h1>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">Assessment Portal</p>
            </div>
          </div>

          {/* Navigation Items (Responsive hidden or simple) */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === "dashboard" || activeTab === "exam-session"
                  ? "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40"
              }`}
            >
              Portal Home
            </button>
            {user.role === "teacher" && (
              <>
                <button
                  onClick={() => setActiveTab("submissions")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    activeTab === "submissions"
                      ? "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  }`}
                >
                  Grade Submissions
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    activeTab === "analytics"
                      ? "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  }`}
                >
                  Visual Analytics
                </button>
              </>
            )}
            {(user.role === "admin" || user.role === "teacher") && (
              <button
                onClick={() => setActiveTab("proctor-logs")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === "proctor-logs"
                    ? "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                }`}
              >
                Proctor Log Stream
              </button>
            )}
          </div>

          {/* User Section Right */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400 transition-all flex items-center justify-center cursor-pointer active:scale-95"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>

            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3 sm:pl-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{user.name}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{user.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {getRoleBadge(user.role)}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 dark:hover:bg-rose-950/20 dark:hover:border-rose-900/50 text-slate-500 dark:text-slate-400 transition-colors"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
