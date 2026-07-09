import React, { useState, useEffect } from "react";
import { User, DashboardStats, ProctorLog, Exam } from "../types";
import { Users, FileText, Activity, Trash2, Key, ShieldAlert, CheckCircle, GraduationCap, School, RefreshCw, AlertTriangle, Calendar } from "lucide-react";
import ExamScheduleCalendar from "./ExamScheduleCalendar";

interface AdminPortalProps {
  token: string;
}

export default function AdminPortal({ token }: AdminPortalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<ProctorLog[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // holds id of user being edited
  const [activeTab, setActiveTab] = useState<"system" | "schedule">("system");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel fetches for stats, users, proctor logs and exams
      const [usersRes, statsRes, logsRes, examsRes] = await Promise.all([
        fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/proctor/logs", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/exams", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!usersRes.ok || !statsRes.ok || !logsRes.ok || !examsRes.ok) {
        throw new Error("Failed to load administration dataset.");
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      const logsData = await logsRes.json();
      const examsData = await examsRes.json();

      setUsers(usersData);
      setStats(statsData);
      setLogs(logsData);
      setExams(examsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred retrieving system admin dashboard records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update user role");
      }

      // Sync local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      // Refresh Stats
      const statsRes = await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user, their submissions, and all of their proctor logs?")) {
      return;
    }
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to delete user account");
      }

      // Sync local state
      setUsers(prev => prev.filter(u => u.id !== userId));
      // Refresh stats
      const statsRes = await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-medium">Synchronizing Administrator Node...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview stats bento layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Exams Stats */}
        <div className="p-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Exam Papers</span>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{stats?.totalExams || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Submissions Stats */}
        <div className="p-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Submissions</span>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{stats?.totalSubmissions || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Students Stats */}
        <div className="p-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Students</span>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{stats?.totalStudents || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        {/* Teachers Stats */}
        <div className="p-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Teachers</span>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{stats?.totalTeachers || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <School className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Tab Switcher */}
      <div className="flex items-center border-b border-slate-100 dark:border-slate-900 pb-px">
        <button
          onClick={() => setActiveTab("system")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "system"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <Users className="w-4 h-4" />
          System & Identity Control
        </button>
        
        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "schedule"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Academic Exam Schedule
        </button>
      </div>

      {activeTab === "system" ? (
        /* Grid of Main Management Modules */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Account Management Table (7 columns) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">Identity Directory</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Edit credential privileges and promote portal clearance on-the-fly</p>
              </div>
              <button 
                onClick={fetchData}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                title="Refresh directory"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500 rounded-xl">
                {error}
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="pb-3 pl-1 font-bold">User</th>
                    <th className="pb-3 font-bold">Portal Role Clearance</th>
                    <th className="pb-3 pr-1 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-900/40">
                  {users.map((user) => (
                    <tr key={user.id} className="group hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                      {/* User Identity cell */}
                      <td className="py-3.5 pl-1 pr-3">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{user.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{user.email}</div>
                      </td>
                      
                      {/* Role Clearance Select Cell */}
                      <td className="py-3.5">
                        <select
                          disabled={actionLoading === user.id}
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border focus:outline-none transition-all ${
                            user.role === "admin"
                              ? "bg-rose-50/60 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400"
                              : user.role === "teacher"
                                ? "bg-indigo-50/60 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400"
                                : "bg-emerald-50/60 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400"
                          }`}
                        >
                          <option value="student">Student Portal</option>
                          <option value="teacher">Teacher Portal</option>
                          <option value="admin">Admin Portal</option>
                        </select>
                      </td>

                      {/* Delete Actions Cell */}
                      <td className="py-3.5 pr-1 text-right">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={actionLoading === user.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-30"
                          title="Remove user account and related records"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Real-time Proctoring/Activity Logs feed (5 columns) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm p-6 space-y-4 flex flex-col h-[520px]">
            <div>
              <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">Portal Security Audits</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Live streaming remote candidates telemetry and proctor logs</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-dashed border-slate-100 dark:border-slate-900 rounded-xl">
                  <ShieldAlert className="w-10 h-10 text-slate-200 dark:text-slate-800 mb-2" />
                  <p className="text-xs text-slate-400">Security grid fully clear. No recent candidate proctor logs registered.</p>
                </div>
              ) : (
                logs.map((log) => {
                  const isTabSwitch = log.eventType === "tab-switch";
                  const isBlur = log.eventType === "blur";
                  const isFocus = log.eventType === "focus";

                  return (
                    <div 
                      key={log.id} 
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all hover:translate-x-0.5 ${
                        isTabSwitch 
                          ? "bg-rose-500/5 border-rose-500/10 dark:bg-rose-950/5" 
                          : isBlur 
                            ? "bg-amber-500/5 border-amber-500/10 dark:bg-amber-950/5" 
                            : "bg-blue-500/5 border-blue-500/10 dark:bg-blue-950/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Name & Event */}
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{log.studentName}</span>
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                            isTabSwitch 
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" 
                              : isBlur 
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" 
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                          }`}>
                            {log.eventType}
                          </span>
                        </div>
                        {/* Time */}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                        &quot;{log.details}&quot;
                      </p>

                      <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Exam: {log.examTitle}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl text-[10px] text-slate-400 dark:text-slate-500 leading-normal flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                Telemetry audits list automated detection hooks registering student behavior switches including background tab triggers or focus loss events.
              </p>
            </div>
          </div>

        </div>
      ) : (
        <div className="animate-fade-in">
          <ExamScheduleCalendar exams={exams} />
        </div>
      )}
    </div>
  );
}
