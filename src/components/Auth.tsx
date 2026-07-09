import React, { useState } from "react";
import { UserRole } from "../types";
import { Key, Mail, User, ShieldAlert, GraduationCap, School, Eye, EyeOff, Loader2 } from "lucide-react";

interface AuthProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin ? { email, password } : { name, email, password, role };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong during authentication.");
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to the examination server.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fill test account credentials
  const handleQuickLogin = (emailVal: string) => {
    setEmail(emailVal);
    setPassword("password123");
    setIsLogin(true);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background radial accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-gradient-to-tr from-blue-600/10 to-indigo-600/5 rounded-full filter blur-3xl opacity-60 pointer-events-none -z-10" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Branding Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 items-center justify-center text-white shadow-lg shadow-blue-500/15 mb-1.5">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {isLogin ? "Sign in to Examination Portal" : "Create Candidate Account"}
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {isLogin ? "Secure, monitored remote examinations" : "Register to participate in remote assessments"}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name Field (Register Only) */}
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Peter Parker"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Password</label>
              {isLogin && (
                <span className="text-[11px] text-slate-400 select-none">Must match registration</span>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Key className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role Selection (Register Only) */}
          {!isLogin && (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Access Role Clearance</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`py-2 px-1 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                    role === "student"
                      ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                      : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`py-2 px-1 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                    role === "teacher"
                      ? "border-indigo-500 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400"
                      : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <School className="w-4 h-4" />
                  <span>Teacher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`py-2 px-1 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                    role === "admin"
                      ? "border-rose-500 bg-rose-500/5 text-rose-600 dark:text-rose-400"
                      : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin</span>
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Secure Login...</span>
              </>
            ) : (
              <span>{isLogin ? "Authenticate Credentials" : "Submit & Register"}</span>
            )}
          </button>
        </form>

        {/* Switch Auth Action */}
        <div className="text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline transition-colors focus:outline-none"
          >
            {isLogin ? "New user? Register a secure credential account" : "Already registered? Sign in with existing token"}
          </button>
        </div>

        {/* Quick Testing Credentials helper */}
        <div className="border-t border-slate-100 dark:border-slate-900 pt-4 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">
            Evaluator Testing Panel (Quick Fill & Log in)
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleQuickLogin("student@exam.com")}
              className="py-1 px-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 transition-colors truncate"
              title="student@exam.com"
            >
              Student Portal
            </button>
            <button
              onClick={() => handleQuickLogin("teacher@exam.com")}
              className="py-1 px-1 rounded-lg bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/30 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 transition-colors truncate"
              title="teacher@exam.com"
            >
              Teacher Portal
            </button>
            <button
              onClick={() => handleQuickLogin("admin@exam.com")}
              className="py-1 px-1 rounded-lg bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/30 text-[10px] font-bold text-rose-600 dark:text-rose-400 transition-colors truncate"
              title="admin@exam.com"
            >
              Admin Portal
            </button>
          </div>
          <p className="text-[9px] text-slate-400 text-center">
            Default Password for seed accounts is <strong className="font-bold text-slate-500">password123</strong>
          </p>
        </div>

      </div>
    </div>
  );
}
