import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { ProctorLog, Submission, Exam } from "../types";
import { AlertCircle, Calendar, ShieldAlert, User, Activity, Clock, Sliders } from "lucide-react";

interface ViolationTimelineChartProps {
  proctorLogs: ProctorLog[];
  submissions: Submission[];
  exams: Exam[];
}

export default function ViolationTimelineChart({
  proctorLogs,
  submissions,
  exams
}: ViolationTimelineChartProps) {
  // Determine if there is any data
  const hasLogs = proctorLogs.length > 0;

  // Selected Exam ID - default to first exam or first exam with logs
  const [selectedExamId, setSelectedExamId] = useState<string>(() => {
    if (exams.length > 0) {
      // Prefer exams that actually have some logs
      const examWithLogs = exams.find(e => proctorLogs.some(log => log.examId === e.id));
      return examWithLogs ? examWithLogs.id : exams[0].id;
    }
    return "";
  });

  // Selected Student ID - "all" or specific studentId
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all");
  // Visualization mode: "breakdown" (by event type) vs "total" (cumulative count)
  const [chartMode, setChartMode] = useState<"breakdown" | "total">("breakdown");

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Filter students who took the selected exam and have submissions or logs
  const studentsForExam = React.useMemo(() => {
    if (!selectedExamId) return [];
    
    // Get all students with submissions for this exam
    const fromSubmissions = submissions
      .filter(s => s.examId === selectedExamId)
      .map(s => ({ id: s.studentId, name: s.studentName }));

    // Get all students with proctor logs for this exam (as fallback)
    const fromLogs = proctorLogs
      .filter(l => l.examId === selectedExamId)
      .map(l => ({ id: l.studentId, name: l.studentName }));

    // Merge unique by student ID
    const mergedMap = new Map<string, string>();
    fromSubmissions.forEach(s => mergedMap.set(s.id, s.name));
    fromLogs.forEach(l => mergedMap.set(l.id, l.name));

    return Array.from(mergedMap.entries()).map(([id, name]) => ({ id, name }));
  }, [selectedExamId, submissions, proctorLogs]);

  // Reset student selection if selected exam changes
  useEffect(() => {
    setSelectedStudentId("all");
  }, [selectedExamId]);

  // Get active exam details
  const activeExam = exams.find(e => e.id === selectedExamId);
  const durationMinutes = activeExam ? activeExam.durationMinutes : 30; // default to 30

  // Effect to construct the Chart.js instance
  useEffect(() => {
    if (!canvasRef.current || !selectedExamId) return;

    // Destroy existing chart to prevent canvas reuse errors
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Filter logs for the selected exam
    let examLogs = proctorLogs.filter(l => l.examId === selectedExamId);

    // Filter logs for selected student if not "all"
    if (selectedStudentId !== "all") {
      examLogs = examLogs.filter(l => l.studentId === selectedStudentId);
    }

    // Prepare time bins from 0 to durationMinutes
    const binsLength = durationMinutes + 1;
    const tabSwitchBins = new Array(binsLength).fill(0);
    const focusLossBins = new Array(binsLength).fill(0); // blur events
    const otherViolationsBins = new Array(binsLength).fill(0); // shortcut, context-menu
    const totalViolationsBins = new Array(binsLength).fill(0);

    // Group logs into minute bins relative to exam start
    examLogs.forEach(log => {
      // Find the start time for this candidate
      const submission = submissions.find(
        s => s.examId === selectedExamId && s.studentId === log.studentId
      );

      let elapsedMinutes = 0;
      if (submission) {
        const start = new Date(submission.startTime).getTime();
        const logTime = new Date(log.timestamp).getTime();
        elapsedMinutes = Math.floor((logTime - start) / 60000);
      } else {
        // Fallback: use first log of this exam as min start time
        const siblings = proctorLogs.filter(l => l.examId === selectedExamId && l.studentId === log.studentId);
        if (siblings.length > 0) {
          const earliestLogTime = Math.min(...siblings.map(s => new Date(s.timestamp).getTime()));
          elapsedMinutes = Math.floor((new Date(log.timestamp).getTime() - earliestLogTime) / 60000);
        }
      }

      // Exclude focus logs as they are not violations/infractions
      if (log.eventType === "focus") return;

      // Increment counters
      totalViolationsBins[elapsedMinutes] += 1;
      if (log.eventType === "tab-switch") {
        tabSwitchBins[elapsedMinutes] += 1;
      } else if (log.eventType === "blur") {
        focusLossBins[elapsedMinutes] += 1;
      } else {
        otherViolationsBins[elapsedMinutes] += 1;
      }
    });

    // Create labels: "Min 0", "Min 1", ...
    const labels = Array.from({ length: binsLength }, (_, i) => `${i}m`);

    // Styling constants matching slate & brand identity
    const gridColor = isDark ? "rgba(226, 232, 240, 0.05)" : "rgba(15, 23, 42, 0.05)";
    const textColor = isDark ? "#94a3b8" : "#475569";

    const datasets = [];

    if (chartMode === "breakdown") {
      datasets.push(
        {
          label: "Tab Switches",
          data: tabSwitchBins,
          borderColor: "#f43f5e", // Rose-500
          backgroundColor: "rgba(244, 63, 94, 0.04)",
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: "#f43f5e",
        },
        {
          label: "Focus Loss / Blur",
          data: focusLossBins,
          borderColor: "#f59e0b", // Amber-500
          backgroundColor: "rgba(245, 158, 11, 0.04)",
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: "#f59e0b",
        },
        {
          label: "Other Flags",
          data: otherViolationsBins,
          borderColor: "#8b5cf6", // Violet-500
          backgroundColor: "rgba(139, 92, 246, 0.04)",
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: "#8b5cf6",
        }
      );
    } else {
      datasets.push({
        label: "Total Violations",
        data: totalViolationsBins,
        borderColor: "#6366f1", // Indigo-500
        backgroundColor: "rgba(99, 102, 241, 0.08)",
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: "#6366f1",
      });
    }

    // Configure and instantiate Chart.js
    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              font: {
                family: "Inter, system-ui, sans-serif",
                size: 11,
                weight: "bold",
              },
              color: textColor,
              padding: 16,
            },
          },
          tooltip: {
            padding: 10,
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
            titleColor: isDark ? "#f8fafc" : "#0f172a",
            bodyColor: isDark ? "#cbd5e1" : "#334155",
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
            borderWidth: 1,
            titleFont: {
              family: "Inter, system-ui, sans-serif",
              weight: "bold",
              size: 12,
            },
            bodyFont: {
              family: "Inter, system-ui, sans-serif",
              size: 11,
            },
            callbacks: {
              title: (tooltipItems) => {
                return `Time elapsed: ${tooltipItems[0].label}`;
              },
              label: (context) => {
                return ` ${context.dataset.label}: ${context.raw} violation(s)`;
              }
            }
          },
        },
        scales: {
          x: {
            grid: {
              color: gridColor,
            },
            ticks: {
              color: textColor,
              font: {
                family: "JetBrains Mono, monospace",
                size: 10,
              },
              maxTicksLimit: 15,
            },
            title: {
              display: true,
              text: "Elapsed Exam Duration (Minutes)",
              color: textColor,
              font: {
                family: "Inter, system-ui, sans-serif",
                size: 11,
                weight: "bold",
              },
              padding: { top: 10 },
            },
          },
          y: {
            grid: {
              color: gridColor,
            },
            ticks: {
              color: textColor,
              stepSize: 1,
              font: {
                family: "JetBrains Mono, monospace",
                size: 10,
              },
            },
            title: {
              display: true,
              text: "Violation Frequency (Count)",
              color: textColor,
              font: {
                family: "Inter, system-ui, sans-serif",
                size: 11,
                weight: "bold",
              },
              padding: { bottom: 10 },
            },
            min: 0,
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [selectedExamId, selectedStudentId, chartMode, proctorLogs, submissions, durationMinutes, isDark]);

  // Aggregate stats for quick overview
  const totalViolationsForSelected = React.useMemo(() => {
    // Exclude focus logs as they are not violations/infractions
    let filtered = proctorLogs.filter(l => l.examId === selectedExamId && l.eventType !== "focus");
    if (selectedStudentId !== "all") {
      filtered = filtered.filter(l => l.studentId === selectedStudentId);
    }
    const tabSwitches = filtered.filter(l => l.eventType === "tab-switch").length;
    const focusLoss = filtered.filter(l => l.eventType === "blur").length;
    const shortcuts = filtered.filter(l => l.eventType === "keyboard-shortcut").length;
    const rightClicks = filtered.filter(l => l.eventType === "context-menu").length;
    const noiseAlerts = filtered.filter(l => l.eventType === "noise-alert").length;
    return {
      total: filtered.length,
      tabSwitches,
      focusLoss,
      others: shortcuts + rightClicks + noiseAlerts
    };
  }, [selectedExamId, selectedStudentId, proctorLogs]);

  if (exams.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm p-6 space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-4 border-b border-slate-100 dark:border-slate-900/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-md font-black text-slate-900 dark:text-slate-50 font-sans tracking-tight">
              Exam Violation Temporal Timeline
            </h3>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Chronological line-graph tracking peak integrity violations (switches, defocus) over elapsed exam duration
          </p>
        </div>

        {/* Filters and Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Exam Selector */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Target Assessment</span>
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold cursor-pointer transition-colors"
            >
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>
                  {exam.title}
                </option>
              ))}
            </select>
          </div>

          {/* Student Selector */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>Candidate Focus</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold cursor-pointer transition-colors"
            >
              <option value="all">All Candidates (Combined)</option>
              {studentsForExam.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Selector */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3 h-3" />
              <span>Chart Mode</span>
            </label>
            <div className="flex border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setChartMode("breakdown")}
                className={`px-3 py-1.5 transition-colors ${
                  chartMode === "breakdown"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                By Event Type
              </button>
              <button
                type="button"
                onClick={() => setChartMode("total")}
                className={`px-3 py-1.5 transition-colors ${
                  chartMode === "total"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Combined Total
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Aggregate Stats Ribbons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900/40 rounded-xl">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Violations</span>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">
            {totalViolationsForSelected.total}
          </p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-rose-500">Tab Switches</span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400">
            {totalViolationsForSelected.tabSwitches}
          </p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-amber-500">Focus Losses (Blurs)</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400">
            {totalViolationsForSelected.focusLoss}
          </p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-purple-500">Other Flags</span>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400">
            {totalViolationsForSelected.others}
          </p>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative w-full h-[320px] px-2">
        {totalViolationsForSelected.total === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30 dark:bg-slate-900/10 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <ShieldAlert className="w-10 h-10 text-emerald-500 mb-2 animate-bounce" />
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Excellent Integrity Record</h4>
            <p className="text-[10px] text-slate-400 max-w-sm mt-1">
              Zero tab switches, focus losses, or shortcuts registered for this query. Double-check student exam completions!
            </p>
          </div>
        ) : null}
        
        {/* Canvas for Chart.js */}
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Footer hint */}
      <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/20 p-2.5 rounded-lg border border-slate-100 dark:border-slate-900/40">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span>
          <strong>Proctoring Hint:</strong> Spike concentrations in violations (e.g. sharp slopes) usually indicate active external searches during difficult question intervals.
        </span>
      </div>

    </div>
  );
}
