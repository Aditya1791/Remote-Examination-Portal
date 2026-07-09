import React, { useState, useMemo } from "react";
import { TeacherAnalytics, Submission, Exam, ProctorLog } from "../types";
import { 
  Award, CheckCircle, Clock, AlertTriangle, TrendingUp, BarChart2,
  Search, ChevronUp, ChevronDown, Filter, XCircle, Info, Calendar,
  AlertCircle, ExternalLink, ShieldAlert, Sparkles, RefreshCw, User
} from "lucide-react";

interface DashboardChartsProps {
  analytics: TeacherAnalytics[];
  submissions?: Submission[];
  exams?: Exam[];
  proctorLogs?: ProctorLog[];
  onStartGrading?: (subId: string) => void;
}

export default function DashboardCharts({ 
  analytics, 
  submissions = [], 
  exams = [], 
  proctorLogs = [],
  onStartGrading 
}: DashboardChartsProps) {
  const [selectedExamId, setSelectedExamId] = useState<string>(
    analytics.length > 0 ? analytics[0].examId : ""
  );

  // Cross-filtering States
  const [activeScoreRange, setActiveScoreRange] = useState<string | null>(null);
  const [activePassFilter, setActivePassFilter] = useState<"passed" | "failed" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<"passed" | "failed" | null>(null);

  // Sorting for Drill-Down Table
  const [sortBy, setSortBy] = useState<"name" | "score" | "duration" | "warnings">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // If no exams or no analytics
  if (analytics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
        <BarChart2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No Analytics Data Available</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
          Once students start submitting completed exam answers, beautiful interactive visual metrics will populate this dashboard.
        </p>
      </div>
    );
  }

  // Handle Exam ID Change & Reset Active Filters
  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    setActiveScoreRange(null);
    setActivePassFilter(null);
    setSearchQuery("");
  };

  // Get active exam analytics
  const activeExam = analytics.find(a => a.examId === selectedExamId) || analytics[0];

  // Helper: check if a score is in a range string like "80-89%"
  const isScoreInRange = (score: number, maxScore: number, rangeStr: string): boolean => {
    const numbers = rangeStr.match(/\d+/g);
    if (!numbers || numbers.length < 2) return false;
    const min = parseInt(numbers[0], 10);
    const max = parseInt(numbers[1], 10);

    const percent = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const roundedPercent = Math.round(percent);
    return roundedPercent >= min && roundedPercent <= max;
  };

  // Get overall submissions for the selected exam
  const examSubmissions = useMemo(() => {
    return submissions.filter(s => s.examId === selectedExamId && s.status === 'submitted');
  }, [submissions, selectedExamId]);

  // Compute filtered submissions for drill-down & KPI recalculation
  const filteredSubmissions = useMemo(() => {
    return examSubmissions.filter(sub => {
      // Apply search filter first
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesName = sub.studentName.toLowerCase().includes(query);
        if (!matchesName) return false;
      }

      // Apply Score Range cross-filter
      if (activeScoreRange) {
        return isScoreInRange(sub.score, sub.maxScore || activeExam.maxScore || 100, activeScoreRange);
      }

      // Apply Pass/Fail status cross-filter
      if (activePassFilter) {
        const maxPts = sub.maxScore || activeExam.maxScore || 100;
        const isPassed = sub.score >= maxPts * 0.5;
        return activePassFilter === "passed" ? isPassed : !isPassed;
      }

      return true;
    });
  }, [examSubmissions, activeScoreRange, activePassFilter, searchQuery, activeExam.maxScore]);

  // Map warning counts for active exam submissions using proctor logs
  const submissionWarnings = useMemo(() => {
    const warningMap: { [studentId: string]: number } = {};
    examSubmissions.forEach(sub => {
      const studentLogs = proctorLogs.filter(
        log => log.examId === selectedExamId && log.studentId === sub.studentId
      );
      warningMap[sub.studentId] = studentLogs.length;
    });
    return warningMap;
  }, [examSubmissions, proctorLogs, selectedExamId]);

  // Sorted list of filtered submissions
  const sortedSubmissions = useMemo(() => {
    const list = [...filteredSubmissions];
    list.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortBy === "name") {
        valA = a.studentName.toLowerCase();
        valB = b.studentName.toLowerCase();
      } else if (sortBy === "score") {
        const maxA = a.maxScore || activeExam.maxScore || 100;
        const maxB = b.maxScore || activeExam.maxScore || 100;
        valA = maxA > 0 ? a.score / maxA : 0;
        valB = maxB > 0 ? b.score / maxB : 0;
      } else if (sortBy === "duration") {
        valA = a.durationSeconds || 0;
        valB = b.durationSeconds || 0;
      } else if (sortBy === "warnings") {
        valA = submissionWarnings[a.studentId] || 0;
        valB = submissionWarnings[b.studentId] || 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredSubmissions, sortBy, sortOrder, activeExam.maxScore, submissionWarnings]);

  // Filtered KPIs computation
  const overallCount = examSubmissions.length;
  const filteredCount = filteredSubmissions.length;
  const isFiltered = activeScoreRange !== null || activePassFilter !== null;

  const kpis = useMemo(() => {
    const maxPossiblePoints = activeExam.maxScore || 100;
    
    // Overall Stats
    const overallAvg = activeExam.averageScore;
    const overallMax = activeExam.maxScore;
    const overallDurationAvg = activeExam.durationAverageSeconds;
    const overallPassRate = activeExam.passRate;

    if (!isFiltered || filteredSubmissions.length === 0) {
      return {
        count: overallCount,
        averageScore: overallAvg,
        maxScore: overallMax,
        durationAverageSeconds: overallDurationAvg,
        passRate: overallPassRate,
        avgScorePercent: Math.min(Math.round((overallAvg / maxPossiblePoints) * 100), 100)
      };
    }

    // Recalculated Stats based on Filtered Cohort
    const totalScore = filteredSubmissions.reduce((sum, s) => sum + s.score, 0);
    const filteredAvg = Math.round((totalScore / filteredSubmissions.length) * 10) / 10;
    const filteredMax = Math.max(...filteredSubmissions.map(s => s.score));
    
    const totalDuration = filteredSubmissions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    const filteredDurationAvg = Math.round(totalDuration / filteredSubmissions.length);

    const passedCount = filteredSubmissions.filter(s => {
      const maxPts = s.maxScore || maxPossiblePoints;
      return s.score >= maxPts * 0.5;
    }).length;
    const filteredPassRate = Math.round((passedCount / filteredSubmissions.length) * 100);

    return {
      count: filteredCount,
      averageScore: filteredAvg,
      maxScore: filteredMax,
      durationAverageSeconds: filteredDurationAvg,
      passRate: filteredPassRate,
      avgScorePercent: Math.min(Math.round((filteredAvg / maxPossiblePoints) * 100), 100)
    };
  }, [isFiltered, filteredSubmissions, activeExam, overallCount, filteredCount]);

  // Pie/Donut Chart Computations
  const passRate = activeExam.passRate;
  const failRate = 100 - passRate;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const passStrokeDash = (passRate / 100) * circumference;
  const failStrokeDash = circumference - passStrokeDash;

  // Formatting duration helper
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Toggle Score Range filter
  const handleBarClick = (range: string) => {
    if (activeScoreRange === range) {
      setActiveScoreRange(null);
    } else {
      setActiveScoreRange(range);
      setActivePassFilter(null); // Clear pass/fail to avoid conflicting constraints
    }
  };

  // Toggle Pass/Fail filter
  const handlePassFilterToggle = (filterType: "passed" | "failed") => {
    if (activePassFilter === filterType) {
      setActivePassFilter(null);
    } else {
      setActivePassFilter(filterType);
      setActiveScoreRange(null); // Clear score distribution to avoid conflicting constraints
    }
  };

  const clearFilters = () => {
    setActiveScoreRange(null);
    setActivePassFilter(null);
    setSearchQuery("");
  };

  const handleSort = (field: "name" | "score" | "duration" | "warnings") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc"); // Default to descending
    }
  };

  // Compute Passed & Failed counts for rendering tooltips
  const passedStudentsCount = examSubmissions.filter(s => s.score >= (s.maxScore || activeExam.maxScore || 100) * 0.5).length;
  const failedStudentsCount = examSubmissions.length - passedStudentsCount;

  return (
    <div className="space-y-6">
      {/* Exam Selector Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Active Analysis Subject</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Toggle subjects to compare class scores, distributions, and velocities.</p>
        </div>
        <select
          value={selectedExamId}
          onChange={(e) => handleExamChange(e.target.value)}
          className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all max-w-md cursor-pointer"
        >
          {analytics.map((exam) => (
            <option key={exam.examId} value={exam.examId}>
              {exam.examTitle}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards Grid with Interactive Recalculation Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Submissions Card */}
        <div className={`p-5 bg-white dark:bg-slate-950 border rounded-2xl shadow-sm transition-all flex items-center justify-between ${
          isFiltered ? "border-indigo-100 dark:border-indigo-950/40 bg-indigo-50/5 dark:bg-indigo-950/5" : "border-slate-100 dark:border-slate-900"
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Submissions</p>
              {isFiltered && (
                <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">Filtered</span>
              )}
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {kpis.count}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {isFiltered ? `Out of ${overallCount} overall` : "100% submission validity"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Average Grade Card */}
        <div className={`p-5 bg-white dark:bg-slate-950 border rounded-2xl shadow-sm transition-all flex items-center justify-between ${
          isFiltered ? "border-indigo-100 dark:border-indigo-950/40 bg-indigo-50/5 dark:bg-indigo-950/5" : "border-slate-100 dark:border-slate-900"
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Average Score</p>
              {isFiltered && (
                <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">Filtered</span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{kpis.averageScore}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">/ {activeExam.maxScore || 100} pts</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Cohort average: <span className="font-bold text-indigo-600 dark:text-indigo-400">{kpis.avgScorePercent}%</span>
              {isFiltered && <span className="text-[10px] text-slate-400 block mt-0.5">Overall average: {activeExam.averageScore}</span>}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Highest Score Card */}
        <div className={`p-5 bg-white dark:bg-slate-950 border rounded-2xl shadow-sm transition-all flex items-center justify-between ${
          isFiltered ? "border-indigo-100 dark:border-indigo-950/40 bg-indigo-50/5 dark:bg-indigo-950/5" : "border-slate-100 dark:border-slate-900"
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Highest Score</p>
              {isFiltered && (
                <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">Filtered</span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{kpis.maxScore}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">/ {activeExam.maxScore || 100} pts</p>
            </div>
            <p className="text-xs text-indigo-500 font-medium">
              {isFiltered ? "Cohort Peak" : "Top capability threshold"}
              {isFiltered && <span className="text-[10px] text-slate-400 block mt-0.5">Overall peak: {activeExam.maxScore}</span>}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Average Duration Card */}
        <div className={`p-5 bg-white dark:bg-slate-950 border rounded-2xl shadow-sm transition-all flex items-center justify-between ${
          isFiltered ? "border-indigo-100 dark:border-indigo-950/40 bg-indigo-50/5 dark:bg-indigo-950/5" : "border-slate-100 dark:border-slate-900"
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Duration</p>
              {isFiltered && (
                <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">Filtered</span>
              )}
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatDuration(kpis.durationAverageSeconds)}
            </p>
            <p className="text-xs text-amber-500 font-medium">
              {isFiltered ? "Cohort Velocity" : "Solving completion velocity"}
              {isFiltered && <span className="text-[10px] text-slate-400 block mt-0.5">Overall avg: {formatDuration(activeExam.durationAverageSeconds)}</span>}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Floating Active Filter Action Ribbon */}
      {isFiltered && (
        <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Active Cohort Filter:{" "}
              </span>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-lg shadow-2xs">
                {activeScoreRange 
                  ? `Score Bracket (${activeScoreRange})` 
                  : activePassFilter === "passed" 
                    ? "Passed Candidates (≥50%)" 
                    : "Failed Candidates (<50%)"
                }
              </span>
              <span className="text-slate-400 font-medium ml-2">
                ({filteredCount} of {overallCount} candidates match)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Clear Filter</span>
          </button>
        </div>
      )}

      {/* Analytics Visualizers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Score Distribution (Bar Chart) - Occupies 7 columns */}
        <div className="lg:col-span-7 p-6 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-bold text-slate-800 dark:text-slate-100">Score Distribution Curve</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500">Click individual brackets to filter candidates below.</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Interactive Histogram</span>
            </span>
          </div>

          <div className="pt-8 pb-2">
            {/* Custom Interactive Bar Graph */}
            <div className="relative w-full h-[220px] flex items-end justify-between px-2">
              {/* Y-axis grids */}
              <div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-100 dark:border-slate-900/40 h-0" />
              <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-slate-100 dark:border-slate-900/40 h-0" />
              <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-slate-100 dark:border-slate-900/40 h-0" />
              <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-slate-100 dark:border-slate-900/40 h-0" />

              {activeExam.scoreDistribution.map((dist, idx) => {
                // Find max count to normalize heights
                const maxCount = Math.max(...activeExam.scoreDistribution.map(d => d.count), 1);
                const heightPercent = Math.max((dist.count / maxCount) * 82, 5); // minimum height 5%

                const isSelected = activeScoreRange === dist.range;
                const isAnySelected = activeScoreRange !== null;
                const isHovered = hoveredBarIndex === idx;

                let barColorClass = "from-blue-600/10 to-blue-600 hover:from-indigo-600/10 hover:to-indigo-600";
                
                if (isAnySelected) {
                  if (isSelected) {
                    barColorClass = "from-indigo-600/30 to-indigo-600 ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-slate-950 scale-102";
                  } else {
                    barColorClass = "from-slate-400/5 to-slate-400/30 opacity-35";
                  }
                }

                const distPercentage = overallCount > 0 ? Math.round((dist.count / overallCount) * 100) : 0;

                return (
                  <div 
                    key={idx} 
                    className="group relative flex flex-col items-center flex-1 h-full justify-end z-10 cursor-pointer"
                    onClick={() => handleBarClick(dist.range)}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Floating Rich Tooltip */}
                    <div className={`absolute -top-16 bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-900 p-2 rounded-xl text-[11px] font-medium shadow-xl z-30 whitespace-nowrap transition-all duration-150 transform ${
                      isHovered ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-2"
                    }`}>
                      <div className="font-bold border-b border-white/10 dark:border-slate-200 pb-0.5 mb-1 text-center text-indigo-400 dark:text-indigo-600">
                        Bracket: {dist.range}
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-extrabold text-sm">{dist.count} student{dist.count !== 1 && "s"}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{distPercentage}% of total class</span>
                        <span className="text-[9px] text-indigo-400 mt-1 flex items-center gap-0.5">
                          {isSelected ? "⚡ Click to clear filter" : "👆 Click to filter cohort"}
                        </span>
                      </div>
                    </div>

                    {/* Bar visual container */}
                    <div 
                      className={`w-[60%] sm:w-[50%] max-w-[50px] relative rounded-t-lg transition-all duration-300 ease-out flex items-end bg-gradient-to-t shadow-xs ${barColorClass}`}
                      style={{ height: `${heightPercent}%` }}
                    >
                      {/* Highlight reflection bar at the top */}
                      <div className="absolute inset-x-0 top-0 h-1 bg-white/20 rounded-t-md" />
                      
                      {/* Numeric indicator above the bar */}
                      <span className={`absolute -top-6 inset-x-0 text-center text-xs font-black transition-colors ${
                        isSelected 
                          ? "text-indigo-600 dark:text-indigo-400" 
                          : isAnySelected && !isSelected 
                            ? "text-slate-400" 
                            : "text-slate-700 dark:text-slate-300"
                      }`}>
                        {dist.count}
                      </span>
                    </div>

                    {/* X-axis labels */}
                    <div className={`mt-2 text-center text-[11px] font-bold transition-all ${
                      isSelected 
                        ? "text-indigo-600 dark:text-indigo-400 scale-105" 
                        : isAnySelected && !isSelected 
                          ? "text-slate-400" 
                          : "text-slate-500 dark:text-slate-400"
                    }`}>
                      {dist.range}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* X-axis solid rule */}
            <div className="w-full h-[1px] bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        {/* 2. Pass vs Fail Ratio (Pie/Donut Chart) - Occupies 5 columns */}
        <div className="lg:col-span-5 p-6 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-md font-bold text-slate-800 dark:text-slate-100">Success Ratio (Pass/Fail)</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500">Interactive: Click slices or legends below to filter candidates.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around py-4 gap-4">
            {/* SVG Donut with Center-Text Hover Feedback */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90 select-none" viewBox="0 0 120 120">
                {/* Background base ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className="fill-none stroke-slate-100 dark:stroke-slate-900"
                  strokeWidth="12"
                />

                {/* Fail segments with mouse triggers */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className={`fill-none stroke-rose-500 transition-all duration-300 cursor-pointer ${
                    activePassFilter === "failed" 
                      ? "stroke-[15px]" 
                      : activePassFilter === "passed" 
                        ? "opacity-30 stroke-[8px]" 
                        : "hover:stroke-[14px]"
                  }`}
                  strokeWidth="12"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset="0"
                  onClick={() => handlePassFilterToggle("failed")}
                  onMouseEnter={() => setHoveredSegment("failed")}
                  onMouseLeave={() => setHoveredSegment(null)}
                />

                {/* Pass segments overlay with mouse triggers */}
                {passRate > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    className={`fill-none stroke-emerald-500 transition-all duration-500 cursor-pointer ${
                      activePassFilter === "passed" 
                        ? "stroke-[15px]" 
                        : activePassFilter === "failed" 
                          ? "opacity-30 stroke-[8px]" 
                          : "hover:stroke-[14px]"
                    }`}
                    strokeWidth="12"
                    strokeDasharray={`${passStrokeDash} ${circumference}`}
                    strokeDashoffset="0"
                    onClick={() => handlePassFilterToggle("passed")}
                    onMouseEnter={() => setHoveredSegment("passed")}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                )}
              </svg>

              {/* Dynamic Centered labels (React HUD state) */}
              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none select-none">
                {hoveredSegment === "passed" ? (
                  <>
                    <span className="text-2xl font-black text-emerald-500 leading-none">{passRate}%</span>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-1">{passedStudentsCount} Passed</span>
                  </>
                ) : hoveredSegment === "failed" ? (
                  <>
                    <span className="text-2xl font-black text-rose-500 leading-none">{failRate}%</span>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-1">{failedStudentsCount} Failed</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{passRate}%</span>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-1">Pass Rate</span>
                  </>
                )}
              </div>
            </div>

            {/* Interactive Legends */}
            <div className="space-y-3 min-w-[130px]">
              {/* Passed Card Legend */}
              <div 
                className={`flex items-start gap-2 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                  activePassFilter === "passed"
                    ? "bg-emerald-500/5 border-emerald-500/30 scale-102 ring-1 ring-emerald-400"
                    : activePassFilter === "failed"
                      ? "opacity-40 border-transparent hover:opacity-70"
                      : "border-slate-100/10 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                }`}
                onClick={() => handlePassFilterToggle("passed")}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 mt-0.5 shadow-xs shadow-emerald-500/30" />
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Passed (≥50%)</p>
                  <p className="text-md font-black text-emerald-500">{passRate}%</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {passedStudentsCount} Candidates
                  </p>
                </div>
              </div>

              {/* Failed Card Legend */}
              <div 
                className={`flex items-start gap-2 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                  activePassFilter === "failed"
                    ? "bg-rose-500/5 border-rose-500/30 scale-102 ring-1 ring-rose-400"
                    : activePassFilter === "passed"
                      ? "opacity-40 border-transparent hover:opacity-70"
                      : "border-slate-100/10 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                }`}
                onClick={() => handlePassFilterToggle("failed")}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500 mt-0.5 shadow-xs shadow-rose-500/30" />
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Failed (&lt;50%)</p>
                  <p className="text-md font-black text-rose-500">{failRate}%</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {failedStudentsCount} Candidates
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
            <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">
              {passRate >= 75 
                ? "Excellent class progress! Strong baseline performance achieved."
                : passRate >= 50 
                  ? "Steady success average. Focus on weaker distribution clusters."
                  : "Needs attention. Distribution peaks reside below passing margins."}
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION: DRILL-DOWN STUDENT SUBMISSION ANALYSIS COHORT TABLE */}
      {/* ===================================================================== */}
      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm p-6 space-y-4">
        
        {/* Drill-down Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-900">
          <div>
            <h3 className="text-md font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-sans tracking-tight">
              <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Cohort Analysis & Drill-Down Registry</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {isFiltered 
                ? `Drill-down perspective for the selected cohort filter (${filteredCount} matching)`
                : `All submitted answer sheets for this subject (${overallCount} total)`
              }
            </p>
          </div>

          {/* Quick-Stats Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-100 dark:border-slate-800">
              Showing {sortedSubmissions.length} of {examSubmissions.length} candidates
            </span>
          </div>
        </div>

        {/* Filters and search controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Reset buttons and helper filters */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Drill-down Submissions Table */}
        {sortedSubmissions.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-100 dark:border-slate-900/80 rounded-xl bg-slate-50/20 dark:bg-slate-900/10">
            <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h5 className="text-xs font-black text-slate-700 dark:text-slate-300">No Candidates Match Query</h5>
            <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto">
              No exam submissions fit your active score range, pass filters, or search criteria. Try modifying your dashboard selection or search term.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-900">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100 dark:border-slate-900">
                  <th 
                    className="p-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/60 transition-colors select-none"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Candidate</span>
                      {sortBy === "name" && (sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/60 transition-colors select-none"
                    onClick={() => handleSort("score")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Score Achieved</span>
                      {sortBy === "score" && (sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/60 transition-colors select-none"
                    onClick={() => handleSort("duration")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Duration Spent</span>
                      {sortBy === "duration" && (sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/60 transition-colors select-none"
                    onClick={() => handleSort("warnings")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Integrity Index</span>
                      {sortBy === "warnings" && (sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                    </div>
                  </th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60 text-slate-700 dark:text-slate-300 font-medium">
                {sortedSubmissions.map((sub) => {
                  const maxPts = sub.maxScore || activeExam.maxScore || 100;
                  const isPassed = sub.score >= maxPts * 0.5;
                  const scorePercent = maxPts > 0 ? Math.round((sub.score / maxPts) * 100) : 0;
                  const warnings = submissionWarnings[sub.studentId] || 0;

                  return (
                    <tr 
                      key={sub.id} 
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all"
                    >
                      {/* Name & Avatar column */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs border border-slate-200 dark:border-slate-800 shadow-3xs uppercase shrink-0">
                            {sub.studentName.substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{sub.studentName}</p>
                            <p className="text-[10px] text-slate-400 truncate">ID: {sub.studentId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Score achievement + visual miniature progress bar */}
                      <td className="p-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 dark:text-slate-50">{sub.score}</span>
                            <span className="text-[10px] text-slate-400">/ {maxPts} pts</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ml-1 ${
                              isPassed 
                                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400" 
                                : "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400"
                            }`}>
                              {scorePercent}%
                            </span>
                          </div>
                          {/* Miniature visual progress bar */}
                          <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full mt-1.5 overflow-hidden border border-slate-200/40 dark:border-slate-800">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isPassed ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${scorePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Solving duration */}
                      <td className="p-3 text-center">
                        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {sub.durationSeconds ? formatDuration(sub.durationSeconds) : "N/A"}
                        </span>
                      </td>

                      {/* Integrity warning count log index */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center justify-center">
                          {warnings === 0 ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-100/40 dark:border-emerald-900/20">
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              <span>Excellent (0 flags)</span>
                            </span>
                          ) : warnings <= 2 ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold border border-amber-100/40 dark:border-amber-900/20">
                              <AlertTriangle className="w-3 h-3 text-amber-500 animate-pulse" />
                              <span>Fair ({warnings} flag{warnings !== 1 && "s"})</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold border border-rose-100/40 dark:border-rose-900/20">
                              <ShieldAlert className="w-3 h-3 text-rose-500 animate-bounce" />
                              <span>At Risk ({warnings} flag{warnings !== 1 && "s"})</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Submission Grading and analysis action handlers */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onStartGrading ? (
                            <button
                              type="button"
                              onClick={() => onStartGrading(sub.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px] transition-all cursor-pointer shadow-3xs"
                            >
                              <span>Grade Answers</span>
                              <ExternalLink className="w-3 h-3 text-indigo-500" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium italic">Cannot Grade</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
