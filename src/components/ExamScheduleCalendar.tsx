import React, { useState, useEffect } from "react";
import { Exam } from "../types";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  Filter, 
  Plus, 
  Check, 
  Edit2, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface ExamScheduleCalendarProps {
  exams: Exam[];
}

const defaultCohorts = ["Cohort Alpha", "Cohort Beta", "Cohort Gamma", "Cohort Delta"];

export default function ExamScheduleCalendar({ exams }: ExamScheduleCalendarProps) {
  // Anchored around July 6, 2026
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 6, 1)); // July 2026
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>("2026-07-06"); // Highlight today by default
  
  // State for exam schedules
  const [schedules, setSchedules] = useState<{
    [examId: string]: { date: string; cohort: string; startTime: string };
  }>(() => {
    const saved = localStorage.getItem("admin_exam_schedules");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return {};
  });

  // Schedule Editor Modal/Form State
  const [showEditor, setShowEditor] = useState(false);
  const [editingExamId, setEditingExamId] = useState("");
  const [editorDate, setEditorDate] = useState("2026-07-06");
  const [editorTime, setEditorTime] = useState("10:00");
  const [editorCohort, setEditorCohort] = useState("Cohort Alpha");

  // Filters State
  const [selectedCohortFilter, setSelectedCohortFilter] = useState("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");

  // Populate schedules with default values for new exams if not already present
  useEffect(() => {
    if (exams.length > 0) {
      setSchedules(prev => {
        const updated = { ...prev };
        let changed = false;
        const baseDate = new Date(2026, 6, 6); // July 6, 2026
        
        exams.forEach((exam, idx) => {
          if (!updated[exam.id]) {
            changed = true;
            // Distribute exams across days relative to today (July 6, 2026)
            let dayOffset = 0;
            if (idx === 0) dayOffset = 0; // Today (Ongoing)
            else if (idx === 1) dayOffset = 1; // Tomorrow (Upcoming)
            else if (idx === 2) dayOffset = -1; // Yesterday (Past)
            else {
              // Alternate future and past offsets
              dayOffset = (idx % 2 === 0 ? 1 : -1) * (Math.floor(idx / 2) * 2 + 1);
            }
            
            const d = new Date(baseDate);
            d.setDate(baseDate.getDate() + dayOffset);
            
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            
            updated[exam.id] = {
              date: `${yyyy}-${mm}-${dd}`,
              cohort: defaultCohorts[idx % defaultCohorts.length],
              startTime: "10:00"
            };
          }
        });
        
        if (changed) {
          localStorage.setItem("admin_exam_schedules", JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  }, [exams]);

  // Helper calendar functions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Build grid items for the selected month
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Previous month padding
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  const prevMonthDays = Array.from({ length: firstDayIndex }, (_, i) => {
    const dayNum = daysInPrevMonth - firstDayIndex + i + 1;
    return {
      day: dayNum,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      dateStr: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    };
  });

  // Current month
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    return {
      day: dayNum,
      month: month,
      year: year,
      isCurrentMonth: true,
      dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    };
  });

  // Next month padding to complete 6 weeks (42 slots)
  const totalSlots = 42;
  const nextMonthDaysCount = totalSlots - (prevMonthDays.length + currentMonthDays.length);
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const nextMonthDays = Array.from({ length: nextMonthDaysCount }, (_, i) => {
    const dayNum = i + 1;
    return {
      day: dayNum,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      dateStr: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    };
  });

  const allGridDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Map of cohorts dynamically collected
  const allUniqueCohorts = Array.from(
    new Set(Object.keys(schedules).map(id => schedules[id]?.cohort))
  ).filter(Boolean);

  // Helper to determine status based on anchored "today" (July 6, 2026)
  const todayStr = "2026-07-06";
  const getExamStatus = (dateStr: string) => {
    if (dateStr === todayStr) return "ongoing";
    return dateStr > todayStr ? "upcoming" : "past";
  };

  // Filter exams based on selected cohort & status filters
  const getFilteredScheduledExams = () => {
    return exams.map(exam => {
      const sched = schedules[exam.id];
      if (!sched) return null;
      
      const status = getExamStatus(sched.date);
      
      // Filter by Cohort
      if (selectedCohortFilter !== "All" && sched.cohort !== selectedCohortFilter) {
        return null;
      }
      
      // Filter by Status
      if (selectedStatusFilter !== "All" && status !== selectedStatusFilter.toLowerCase()) {
        return null;
      }

      return {
        ...exam,
        schedule: sched,
        status
      };
    }).filter(Boolean) as Array<Exam & { schedule: { date: string; cohort: string; startTime: string }; status: string }>;
  };

  const filteredExams = getFilteredScheduledExams();

  // Handle previous and next month clicks
  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  // Handle Quick Rescheduling/Creating schedule
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExamId) return;

    setSchedules(prev => {
      const updated = {
        ...prev,
        [editingExamId]: {
          date: editorDate,
          cohort: editorCohort,
          startTime: editorTime
        }
      };
      localStorage.setItem("admin_exam_schedules", JSON.stringify(updated));
      return updated;
    });

    setShowEditor(false);
    setEditingExamId("");
  };

  const openRescheduleForm = (examId: string) => {
    const existing = schedules[examId];
    setEditingExamId(examId);
    if (existing) {
      setEditorDate(existing.date);
      setEditorTime(existing.startTime);
      setEditorCohort(existing.cohort);
    } else {
      setEditorDate(selectedDayStr || "2026-07-06");
      setEditorTime("10:00");
      setEditorCohort("Cohort Alpha");
    }
    setShowEditor(true);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Exams scheduled for the currently selected day
  const selectedDayExams = filteredExams.filter(e => e.schedule.date === selectedDayStr);

  return (
    <div className="space-y-6">
      
      {/* Filters & Actions Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Active Academic Schedule
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Current system anchor is <strong className="text-indigo-600 dark:text-indigo-400">July 6, 2026 (Today)</strong>. Drag or adjust exam slots across cohort groups.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Cohort Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={selectedCohortFilter}
              onChange={(e) => setSelectedCohortFilter(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="All">All Cohorts</option>
              {allUniqueCohorts.map(cohort => (
                <option key={cohort} value={cohort}>{cohort}</option>
              ))}
              {defaultCohorts.map(c => !allUniqueCohorts.includes(c) && (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Ongoing">Ongoing (Today)</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Past">Past</option>
            </select>
          </div>

          {/* Manual Reschedule action */}
          <button
            onClick={() => {
              if (exams.length > 0) {
                openRescheduleForm(exams[0].id);
              } else {
                alert("Please create at least one exam in the Teacher Portal first.");
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/10 transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            Schedule Exam
          </button>
        </div>
      </div>

      {/* Main Grid Layout: Left is Calendar Grid (8 cols), Right is Day Details & Quick Rescheduling Form (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left column: Calendar Board */}
        <div className="xl:col-span-8 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm p-6 space-y-4">
          
          {/* Calendar Month Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                {monthNames[month]} {year}
              </span>
              {month === 6 && year === 2026 && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-500 text-white uppercase tracking-widest animate-pulse">
                  Current Month
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevMonth}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(2026, 6, 1))}
                className="px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                Reset to July &apos;26
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lightweight Calendar Grid */}
          <div className="border border-slate-150 dark:border-slate-900 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900/60">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-150 dark:border-slate-900 text-center py-2.5">
              {weekdayNames.map(name => (
                <span key={name} className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {name}
                </span>
              ))}
            </div>

            {/* Grid days */}
            <div className="grid grid-cols-7 gap-px bg-slate-150 dark:bg-slate-900">
              {allGridDays.map((day, idx) => {
                const isSelected = selectedDayStr === day.dateStr;
                const isToday = day.dateStr === todayStr;
                
                // Get exams for this specific calendar cell
                const dayExams = filteredExams.filter(e => e.schedule.date === day.dateStr);

                return (
                  <div
                    key={`${day.dateStr}-${idx}`}
                    onClick={() => setSelectedDayStr(day.dateStr)}
                    className={`min-h-[105px] p-2 bg-white dark:bg-slate-950 flex flex-col justify-between cursor-pointer select-none transition-all group relative hover:bg-slate-50/50 dark:hover:bg-slate-900/30 ${
                      !day.isCurrentMonth ? "opacity-35" : ""
                    } ${
                      isSelected ? "ring-2 ring-indigo-500 ring-inset z-10" : ""
                    }`}
                  >
                    {/* Day Number and visual Indicators */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${
                        isToday 
                          ? "w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20" 
                          : "text-slate-700 dark:text-slate-400"
                      }`}>
                        {day.day}
                      </span>
                      {dayExams.length > 0 && (
                        <span className="text-[9px] font-black font-mono text-slate-400 dark:text-slate-500">
                          {dayExams.length} {dayExams.length === 1 ? "Exam" : "Exams"}
                        </span>
                      )}
                    </div>

                    {/* Compact exam badges container */}
                    <div className="mt-2 space-y-1 overflow-y-auto max-h-[70px] pr-0.5 scrollbar-thin">
                      {dayExams.map(exam => {
                        let statusColor = "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
                        if (exam.status === "ongoing") {
                          statusColor = "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 ring-1 ring-emerald-500/20 animate-pulse";
                        } else if (exam.status === "past") {
                          statusColor = "bg-slate-100 text-slate-600 border-slate-200/50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800/60";
                        }

                        return (
                          <div
                            key={exam.id}
                            title={`${exam.title} (${exam.schedule.cohort} @ ${exam.schedule.startTime})`}
                            className={`p-1.5 text-[10px] rounded-lg border font-medium truncate leading-tight flex flex-col gap-0.5 ${statusColor}`}
                          >
                            <div className="font-extrabold truncate">{exam.title}</div>
                            <div className="flex items-center justify-between gap-1 text-[8px] opacity-80 font-semibold uppercase tracking-wider">
                              <span>{exam.schedule.cohort}</span>
                              <span className="font-mono font-bold">{exam.schedule.startTime}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Selected Day details, actions, and Schedule form */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Day Details panel */}
          <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm p-6 space-y-5">
            <div>
              <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">
                Schedules on Day
              </h3>
              <p className="text-xs text-indigo-500 font-bold font-mono mt-0.5">
                {selectedDayStr ? new Date(selectedDayStr).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Select a day"}
              </p>
            </div>

            {/* List of active exams for the selected day */}
            <div className="space-y-3 min-h-[180px] max-h-[320px] overflow-y-auto pr-1">
              {selectedDayExams.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-100 dark:border-slate-900 rounded-2xl h-full">
                  <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs font-semibold text-slate-400">No exams scheduled for this date</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Click another day or schedule an exam using the action options.</p>
                </div>
              ) : (
                selectedDayExams.map(exam => (
                  <div 
                    key={exam.id} 
                    className="p-4 border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
                          {exam.title}
                        </h4>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block mt-1">
                          Created by: {exam.creatorName}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => openRescheduleForm(exam.id)}
                        className="p-1 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition-colors"
                        title="Reschedule / Edit parameters"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                      <div className="px-2 py-1 rounded-lg border border-slate-100 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3 text-indigo-500" />
                        <span>{exam.schedule.cohort}</span>
                      </div>

                      <div className="px-2 py-1 rounded-lg border border-slate-100 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        <span>{exam.schedule.startTime}</span>
                      </div>

                      <div className="px-2 py-1 rounded-lg border border-slate-100 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1 font-mono">
                        <span>{exam.durationMinutes} mins</span>
                      </div>
                    </div>

                    {/* Badge Status */}
                    <div className="flex items-center justify-between pt-1">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                        exam.status === "ongoing"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : exam.status === "upcoming"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400"
                      }`}>
                        {exam.status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {exam.questions.length} questions
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Reschedule Form / Interactive Slider Panel */}
          {showEditor && (
            <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/20 dark:border-indigo-950/40 rounded-2xl p-6 shadow-md space-y-4 animate-scale-up">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-500" />
                  Reschedule Exam
                </h3>
                <button 
                  onClick={() => {
                    setShowEditor(false);
                    setEditingExamId("");
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveSchedule} className="space-y-4">
                {/* Select Exam */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Choose Active Exam Paper
                  </label>
                  <select
                    value={editingExamId}
                    onChange={(e) => {
                      const examId = e.target.value;
                      setEditingExamId(examId);
                      const existing = schedules[examId];
                      if (existing) {
                        setEditorDate(existing.date);
                        setEditorTime(existing.startTime);
                        setEditorCohort(existing.cohort);
                      }
                    }}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                  >
                    {exams.map(e => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>

                {/* Date Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editorDate}
                    onChange={(e) => setEditorDate(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                  />
                </div>

                {/* Time & Cohort Side-by-Side */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={editorTime}
                      onChange={(e) => setEditorTime(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Target Cohort
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cohort Alpha"
                      value={editorCohort}
                      onChange={(e) => setEditorCohort(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                    />
                  </div>
                </div>

                {/* Cohort quick suggestions */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quick Select Cohort:</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {defaultCohorts.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditorCohort(c)}
                        className={`px-2 py-1 text-[10px] font-extrabold rounded-lg border transition-all ${
                          editorCohort === c
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-500/10 text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Schedule Parameters
                </button>
              </form>
            </div>
          )}

          {/* Quick Informational Notice */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl text-[11px] text-slate-500 dark:text-slate-400 leading-normal flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-slate-700 dark:text-slate-300">How to use schedule:</span>
              <p className="mt-1">
                Admins can select any date cell in the grid to view current slots, adjust their target student cohort parameters, or update candidate schedules dynamically. Changes are preserved immediately.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
