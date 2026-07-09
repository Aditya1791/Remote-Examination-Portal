import React, { useState, useEffect } from "react";
import { Exam, Question, Submission, TeacherAnalytics, ProctorLog, QuestionType } from "../types";
import RichTextEditor from "./RichTextEditor";
import DashboardCharts from "./DashboardCharts";
import ViolationTimelineChart from "./ViolationTimelineChart";
import { 
  Plus, Edit3, Trash2, Check, RefreshCw, Sparkles, BookOpen, 
  HelpCircle, Clipboard, Star, BarChart2, MessageSquare, AlertCircle, 
  ChevronRight, Calendar, User, Clock, Settings, Save, X, ShieldAlert,
  Terminal, Activity, Users, Paperclip, Mic, Bookmark, Copy, AlertTriangle, Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ExamTemplate {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  proctorRules?: {
    warningThreshold: number;
    blockCopyPaste: boolean;
    autoSubmitOnViolation: boolean;
    enableNoiseDetection: boolean;
    noiseThreshold: number;
  };
  questions: Question[];
  isCustom?: boolean;
}

export interface QuestionTemplate {
  id: string;
  name: string;
  question: Partial<Question>;
  isCustom?: boolean;
}

const SEED_EXAM_TEMPLATES: ExamTemplate[] = [
  {
    id: "tpl-mcq-quiz",
    name: "Quick Assessment Quiz (MCQ)",
    description: "A simple 15-minute, 3-question multiple choice test layout ideal for weekly checks and quick validation.",
    durationMinutes: 15,
    proctorRules: {
      warningThreshold: 3,
      blockCopyPaste: true,
      autoSubmitOnViolation: false,
      enableNoiseDetection: false,
      noiseThreshold: 50
    },
    questions: [
      {
        id: "q-tpl-mcq-1",
        questionText: "<p>Which of the following is NOT a fundamental principle of Object-Oriented Programming (OOP)?</p>",
        type: "mcq",
        options: ["Inheritance", "Polymorphism", "Compilation", "Encapsulation"],
        correctAnswer: "Compilation",
        points: 5
      },
      {
        id: "q-tpl-mcq-2",
        questionText: "<p>What is the time complexity of searching in a perfectly balanced Binary Search Tree (BST)?</p>",
        type: "mcq",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctAnswer: "O(log n)",
        points: 5
      },
      {
        id: "q-tpl-mcq-3",
        questionText: "<p>Which HTTP method is primarily used to apply partial modifications to a resource?</p>",
        type: "mcq",
        options: ["GET", "PUT", "PATCH", "POST"],
        correctAnswer: "PATCH",
        points: 5
      }
    ]
  },
  {
    id: "tpl-prog-lab",
    name: "Programming Practicum & System Design",
    description: "A robust 90-minute examination containing programming challenges, system design essay prompts, and PDF diagram uploads.",
    durationMinutes: 90,
    proctorRules: {
      warningThreshold: 2,
      blockCopyPaste: true,
      autoSubmitOnViolation: true,
      enableNoiseDetection: false,
      noiseThreshold: 50
    },
    questions: [
      {
        id: "q-tpl-prog-1",
        questionText: "<p><strong>Conceptual Essay:</strong> Compare Monolithic and Microservice architectures in detail. Discuss when to transition from a monolith to microservices and explain at least two common patterns for distributed data management.</p>",
        type: "short",
        correctAnswer: "",
        points: 20
      },
      {
        id: "q-tpl-prog-2",
        questionText: "<p><strong>Programming Challenge:</strong> Implement a function `isPalindrome(str)` that checks whether a given string is a palindrome. It should ignore casing, spacing, and special characters.</p>",
        type: "code",
        correctAnswer: "function isPalindrome(str) {\n  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return clean === clean.split('').reverse().join('');\n}",
        points: 30,
        codeLanguage: "javascript",
        codeTemplate: "function isPalindrome(str) {\n  // Write your code implementation here\n  \n}"
      },
      {
        id: "q-tpl-prog-3",
        questionText: "<p><strong>Technical Upload:</strong> Submit your comprehensive database schema diagram or architectural diagram showing API Gateway and downstream services. Only PDF/PNG formats under 10MB are accepted.</p>",
        type: "file",
        correctAnswer: "",
        points: 20,
        maxFileSizeMB: 10
      }
    ]
  },
  {
    id: "tpl-oral-presentation",
    name: "Oral Viva & Presentation Assessment",
    description: "A 30-minute exam focusing on verbal explanations and presentation skills under real-time audio/video monitoring rules.",
    durationMinutes: 30,
    proctorRules: {
      warningThreshold: 4,
      blockCopyPaste: false,
      autoSubmitOnViolation: false,
      enableNoiseDetection: true,
      noiseThreshold: 60
    },
    questions: [
      {
        id: "q-tpl-oral-1",
        questionText: "<p><strong>Oral Presentation:</strong> Explain the key differences between ACID and BASE properties in database engines. Discuss why a high-scale application might trade consistency for availability under the CAP theorem.</p>",
        type: "audio-video",
        correctAnswer: "",
        points: 20,
        recordingDurationSeconds: 60
      },
      {
        id: "q-tpl-oral-2",
        questionText: "<p><strong>Brief Explanation:</strong> Detail why write-heavy applications often implement write-ahead logs (WAL) before persisting state. Explain the recovery process during unexpected crashes.</p>",
        type: "short",
        correctAnswer: "",
        points: 15
      }
    ]
  }
];

const SEED_QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    id: "qtpl-mcq",
    name: "Standard 4-Choice MCQ Prompt",
    question: {
      questionText: "<p>Select the option that best describes the purpose of...</p>",
      type: "mcq",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
      points: 5
    }
  },
  {
    id: "qtpl-factorial",
    name: "Algorithms: Factorial Code Challenge",
    question: {
      questionText: "<p><strong>Programming Challenge:</strong> Write an optimized recursive or iterative function that returns the factorial of a positive integer.</p>",
      type: "code",
      correctAnswer: "function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}",
      points: 10,
      codeLanguage: "javascript",
      codeTemplate: "function factorial(n) {\n  // Write your structural code implementation here\n  \n}"
    }
  },
  {
    id: "qtpl-technical-doc",
    name: "Technical Document Upload Space",
    question: {
      questionText: "<p><strong>Technical Submission Space:</strong> Upload your certified database schema diagram, technical report, or UML design specification (PDF format, under 10MB).</p>",
      type: "file",
      correctAnswer: "",
      points: 15,
      maxFileSizeMB: 10
    }
  },
  {
    id: "qtpl-oral-presentation",
    name: "Oral Viva Prompt (60 Seconds)",
    question: {
      questionText: "<p><strong>Verbal Presentation:</strong> Articulate the design choices behind your selection of an asynchronous messaging queue (e.g. RabbitMQ vs Kafka) for transactional workloads in under 60 seconds.</p>",
      type: "audio-video",
      correctAnswer: "",
      points: 15,
      recordingDurationSeconds: 60
    }
  }
];

interface TeacherPortalProps {
  token: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function TeacherPortal({ token, activeTab, setActiveTab }: TeacherPortalProps) {
  // Tabs: 'exams', 'submissions', 'analytics'
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [analytics, setAnalytics] = useState<TeacherAnalytics[]>([]);
  const [proctorLogs, setProctorLogs] = useState<ProctorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Exam Editor state
  const [editingExam, setEditingExam] = useState<Partial<Exam> | null>(null);
  const [isNewExam, setIsNewExam] = useState(false);

  // Template Library states
  const [examTemplates, setExamTemplates] = useState<ExamTemplate[]>(() => {
    const saved = localStorage.getItem("custom_exam_templates");
    const custom = saved ? JSON.parse(saved) : [];
    return [...SEED_EXAM_TEMPLATES, ...custom.map((c: any) => ({ ...c, isCustom: true }))];
  });

  const [questionTemplates, setQuestionTemplates] = useState<QuestionTemplate[]>(() => {
    const saved = localStorage.getItem("custom_question_templates");
    const custom = saved ? JSON.parse(saved) : [];
    return [...SEED_QUESTION_TEMPLATES, ...custom.map((c: any) => ({ ...c, isCustom: true }))];
  });

  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [templateLibraryActiveTab, setTemplateLibraryActiveTab] = useState<"exams" | "questions">("exams");
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [saveTemplateDesc, setSaveTemplateDesc] = useState("");
  const [showSaveExamTplModal, setShowSaveExamTplModal] = useState(false);
  const [showSaveQTplModal, setShowSaveQTplModal] = useState<Question | null>(null);
  const [showInsertQuestionTplModal, setShowInsertQuestionTplModal] = useState(false);

  const handleSaveExamAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam || !saveTemplateName.trim()) return;
    const newTpl: ExamTemplate = {
      id: `tpl-custom-${Date.now()}`,
      name: saveTemplateName.trim(),
      description: saveTemplateDesc.trim() || "Custom saved exam layout",
      durationMinutes: editingExam.durationMinutes || 30,
      proctorRules: editingExam.proctorRules ? { ...editingExam.proctorRules } : {
        warningThreshold: 3,
        blockCopyPaste: true,
        autoSubmitOnViolation: false,
        enableNoiseDetection: false,
        noiseThreshold: 50
      },
      questions: editingExam.questions ? [...editingExam.questions] : [],
      isCustom: true
    };
    const updated = [...examTemplates, newTpl];
    setExamTemplates(updated);
    localStorage.setItem("custom_exam_templates", JSON.stringify(updated.filter(t => t.isCustom)));
    setShowSaveExamTplModal(false);
    setSaveTemplateName("");
    setSaveTemplateDesc("");
  };

  const handleSaveQuestionAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSaveQTplModal || !saveTemplateName.trim()) return;
    const newQ: QuestionTemplate = {
      id: `qtpl-custom-${Date.now()}`,
      name: saveTemplateName.trim(),
      question: { ...showSaveQTplModal },
      isCustom: true
    };
    const updated = [...questionTemplates, newQ];
    setQuestionTemplates(updated);
    localStorage.setItem("custom_question_templates", JSON.stringify(updated.filter(t => t.isCustom)));
    setShowSaveQTplModal(null);
    setSaveTemplateName("");
  };

  const handleDeleteExamTemplate = (id: string) => {
    const updated = examTemplates.filter(t => t.id !== id);
    setExamTemplates(updated);
    localStorage.setItem("custom_exam_templates", JSON.stringify(updated.filter(t => t.isCustom)));
  };

  const handleDeleteQuestionTemplate = (id: string) => {
    const updated = questionTemplates.filter(t => t.id !== id);
    setQuestionTemplates(updated);
    localStorage.setItem("custom_question_templates", JSON.stringify(updated.filter(t => t.isCustom)));
  };

  const handleApplyExamTemplate = (tpl: ExamTemplate) => {
    setEditingExam({
      title: tpl.name,
      description: tpl.description,
      durationMinutes: tpl.durationMinutes,
      proctorRules: tpl.proctorRules ? { ...tpl.proctorRules } : {
        warningThreshold: 3,
        blockCopyPaste: true,
        autoSubmitOnViolation: false,
        enableNoiseDetection: false,
        noiseThreshold: 50
      },
      questions: tpl.questions.map(q => ({
        ...q,
        id: `q-${Math.random().toString(36).substring(2, 9)}`
      }))
    });
    setIsNewExam(true);
    setShowTemplateLibrary(false);
  };

  const handleInsertQuestionTemplate = (tpl: QuestionTemplate) => {
    if (!editingExam) return;
    const newQ: Question = {
      id: `q-${Math.random().toString(36).substring(2, 9)}`,
      questionText: tpl.question.questionText || "<p>New question prompt...</p>",
      type: tpl.question.type || "mcq",
      options: tpl.question.options ? [...tpl.question.options] : undefined,
      correctAnswer: tpl.question.correctAnswer || "",
      points: tpl.question.points || 10,
      codeLanguage: tpl.question.codeLanguage,
      codeTemplate: tpl.question.codeTemplate,
      maxFileSizeMB: tpl.question.maxFileSizeMB,
      recordingDurationSeconds: tpl.question.recordingDurationSeconds
    };
    setEditingExam(prev => ({
      ...prev,
      questions: [...(prev?.questions || []), newQ]
    }));
    setShowInsertQuestionTplModal(false);
  };

  // Active Grading State
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [gradingSubDetail, setGradingSubDetail] = useState<{ submission: Submission; exam: Exam } | null>(null);
  const [gradingScores, setGradingScores] = useState<{ [qId: string]: number }>({});
  const [gradingFeedback, setGradingFeedback] = useState("");
  const [gradingResultStatus, setGradingResultStatus] = useState<'passed' | 'failed' | 'auto'>('auto');
  const [savingGrade, setSavingGrade] = useState(false);

  // Proctoring Overview & Stream states
  const [expandedStudentExam, setExpandedStudentExam] = useState<string | null>(null);
  const [logFilterEvent, setLogFilterEvent] = useState<string>("all");
  const [logSearchQuery, setLogSearchQuery] = useState<string>("");
  const [logFilterExam, setLogFilterExam] = useState<string>("all");

  // Proctor Intervention State
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [interventionStudent, setInterventionStudent] = useState<{ id: string, name: string } | null>(null);
  const [interventionExam, setInterventionExam] = useState<{ id: string, title: string } | null>(null);
  const [interventionMessage, setInterventionMessage] = useState("");
  const [sendingIntervention, setSendingIntervention] = useState(false);
  const [interventionError, setInterventionError] = useState<string | null>(null);
  const [interventionSuccess, setInterventionSuccess] = useState<string | null>(null);

  const handleSendIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interventionStudent || !interventionExam || !interventionMessage.trim()) return;

    setSendingIntervention(true);
    setInterventionError(null);
    setInterventionSuccess(null);

    try {
      const res = await fetch("/api/proctor/warn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: interventionStudent.id,
          examId: interventionExam.id,
          message: interventionMessage.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send intervention warning.");
      }

      setInterventionSuccess("Proctor intervention warning has been registered and streamed to the student successfully!");
      setInterventionMessage("");
      
      // Refresh log stream to immediately show the intervention log!
      fetchData();

      // Auto-dismiss success and close after 2 seconds
      setTimeout(() => {
        setInterventionModalOpen(false);
        setInterventionSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setInterventionError(err.message || "Network error occurred sending warning.");
    } finally {
      setSendingIntervention(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [examsRes, submissionsRes, analyticsRes, proctorLogsRes] = await Promise.all([
        fetch("/api/exams", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/submissions", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/teacher/analytics", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/proctor/logs", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!examsRes.ok || !submissionsRes.ok || !analyticsRes.ok || !proctorLogsRes.ok) {
        throw new Error("Failed to load Teacher datasets.");
      }

      setExams(await examsRes.json());
      setSubmissions(await submissionsRes.json());
      setAnalytics(await analyticsRes.json());
      setProctorLogs(await proctorLogsRes.json());
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load teacher workspace. Connect Express server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Real-time logs and telemetry background sync
  useEffect(() => {
    if (activeTab === "proctor-logs" || activeTab === "dashboard") {
      const interval = setInterval(() => {
        fetch("/api/proctor/logs", { headers: { Authorization: `Bearer ${token}` } })
          .then(res => {
            if (res.ok) return res.json();
            throw new Error();
          })
          .then(logs => setProctorLogs(logs))
          .catch(() => {});

        fetch("/api/submissions", { headers: { Authorization: `Bearer ${token}` } })
          .then(res => {
            if (res.ok) return res.json();
            throw new Error();
          })
          .then(subs => setSubmissions(subs))
          .catch(() => {});
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [activeTab, token]);

  // Exam Creator Helper
  const handleStartCreateExam = () => {
    setEditingExam({
      title: "",
      description: "",
      durationMinutes: 30,
      proctorRules: {
        warningThreshold: 3,
        blockCopyPaste: true,
        autoSubmitOnViolation: false,
        enableNoiseDetection: false,
        noiseThreshold: 50
      },
      questions: [
        {
          id: `q-${Math.random().toString(36).substring(2, 9)}`,
          questionText: "<p>Type question description here...</p>",
          type: "mcq",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "Option A",
          points: 10
        }
      ]
    });
    setIsNewExam(true);
  };

  const handleStartEditExam = (exam: Exam) => {
    setEditingExam({
      ...exam,
      proctorRules: exam.proctorRules || {
        warningThreshold: 3,
        blockCopyPaste: true,
        autoSubmitOnViolation: false,
        enableNoiseDetection: false,
        noiseThreshold: 50
      }
    });
    setIsNewExam(false);
  };

  const handleAddQuestion = (type: QuestionType) => {
    if (!editingExam) return;
    const newQ: Question = {
      id: `q-${Math.random().toString(36).substring(2, 9)}`,
      questionText: type === "code" 
        ? "<p><strong>Programming Challenge:</strong> Write a function that returns the factorial of a positive integer.</p>" 
        : type === "file" 
        ? "<p><strong>Submission Slot:</strong> Upload your certified technical architect report or diagrams (PDF format preferred).</p>"
        : type === "audio-video"
        ? "<p><strong>Verbal Presentation:</strong> Explain the key differences between ACID and BASE database properties in under 60 seconds.</p>"
        : "<p>New question prompt...</p>",
      type,
      options: type === "mcq" ? ["Option A", "Option B", "Option C", "Option D"] : undefined,
      correctAnswer: type === "mcq" ? "Option A" : type === "code" ? "function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}" : "",
      points: 10,
      codeLanguage: type === "code" ? "javascript" : undefined,
      codeTemplate: type === "code" ? "function factorial(n) {\n  // Write your structural code implementation here\n  \n}" : undefined,
      maxFileSizeMB: type === "file" ? 10 : undefined,
      recordingDurationSeconds: type === "audio-video" ? 60 : undefined
    };
    setEditingExam(prev => ({
      ...prev,
      questions: [...(prev?.questions || []), newQ]
    }));
  };

  const handleRemoveQuestion = (idx: number) => {
    if (!editingExam) return;
    setEditingExam(prev => ({
      ...prev,
      questions: (prev?.questions || []).filter((_, i) => i !== idx)
    }));
  };

  const handleQuestionChange = (idx: number, updatedQ: Question) => {
    if (!editingExam) return;
    const updatedQs = [...(editingExam.questions || [])];
    updatedQs[idx] = updatedQ;
    setEditingExam(prev => ({
      ...prev,
      questions: updatedQs
    }));
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam?.title || !editingExam.description || !editingExam.durationMinutes) {
      alert("Please fill out all required exam details.");
      return;
    }

    if (!editingExam.questions || editingExam.questions.length === 0) {
      alert("At least one question is required to register an exam paper.");
      return;
    }

    try {
      const endpoint = isNewExam ? "/api/exams" : `/api/exams/${editingExam.id}`;
      const method = isNewExam ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingExam)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save exam paper.");
      }

      setEditingExam(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Are you sure you want to permanently delete this exam paper? All corresponding submissions, marks, and student logs will be removed.")) {
      return;
    }

    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete exam.");
      }

      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Grading flow helpers
  const handleStartGrading = async (subId: string) => {
    setGradingSubId(subId);
    setGradingSubDetail(null);
    try {
      const res = await fetch(`/api/submissions/${subId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load candidate answer sheet.");
      
      const data = await res.json();
      setGradingSubDetail(data);
      
      // Seed scores with existing student answers scores
      const initialScores: { [qId: string]: number } = {};
      data.exam.questions.forEach((q: Question) => {
        if (q.type === "mcq") {
          // MCQ is autograded, store automatic point
          const studentAns = data.submission.answers[q.id] || "";
          const isCorrect = studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
          initialScores[q.id] = isCorrect ? q.points : 0;
        } else {
          // Short answer, seed with existing score or 0
          initialScores[q.id] = data.submission.questionScores?.[q.id] ?? (data.submission.score_splits?.[q.id] ?? 0);
        }
      });
      setGradingScores(initialScores);
      setGradingFeedback(data.submission.feedback || "");
      setGradingResultStatus(data.submission.resultStatus || "auto");
    } catch (err: any) {
      alert(err.message);
      setGradingSubId(null);
    }
  };

  const handleSaveGrade = async () => {
    if (!gradingSubDetail) return;
    setSavingGrade(true);
    try {
      const res = await fetch(`/api/submissions/${gradingSubDetail.submission.id}/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          scores: gradingScores,
          feedback: gradingFeedback,
          resultStatus: gradingResultStatus !== "auto" ? gradingResultStatus : undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit grading worksheet.");
      }

      setGradingSubId(null);
      setGradingSubDetail(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingGrade(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500 font-medium">Synchronizing Instructor Workstation...</p>
      </div>
    );
  }

  const tabVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease: "easeInOut" } }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* 1. EXAM PAPERS WORKSPACE */}
        {activeTab === "dashboard" && !editingExam && (
          <motion.div
            key="dashboard-list"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Exam Authoring Registry</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Design structural question sets, durations, and criteria</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setTemplateLibraryActiveTab("exams");
                  setShowTemplateLibrary(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span>Template Library</span>
              </button>
              <button
                type="button"
                onClick={handleStartCreateExam}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/10 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Design Exam Paper</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 3-Column Split Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Exam Registry */}
            <div className="lg:col-span-2 space-y-6">
              {exams.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-900 rounded-2xl bg-white dark:bg-slate-950/20">
                  <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <h3 className="text-md font-bold text-slate-800 dark:text-slate-200">No Exam Papers Created</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    You haven't designed any examinations yet. Click &quot;Design Exam Paper&quot; above to create structured assessments.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {exams.map((exam) => {
                    const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
                    return (
                      <div key={exam.id} className="p-6 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                              {exam.durationMinutes} Minutes
                            </span>

                            {(() => {
                              const examSubmissions = submissions.filter(s => s.examId === exam.id);
                              if (examSubmissions.some(s => s.status === 'started')) {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/40">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span>Active</span>
                                  </span>
                                );
                              } else if (examSubmissions.some(s => s.status === 'submitted')) {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-900/40">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>Completed</span>
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border border-sky-200/40 dark:border-sky-900/40">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                    <span>Scheduled</span>
                                  </span>
                                );
                              }
                            })()}

                            <span className="text-[10px] font-bold text-slate-400">
                              {exam.questions.length} Questions
                            </span>
                          </div>
                          <h3 className="text-md font-extrabold text-slate-950 dark:text-slate-50">{exam.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{exam.description}</p>
                        </div>

                        <div className="pt-4 border-t border-slate-50 dark:border-slate-900/60 flex items-center justify-between gap-4">
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                            Total Value: <span className="text-slate-800 dark:text-slate-200">{totalPoints} pts</span>
                          </span>
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">
                            <button
                              onClick={() => handleStartEditExam(exam)}
                              className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                              title="Edit questions and duration"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExam(exam.id)}
                              className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                              title="Permanently remove paper"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 1 Column: Proctoring Overview Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-none">Proctoring Overview</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Live candidate security monitor</p>
                    </div>
                  </div>
                  <button
                    onClick={fetchData}
                    type="button"
                    className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 transition-all"
                    title="Reload active telemetry data"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtitle / Telemetry Stats Summary */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-900/40 text-center">
                  <div>
                    <span className="block text-xs font-black text-slate-900 dark:text-slate-100">{submissions.filter(sub => sub.status === "started").length}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Active Exams</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-rose-600 dark:text-rose-400">
                      {proctorLogs.filter(log => log.eventType !== "focus").length}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Flags</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Active candidate sessions listing */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Active Sessions
                    </span>
                    {submissions.filter(sub => sub.status === "started").length === 0 ? (
                      <div className="p-4 text-center border border-dashed border-slate-100 dark:border-slate-900 rounded-xl text-slate-400">
                        <Users className="w-5 h-5 mx-auto mb-1 text-slate-300 dark:text-slate-800" />
                        <span className="text-[10px] font-medium block">No candidates actively taking exams</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {submissions
                          .filter(sub => sub.status === "started")
                          .map((submission) => {
                            const subLogs = proctorLogs.filter(log => log.studentId === submission.studentId && log.examId === submission.examId);
                            const flagCount = subLogs.filter(log => log.eventType !== "focus").length;
                            const itemId = `${submission.studentId}-${submission.examId}`;
                            const isExpanded = expandedStudentExam === itemId;
                            return (
                              <div
                                key={itemId}
                                className="p-3 border border-slate-100 dark:border-slate-900/60 rounded-xl bg-slate-50/20 dark:bg-slate-950/20 space-y-2 transition-all"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 block">
                                      {submission.studentName}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block truncate max-w-[120px]" title={submission.examTitle}>
                                      {submission.examTitle}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setInterventionStudent({ id: submission.studentId, name: submission.studentName });
                                        setInterventionExam({ id: submission.examId, title: submission.examTitle });
                                        setInterventionMessage("");
                                        setInterventionModalOpen(true);
                                      }}
                                      className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                                      title="Send Manual Intervention Warning"
                                    >
                                      <AlertTriangle className="w-4 h-4 text-rose-500 hover:scale-110 transition-transform" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedStudentExam(isExpanded ? null : itemId)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                                        flagCount > 0
                                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 animate-pulse"
                                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                      }`}
                                    >
                                      <span>{flagCount} Flags</span>
                                      <ChevronRight className={`w-3 h-3 transform transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                                    </button>
                                  </div>
                                </div>

                                {/* Live Expanded Inline logs */}
                                {isExpanded && (
                                  <div className="pt-2 border-t border-slate-100 dark:border-slate-900/60 space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                    {subLogs.length === 0 ? (
                                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                        <span>✓</span> No integrity flags registered yet
                                      </p>
                                    ) : (
                                      subLogs.map(log => {
                                        const isWarning = log.eventType !== "focus";
                                        return (
                                          <div key={log.id} className="text-[10px] p-1.5 rounded bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-900/40">
                                            <div className="flex justify-between font-bold">
                                              <span className={isWarning ? "text-rose-600 dark:text-rose-400 uppercase tracking-wider font-extrabold text-[8px]" : "text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-extrabold text-[8px]"}>
                                                {log.eventType}
                                              </span>
                                              <span className="text-slate-400 text-[8px] font-mono">
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                              </span>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-300 mt-0.5 leading-relaxed">{log.details}</p>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Historical logs overview / warning logs overview */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-900">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Past Session Summaries
                    </span>
                    {submissions.filter(sub => sub.status === "submitted").map(sub => {
                      const studentLogs = proctorLogs.filter(log => log.studentId === sub.studentId && log.examId === sub.examId);
                      const flagCount = studentLogs.filter(log => log.eventType !== "focus").length;
                      return { submission: sub, logs: studentLogs, flagCount };
                    }).filter(item => item.flagCount > 0).length === 0 ? (
                      <div className="p-4 text-center border border-dashed border-slate-100 dark:border-slate-900 rounded-xl text-slate-400">
                        <Check className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                        <span className="text-[10px] font-medium block">All past exams completed flag-free!</span>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {submissions
                          .filter(sub => sub.status === "submitted")
                          .map(sub => {
                            const studentLogs = proctorLogs.filter(log => log.studentId === sub.studentId && log.examId === sub.examId);
                            const flagCount = studentLogs.filter(log => log.eventType !== "focus").length;
                            return { submission: sub, logs: studentLogs, flagCount };
                          })
                          .filter(item => item.flagCount > 0)
                          .map(({ submission, logs, flagCount }) => {
                            const itemId = `${submission.studentId}-${submission.examId}`;
                            const isExpanded = expandedStudentExam === itemId;
                            return (
                              <div
                                key={itemId}
                                className="p-3 border border-slate-100 dark:border-slate-900/60 rounded-xl bg-slate-50/10 dark:bg-slate-950/10 space-y-1.5"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 block">
                                      {submission.studentName}
                                    </span>
                                    <span className="text-[9px] text-slate-400 block truncate max-w-[150px]">
                                      {submission.examTitle}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedStudentExam(isExpanded ? null : itemId)}
                                    className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 transition-colors"
                                  >
                                    <span>{flagCount} Flags</span>
                                    <ChevronRight className={`w-2.5 h-2.5 transform transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                                  </button>
                                </div>

                                {isExpanded && (
                                  <div className="pt-2 border-t border-slate-50 dark:border-slate-900/40 space-y-1.5">
                                    {logs.map(log => {
                                      const isWarning = log.eventType !== "focus";
                                      return (
                                        <div key={log.id} className="text-[9px] p-1 rounded bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-900/40">
                                          <div className="flex justify-between font-bold">
                                            <span className={isWarning ? "text-rose-600 dark:text-rose-400 uppercase text-[8px]" : "text-emerald-600 dark:text-emerald-400 uppercase text-[8px]"}>
                                              {log.eventType}
                                            </span>
                                            <span className="text-slate-400 text-[8px] font-mono">
                                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          </div>
                                          <p className="text-slate-500 dark:text-slate-300 mt-0.5 leading-relaxed">{log.details}</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Helpful instructions */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-900/40 flex items-start gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal">
                    This overview aggregates student violations (tab switches, focus losses, blocked copy/pastes, right-clicks) logged during both active and past exam runs.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* 2. EXAM AUTHOR / EDITOR MODE */}
      {editingExam && (
        <motion.form
          key="exam-editor"
          variants={tabVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onSubmit={handleSaveExam}
          className="space-y-6 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-900 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {isNewExam ? "Design Assessment Paper" : `Edit assessment: ${editingExam.title}`}
              </h2>
              <p className="text-xs text-slate-400">Design comprehensive questions, standard correct options, and points metrics</p>
            </div>
            <button
              type="button"
              onClick={() => setEditingExam(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Exam Title</label>
              <input
                type="text"
                required
                value={editingExam.title}
                onChange={(e) => setEditingExam(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Relational Spanner Schema and DB Hardening MCQ"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
              />
            </div>
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Duration (Minutes)</label>
              <input
                type="number"
                required
                min="1"
                value={editingExam.durationMinutes}
                onChange={(e) => setEditingExam(prev => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                placeholder="30"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
              />
            </div>
            <div className="col-span-full space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Instructions & Description</label>
              <textarea
                required
                rows={3}
                value={editingExam.description}
                onChange={(e) => setEditingExam(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Outline general candidate requirements, rules, reference scopes, and guidelines here..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium leading-relaxed"
              />
            </div>
          </div>

          {/* Automated Proctoring Configuration Rules */}
          <div className="border-t border-slate-100 dark:border-slate-900 pt-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Automated Proctoring Configuration Rules</span>
              </h3>
              <p className="text-xs text-slate-400">Configure infraction warning limit, copying locks, and dynamic auto-submission thresholds</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 bg-slate-50 dark:bg-slate-900/25 p-4 rounded-xl border border-slate-100 dark:border-slate-900/60">
              {/* Threshold */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Warning Threshold Limit</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={editingExam.proctorRules?.warningThreshold ?? 3}
                  onChange={(e) => setEditingExam(prev => ({
                    ...prev,
                    proctorRules: {
                      ...(prev.proctorRules || { warningThreshold: 3, blockCopyPaste: true, autoSubmitOnViolation: false }),
                      warningThreshold: Number(e.target.value)
                    }
                  }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                />
                <span className="text-[9px] text-slate-400 block leading-tight">Flags before showing highly visible deterrent warning blocks to the student</span>
              </div>

              {/* Copy/Paste Locking */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Integrity Interlock Mode</label>
                <label className="relative flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingExam.proctorRules?.blockCopyPaste ?? true}
                    onChange={(e) => setEditingExam(prev => ({
                      ...prev,
                      proctorRules: {
                        ...(prev.proctorRules || { warningThreshold: 3, blockCopyPaste: true, autoSubmitOnViolation: false }),
                        blockCopyPaste: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-indigo-600 border-slate-200 dark:border-slate-800 rounded focus:ring-0"
                  />
                  <span>Block Copy, Paste, & Cut actions</span>
                </label>
                <span className="text-[9px] text-slate-400 block leading-tight">Disables keyboard shortcuts and blocks right-click context menu within exam taking layout</span>
              </div>

              {/* Auto Submit Trigger */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Severe Violation Enforcement</label>
                <label className="relative flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingExam.proctorRules?.autoSubmitOnViolation ?? false}
                    onChange={(e) => setEditingExam(prev => ({
                      ...prev,
                      proctorRules: {
                        ...(prev.proctorRules || { warningThreshold: 3, blockCopyPaste: true, autoSubmitOnViolation: false }),
                        autoSubmitOnViolation: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-indigo-600 border-slate-200 dark:border-slate-800 rounded focus:ring-0"
                  />
                  <span className="text-rose-600 dark:text-rose-400 font-bold">Auto-submit upon threshold breach</span>
                </label>
                <span className="text-[9px] text-slate-400 block leading-tight">Forcefully terminates and grades the active exam session if warning threshold limit is exceeded</span>
              </div>

              {/* Ambient Noise Toggle */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Ambient Noise Monitoring</label>
                <label className="relative flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingExam.proctorRules?.enableNoiseDetection ?? false}
                    onChange={(e) => setEditingExam(prev => ({
                      ...prev,
                      proctorRules: {
                        ...(prev.proctorRules || { warningThreshold: 3, blockCopyPaste: true, autoSubmitOnViolation: false }),
                        enableNoiseDetection: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-indigo-600 border-slate-200 dark:border-slate-800 rounded focus:ring-0"
                  />
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">Enable Mic Noise Monitor</span>
                </label>
                <span className="text-[9px] text-slate-400 block leading-tight">Monitors local classroom background volume levels via student's mic feed</span>
              </div>

              {/* Noise Level Threshold */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Noise Limit Sensitivity</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    disabled={!(editingExam.proctorRules?.enableNoiseDetection ?? false)}
                    value={editingExam.proctorRules?.noiseThreshold ?? 50}
                    onChange={(e) => setEditingExam(prev => ({
                      ...prev,
                      proctorRules: {
                        ...(prev.proctorRules || { warningThreshold: 3, blockCopyPaste: true, autoSubmitOnViolation: false }),
                        noiseThreshold: Number(e.target.value)
                      }
                    }))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-30"
                  />
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 w-8 text-right shrink-0">
                    {editingExam.proctorRules?.noiseThreshold ?? 50}%
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 block leading-tight">Threshold where background chatter triggers an immediate infraction warning</span>
              </div>
            </div>
          </div>

          {/* Questions Editor Header */}
          <div className="border-t border-slate-100 dark:border-slate-900 pt-6 space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <h3 className="text-md font-bold text-slate-800 dark:text-slate-200">Question Specifications</h3>
                <p className="text-xs text-slate-400">Design multiple choice, essays, code compilers, file submission spots, or audio/video recording prompts</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
                <button
                  type="button"
                  onClick={() => handleAddQuestion("mcq")}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100/50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>MCQ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion("short")}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Short Essay</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion("code")}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100/50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Structured Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion("file")}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-sky-200 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 text-xs font-bold hover:bg-sky-100/50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>File Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion("audio-video")}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100/50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Audio/Video Response</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInsertQuestionTplModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-100/50 transition-colors"
                  title="Add predefined or custom question template"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>From Template</span>
                </button>
              </div>
            </div>

            {/* Questions list */}
            <div className="space-y-6">
              {editingExam.questions?.map((q, idx) => (
                <div key={q.id} className="p-5 border border-slate-100 dark:border-slate-900 rounded-2xl bg-slate-50/30 dark:bg-slate-950/30 space-y-4 relative group">
                  
                  {/* Remove and Header Row */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-900/60 pb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-900 text-[11px] flex items-center justify-center font-bold text-slate-500">
                        {idx + 1}
                      </span>
                      <span>
                        {q.type === "mcq" && "Multiple Choice Question (MCQ)"}
                        {q.type === "short" && "Short Answer Essay"}
                        {q.type === "code" && "Structured Code Challenge"}
                        {q.type === "file" && "File Upload Space"}
                        {q.type === "audio-video" && "Audio/Video Response Recording"}
                      </span>
                    </span>
                    <div className="flex items-center gap-3">
                      {/* Points selection */}
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-400 font-bold">Points:</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={q.points}
                          onChange={(e) => handleQuestionChange(idx, { ...q, points: Number(e.target.value) })}
                          className="w-12 px-1.5 py-0.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-200 rounded text-center focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSaveQTplModal(q)}
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg p-1 transition-colors"
                        title="Save as Question Template"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg p-1 transition-colors"
                        title="Remove question block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rich Text Editor for Question Text */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Question Prompt</label>
                    <RichTextEditor
                      value={q.questionText}
                      onChange={(html) => handleQuestionChange(idx, { ...q, questionText: html })}
                      placeholder="Write your beautiful exam question here..."
                    />
                  </div>

                  {/* Conditional options for MCQ */}
                  {q.type === "mcq" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {q.options?.map((opt, oIdx) => (
                        <div key={oIdx} className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block uppercase">Option {String.fromCharCode(65 + oIdx)}</label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={opt}
                              onChange={(e) => {
                                const updatedOpts = [...(q.options || [])];
                                updatedOpts[oIdx] = e.target.value;
                                handleQuestionChange(idx, { ...q, options: updatedOpts });
                              }}
                              className="w-full pl-3 pr-10 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            {/* Checkmark button to make this correct answer */}
                            <button
                              type="button"
                              onClick={() => handleQuestionChange(idx, { ...q, correctAnswer: opt })}
                              className={`absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors ${
                                q.correctAnswer === opt
                                  ? "text-emerald-500 hover:text-emerald-600 font-bold"
                                  : "text-slate-300 hover:text-slate-500"
                              }`}
                              title="Mark as correct option"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="col-span-full p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between gap-2">
                        <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">
                          Active Correct Solution Answer:
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {q.correctAnswer || "Not selected. Click checkmarks above."}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Conditional standard answer for short answer */}
                  {q.type === "short" && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Reference / Correct Answer Guidelines</label>
                      <textarea
                        rows={2}
                        required
                        value={q.correctAnswer}
                        onChange={(e) => handleQuestionChange(idx, { ...q, correctAnswer: e.target.value })}
                        placeholder="Write standard rubric evaluation elements, core concepts, or direct correct answer to match against..."
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {/* Code editor settings */}
                  {q.type === "code" && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Programming Language</label>
                          <select
                            value={q.codeLanguage || "javascript"}
                            onChange={(e) => handleQuestionChange(idx, { ...q, codeLanguage: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python 3</option>
                            <option value="typescript">TypeScript</option>
                            <option value="cpp">C++ (GCC 11)</option>
                            <option value="java">Java 17</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Reference Solution</label>
                          <textarea
                            rows={3}
                            required
                            value={q.correctAnswer}
                            onChange={(e) => handleQuestionChange(idx, { ...q, correctAnswer: e.target.value })}
                            placeholder="Provide the gold-standard reference solution for automatic analysis..."
                            className="w-full px-3 py-2 font-mono border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Boilerplate Starter Template Code</label>
                        <textarea
                          rows={4}
                          required
                          value={q.codeTemplate || ""}
                          onChange={(e) => handleQuestionChange(idx, { ...q, codeTemplate: e.target.value })}
                          placeholder="function solution() {\n  // Write your code here\n}"
                          className="w-full px-3 py-2 font-mono border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* File Upload settings */}
                  {q.type === "file" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Maximum File Size Limit (MB)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={q.maxFileSizeMB || 10}
                          onChange={(e) => handleQuestionChange(idx, { ...q, maxFileSizeMB: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rubric Checklist / Guidelines</label>
                        <textarea
                          rows={2}
                          required
                          value={q.correctAnswer}
                          onChange={(e) => handleQuestionChange(idx, { ...q, correctAnswer: e.target.value })}
                          placeholder="e.g. Include architectural blueprints, block schematic flowcharts, and certified signatures..."
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Audio/Video recording settings */}
                  {q.type === "audio-video" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Maximum Recording Duration (Seconds)</label>
                        <input
                          type="number"
                          min="10"
                          max="300"
                          value={q.recordingDurationSeconds || 60}
                          onChange={(e) => handleQuestionChange(idx, { ...q, recordingDurationSeconds: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rubric Checklist / Guidelines</label>
                        <textarea
                          rows={2}
                          required
                          value={q.correctAnswer}
                          onChange={(e) => handleQuestionChange(idx, { ...q, correctAnswer: e.target.value })}
                          placeholder="e.g. Student must address ACID properties, partition tolerance, and network latency factors."
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>

          {/* Editor actions footer */}
          <div className="border-t border-slate-100 dark:border-slate-900 pt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingExam(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Cancel Edit
            </button>
            <button
              type="button"
              onClick={() => setShowSaveExamTplModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100/50 dark:hover:bg-indigo-950/40 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save as Layout Template</span>
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/15 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save & Publish Assessment</span>
            </button>
          </div>
        </motion.form>
      )}


      {/* 3. CANDIDATE SUBMISSIONS & GRADING DESK */}
      {activeTab === "submissions" && !gradingSubId && (
        <motion.div
          key="submissions-list"
          variants={tabVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-6"
        >
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Candidate Grading Portal</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Review student exam responses, award manual points, and submit academic feedback</p>
          </div>

          {submissions.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950/20">
              <Clipboard className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-md font-bold text-slate-800 dark:text-slate-200">No Student Submissions Received</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                Once students complete their active examination sessions, candidates will appear here for grading sheets.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm p-6 overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="pb-3 pl-1 font-bold">Student</th>
                    <th className="pb-3 font-bold">Assessment Paper</th>
                    <th className="pb-3 font-bold">Grade status</th>
                    <th className="pb-3 font-bold">Score awarded</th>
                    <th className="pb-3 pr-1 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-900/40">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="py-4 pl-1 pr-3">
                        <div className="font-extrabold text-slate-800 dark:text-slate-200">{sub.studentName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Started: {new Date(sub.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">{sub.examTitle}</div>
                      </td>
                      <td className="py-4">
                        {sub.graded ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Check className="w-3 h-3" />
                            <span>Graded</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3 animate-pulse" />
                            <span>Pending Grade</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {sub.graded ? `${sub.score} / ${sub.maxScore}` : `-- / ${sub.maxScore}`}
                      </td>
                      <td className="py-4 pr-1 text-right">
                        <button
                          onClick={() => handleStartGrading(sub.id)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                            sub.graded
                              ? "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-sm hover:shadow active:scale-95"
                          }`}
                        >
                          <span>{sub.graded ? "Review Grades" : "Grade Sheet"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}


      {/* 4. ACTIVE SUBMISSION GRADING CANVAS */}
      {gradingSubId && gradingSubDetail && (
        <motion.div
          key="grading-canvas"
          variants={tabVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-6 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-900 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Candidate Evaluation Node</span>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Grading: {gradingSubDetail.submission.studentName}
              </h2>
              <p className="text-xs text-slate-400">Subject: {gradingSubDetail.exam.title}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setGradingSubId(null);
                setGradingSubDetail(null);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* PROCTORING TELEMETRY & INTEGRITY REPORT FOR THIS SESSION */}
          {(() => {
            const studentLogs = proctorLogs.filter(
              log => log.studentId === gradingSubDetail.submission.studentId && 
                     log.examId === gradingSubDetail.submission.examId
            );
            const suspiciousLogs = studentLogs.filter(log => log.eventType !== "focus");
            const hasViolations = suspiciousLogs.length > 0;

            return (
              <div className={`p-5 rounded-2xl border transition-all ${
                hasViolations 
                  ? "bg-rose-500/5 border-rose-500/10 dark:bg-rose-950/10" 
                  : "bg-emerald-500/5 border-emerald-500/10 dark:bg-emerald-950/10"
              } space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className={`w-5 h-5 ${hasViolations ? "text-rose-500" : "text-emerald-500"}`} />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Proctoring Telemetry & Integrity Report
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    hasViolations ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"
                  }`}>
                    {hasViolations ? `${suspiciousLogs.length} Infraction(s) Flagged` : "Clean Session (No Flags)"}
                  </span>
                </div>

                {hasViolations && (
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      The proctoring system registered the following restricted actions during this candidate's session:
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {suspiciousLogs.map(log => (
                        <div key={log.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl text-xs space-y-1 flex items-start justify-between gap-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-rose-600 dark:text-rose-400 uppercase text-[9px] tracking-wider">
                                {log.eventType}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 font-medium leading-normal">{log.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!hasViolations && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Excellent integrity status: Candidate remained fully focused on the examination canvas with no tab-switches, keyboard shortcut violations, or excessive speech/ambient noise alerts detected.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Answer blocks list */}
          <div className="space-y-6">
            {gradingSubDetail.exam.questions.map((q, idx) => {
              const studentAnswer = gradingSubDetail.submission.answers[q.id] || "";
              
              if (q.type === "mcq") {
                const isCorrect = studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                return (
                  <div key={q.id} className="p-5 border border-slate-100 dark:border-slate-900 rounded-2xl bg-slate-50/20 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-slate-500">MCQ #{idx + 1}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {isCorrect ? `Correct (+${q.points} pts)` : "Incorrect (0 pts)"}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: q.questionText }} />

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {q.options?.map((opt, oIdx) => {
                        const isStudentSel = studentAnswer === opt;
                        const isCorrectOpt = q.correctAnswer === opt;

                        return (
                          <div 
                            key={oIdx} 
                            className={`p-2.5 rounded-xl border text-xs font-medium ${
                              isCorrectOpt 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                : isStudentSel
                                  ? "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400"
                                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500"
                            }`}
                          >
                            <span className="font-bold mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt}</span>
                            {isStudentSel && <span className="text-[9px] font-bold ml-1.5 uppercase">(Student)</span>}
                            {isCorrectOpt && <span className="text-[9px] font-bold ml-1.5 uppercase">(Solution)</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              } else {
                // Short Essay, Code, File or Audio-Video grading
                const typeLabels: { [key: string]: string } = {
                  short: "Short Answer Essay",
                  code: "Structured Code Challenge",
                  file: "Secure File Upload",
                  "audio-video": "Verbal Assessment Recording"
                };
                const label = typeLabels[q.type] || "Written Response";

                return (
                  <div key={q.id} className="p-5 border border-slate-100 dark:border-slate-900 rounded-2xl bg-white dark:bg-slate-950 space-y-4">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-900 pb-2">
                      <span className="text-xs font-bold text-slate-500">{label} #{idx + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-400">Award points:</span>
                        <input
                          type="number"
                          min="0"
                          max={q.points}
                          value={gradingScores[q.id] || 0}
                          onChange={(e) => setGradingScores(prev => ({ ...prev, [q.id]: Math.min(Number(e.target.value), q.points) }))}
                          className="w-12 px-2 py-0.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 font-mono font-bold text-xs text-center text-indigo-600 dark:text-indigo-400"
                        />
                        <span className="text-xs font-bold text-slate-400">/ {q.points} pts</span>
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: q.questionText }} />

                    {/* Student's answer response with custom types */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Student Response</label>
                      {q.type === "code" ? (
                        <div className="p-4 bg-slate-950 text-emerald-400 rounded-xl font-mono text-xs border border-slate-800 leading-relaxed whitespace-pre overflow-x-auto">
                          {studentAnswer || <span className="text-slate-600">// No code response entered</span>}
                        </div>
                      ) : q.type === "file" ? (
                        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-950/60 flex items-center gap-2">
                          <Paperclip className="w-4 h-4 shrink-0 text-indigo-500" />
                          <span>{studentAnswer || "No file uploaded by student"}</span>
                        </div>
                      ) : q.type === "audio-video" ? (
                        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-950/60 flex items-center gap-2">
                          <Mic className="w-4 h-4 shrink-0 text-rose-500" />
                          <span>{studentAnswer || "No verbal audio recording submitted"}</span>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800/60 leading-relaxed whitespace-pre-wrap">
                          {studentAnswer || <em className="text-slate-400">No response entered by student</em>}
                        </div>
                      )}
                    </div>

                    {/* Reference rubric */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-indigo-500/70 uppercase tracking-wider block">Solution Evaluation Rubric / Criteria</label>
                      <div className="p-3.5 bg-indigo-500/5 dark:bg-indigo-950/20 rounded-xl text-xs font-medium text-indigo-700 dark:text-indigo-400 border border-indigo-500/10 leading-relaxed whitespace-pre-wrap">
                        {q.correctAnswer}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>

          {/* Feedback & Result Status section */}
          <div className="border-t border-slate-100 dark:border-slate-900 pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                <span>Academic Instructor Feedback & Assessment Comments</span>
              </label>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Decision Outcome:</span>
                <select
                  value={gradingResultStatus}
                  onChange={(e) => setGradingResultStatus(e.target.value as 'passed' | 'failed' | 'auto')}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold cursor-pointer"
                >
                  <option value="auto">Auto-Calculate (Pass if ≥ 50%)</option>
                  <option value="passed">Pass (Force Approved)</option>
                  <option value="failed">Fail (Force Rejected)</option>
                </select>
              </div>
            </div>
            
            <textarea
              rows={3}
              value={gradingFeedback}
              onChange={(e) => setGradingFeedback(e.target.value)}
              placeholder="Provide constructive assessment comments, notes on structural fallacies, or areas of improvement..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium leading-relaxed"
            />
          </div>

          {/* Grade canvas footer */}
          <div className="border-t border-slate-100 dark:border-slate-900 pt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setGradingSubId(null);
                setGradingSubDetail(null);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Back to Submissions
            </button>
            <button
              type="button"
              onClick={handleSaveGrade}
              disabled={savingGrade}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/15 active:scale-95 transition-all"
            >
              {savingGrade ? "Submitting Worksheets..." : "Save Grade & Issue Feedback"}
            </button>
          </div>
        </motion.div>
      )}


      {/* 5. VISUAL PERFORMANCE ANALYTICS */}
      {activeTab === "analytics" && (
        <motion.div
          key="analytics-dashboard"
          variants={tabVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-6"
        >
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 font-sans tracking-tight">Performance Analytics Workbench</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Aggregated performance distributions, averages, and candidate durations</p>
          </div>

          {/* Dynamic SVG Charts component loading teacher created analytics */}
          <DashboardCharts 
            analytics={analytics}
            submissions={submissions}
            exams={exams}
            proctorLogs={proctorLogs}
            onStartGrading={(subId) => {
              setActiveTab("submissions");
              handleStartGrading(subId);
            }}
          />
        </motion.div>
      )}


      {/* 6. PROCTOR LOG STREAM TAB */}
      {activeTab === "proctor-logs" && (
        <motion.div
          key="proctor-logs"
          variants={tabVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 font-sans tracking-tight">Proctor Log Stream</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Real-time candidate monitoring, focus loss indicators, and restricted interaction logs</p>
            </div>
            <button
              onClick={fetchData}
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Log Stream</span>
            </button>
          </div>

          {/* Temporal Violation Timeline Chart */}
          <ViolationTimelineChart
            proctorLogs={proctorLogs}
            submissions={submissions}
            exams={exams}
          />

          <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm p-6 space-y-6">
            {/* Filter Panel */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-900/60">
              <div className="flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Filter logs by student name..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exam Selector:</label>
                  <select
                    value={logFilterExam}
                    onChange={(e) => {
                      setLogFilterExam(e.target.value);
                      setLogSearchQuery("");
                    }}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold cursor-pointer"
                  >
                    <option value="all">All Exams</option>
                    {exams.map(e => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Event Type:</label>
                  <select
                    value={logFilterEvent}
                    onChange={(e) => setLogFilterEvent(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold cursor-pointer"
                  >
                    <option value="all">All Logs</option>
                    <option value="tab-switch">Tab Switches</option>
                    <option value="blur">Blur Events</option>
                    <option value="focus">Focus Retained</option>
                    <option value="keyboard-shortcut">Keyboard Shortcuts</option>
                    <option value="context-menu">Context Menu</option>
                    <option value="noise-alert">Speech & Ambient Noise</option>
                  </select>
                </div>
              </div>
            </div>

            {logFilterExam !== "all" && (() => {
              const selectedExam = exams.find(e => e.id === logFilterExam);
              if (!selectedExam) return null;

              const examSubs = submissions.filter(s => s.examId === logFilterExam);
              const examLogs = proctorLogs.filter(l => l.examId === logFilterExam);

              const tabSwitches = examLogs.filter(l => l.eventType === "tab-switch").length;
              const blurs = examLogs.filter(l => l.eventType === "blur").length;
              const shortcuts = examLogs.filter(l => l.eventType === "keyboard-shortcut").length;
              const rightClicks = examLogs.filter(l => l.eventType === "context-menu").length;
              const noiseAlerts = examLogs.filter(l => l.eventType === "noise-alert").length;
              const totalInfractions = tabSwitches + blurs + shortcuts + rightClicks + noiseAlerts;

              return (
                <div className="space-y-4 border-b border-slate-100 dark:border-slate-900 pb-6 animate-fade-in">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Students Attended</span>
                      <span className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2 font-mono">
                        {examSubs.length}
                      </span>
                    </div>

                    <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                      totalInfractions > 0
                        ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/60"
                        : "bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-900/60"
                    }`}>
                      <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider">Integrity Incidents</span>
                      <span className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2 font-mono">
                        {totalInfractions}
                      </span>
                    </div>

                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Completed / Graded</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-2 font-mono">
                        {examSubs.filter(s => s.graded).length} / {examSubs.length}
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900/60 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Warning Limit</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-2 font-mono">
                        {selectedExam.proctorRules?.warningThreshold ?? 3} Warnings
                      </span>
                    </div>
                  </div>

                  {totalInfractions > 0 && (
                    <div className="p-4 border border-slate-100 dark:border-slate-900 rounded-2xl space-y-3 bg-slate-50/20">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Malicious Activity Breakdown</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        <div className="p-2 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">Tab Switch:</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{tabSwitches}</span>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">Focus Loss:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{blurs}</span>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">Shortcuts:</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{shortcuts}</span>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">Right Clicks:</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{rightClicks}</span>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">Acoustic:</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{noiseAlerts}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Student Session Telemetry Registry</h4>
                    {examSubs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No candidates have started this assessment yet.</p>
                    ) : (
                      <div className="border border-slate-100 dark:border-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-50 dark:divide-slate-900/40">
                        {examSubs.map(sub => {
                          const studentExamLogs = examLogs.filter(l => l.studentId === sub.studentId && l.eventType !== "focus");
                          return (
                            <div key={sub.id} className="p-3.5 bg-white dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/40 transition-colors">
                              <div className="space-y-1">
                                <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
                                  <span>{sub.studentName}</span>
                                  {studentExamLogs.length > 0 && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-500/10 text-rose-600 border border-rose-500/10">
                                      {studentExamLogs.length} flag{studentExamLogs.length > 1 ? "s" : ""}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Status: <span className="font-semibold text-slate-600 dark:text-slate-300 capitalize">{sub.status}</span>
                                  {sub.submitTime && ` • Submitted: ${new Date(sub.submitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setLogSearchQuery(sub.studentName)}
                                  className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors"
                                >
                                  Filter Logs
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartGrading(sub.id)}
                                  className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
                                >
                                  {sub.graded ? "Review Grading" : "Evaluate Script"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Logs chronological stream */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {(() => {
                const filtered = proctorLogs.filter(log => {
                  const matchesSearch = log.studentName.toLowerCase().includes(logSearchQuery.toLowerCase());
                  const matchesEvent = logFilterEvent === "all" || log.eventType === logFilterEvent;
                  const matchesExam = logFilterExam === "all" || log.examId === logFilterExam;
                  return matchesSearch && matchesEvent && matchesExam;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-900 rounded-2xl">
                      <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3 animate-pulse" />
                      <h3 className="text-md font-bold text-slate-800 dark:text-slate-200">No Proctor Logs Registered</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                        No telemetry logs or restricted action alerts match your search/filter criteria.
                      </p>
                    </div>
                  );
                }

                return filtered.map((log) => {
                  const isTabSwitch = log.eventType === "tab-switch";
                  const isBlur = log.eventType === "blur";
                  const isFocus = log.eventType === "focus";
                  const isShortcut = log.eventType === "keyboard-shortcut";
                  const isCtxMenu = log.eventType === "context-menu";
                  const isNoise = log.eventType === "noise-alert";

                  return (
                    <div
                      key={log.id}
                      className={`p-4 rounded-xl border text-xs space-y-1.5 transition-all hover:translate-x-0.5 ${
                        isTabSwitch || isShortcut || isCtxMenu || isNoise
                          ? "bg-rose-500/5 border-rose-500/10 dark:bg-rose-950/10"
                          : isBlur
                            ? "bg-amber-500/5 border-amber-500/10 dark:bg-amber-950/10"
                            : "bg-blue-500/5 border-blue-500/10 dark:bg-blue-950/10"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                            {log.studentName}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wider ${
                            isTabSwitch || isShortcut || isCtxMenu || isNoise
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                              : isBlur
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                          }`}>
                            {log.eventType === "noise-alert" ? "Speech / Noise" : log.eventType}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 italic text-[11px] leading-relaxed">
                        &quot;{log.details}&quot;
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-50 dark:border-slate-900/20 gap-2">
                        <span className="font-bold">Exam Title: <span className="text-slate-600 dark:text-slate-400">{log.examTitle}</span></span>
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          {log.eventType !== "intervention" && (
                            <button
                              type="button"
                              onClick={() => {
                                setInterventionStudent({ id: log.studentId, name: log.studentName });
                                setInterventionExam({ id: log.examId, title: log.examTitle });
                                setInterventionMessage(`Please note that a security infraction (${log.eventType.toUpperCase()}) was flagged on your exam session. Maintain full window focus.`);
                                setInterventionModalOpen(true);
                              }}
                              className="px-2 py-1 text-rose-600 dark:text-rose-450 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded-lg font-bold flex items-center gap-1 transition-all"
                              title="Initiate warning intervention for student"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              <span>Intervene & Warn</span>
                            </button>
                          )}
                          <span className="font-mono text-[9px] text-slate-400">ID: {log.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ==================== PROCTORING INTERVENTION MODAL ==================== */}
      <AnimatePresence>
        {interventionModalOpen && interventionStudent && interventionExam && (
          <div className="fixed inset-0 z-50 overflow-y-auto" id="proctor-intervention-modal">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInterventionModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500">Live Examination Control</span>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Proctor Intervention Warning</h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInterventionModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSendIntervention} className="mt-4 space-y-4">
                  {/* Student & Exam Info */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-900/40 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-400">Target Candidate:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{interventionStudent.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-400">Active Exam:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={interventionExam.title}>
                        {interventionExam.title}
                      </span>
                    </div>
                  </div>

                  {/* Warning Message Box */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Custom Warning / Directive Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={interventionMessage}
                      onChange={(e) => setInterventionMessage(e.target.value)}
                      placeholder="Type a clear, explicit directive (e.g., 'Please return your focus to the exam screen immediately. Your face is currently not aligned with the camera view.')"
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed font-medium placeholder-slate-400"
                    />
                    <p className="text-[10px] text-slate-400 leading-snug">
                      This warning message will immediately interrupt the student's active exam view in real-time, requiring their manual acknowledgement before they can continue.
                    </p>
                  </div>

                  {/* Quick Preset Messages */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Quick Warning Presets
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Tab or window switches are forbidden.",
                        "Verify your camera structure alignment.",
                        "Classroom ambient noise level is too high.",
                        "Unauthorized external materials detected."
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setInterventionMessage(`OFFICIAL WARNING: ${preset} Please maintain absolute focus on your examination page.`)}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200/50 dark:border-slate-800 rounded-lg text-[10px] font-medium text-slate-600 dark:text-slate-400 transition-colors"
                        >
                          {preset.slice(0, 24)}...
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Errors / Success Feedback */}
                  {interventionError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500 rounded-xl">
                      {interventionError}
                    </div>
                  )}

                  {interventionSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500 rounded-xl">
                      {interventionSuccess}
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-900">
                    <button
                      type="button"
                      onClick={() => setInterventionModalOpen(false)}
                      className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingIntervention || !!interventionSuccess}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/10 flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      {sendingIntervention ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Transmitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Transmit Warning</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== TEMPLATE LIBRARY OVERLAY MODAL ==================== */}
      <AnimatePresence>
        {showTemplateLibrary && (
          <div className="fixed inset-0 z-50 overflow-y-auto" id="template-library-modal">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTemplateLibrary(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Reusable Asset Registry</span>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-500" />
                      <span>Assessment & Question Template Library</span>
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowTemplateLibrary(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tab switcher */}
                <div className="flex items-center gap-2 my-5 border-b border-slate-100 dark:border-slate-900 pb-px">
                  <button
                    type="button"
                    onClick={() => setTemplateLibraryActiveTab("exams")}
                    className={`px-4 py-2 text-xs font-bold transition-all relative ${
                      templateLibraryActiveTab === "exams"
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <span>Assessment Layouts</span>
                    {templateLibraryActiveTab === "exams" && (
                      <motion.div layoutId="tpl-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateLibraryActiveTab("questions")}
                    className={`px-4 py-2 text-xs font-bold transition-all relative ${
                      templateLibraryActiveTab === "questions"
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <span>Reusable Questions</span>
                    {templateLibraryActiveTab === "questions" && (
                      <motion.div layoutId="tpl-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                    )}
                  </button>
                </div>

                {/* Library Lists Content */}
                <div className="max-h-[50vh] overflow-y-auto pr-2 py-1 space-y-4">
                  {templateLibraryActiveTab === "exams" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {examTemplates.map((tpl) => (
                        <div key={tpl.id} className="p-5 border border-slate-100 dark:border-slate-900 rounded-xl bg-slate-50/20 dark:bg-slate-900/10 flex flex-col justify-between hover:border-slate-200 dark:hover:border-slate-800 hover:shadow-xs transition-all group">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                tpl.isCustom
                                  ? "bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400"
                                  : "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-400"
                              }`}>
                                {tpl.isCustom ? "Custom saved" : "System seed"}
                              </span>
                              {tpl.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExamTemplate(tpl.id)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                  title="Delete custom template"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{tpl.name}</h4>
                            <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed mb-4">{tpl.description}</p>
                          </div>

                          <div className="space-y-4">
                            {/* Metadata list */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {tpl.durationMinutes} mins
                              </span>
                              <span className="flex items-center gap-1">
                                <HelpCircle className="w-3 h-3 text-slate-400" />
                                {tpl.questions.length} questions
                              </span>
                              {tpl.proctorRules?.blockCopyPaste && (
                                <span className="flex items-center gap-1 bg-rose-500/5 px-1 py-0.5 rounded border border-rose-500/10 text-rose-500 text-[8px] font-bold">
                                  No Copy-Paste
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleApplyExamTemplate(tpl)}
                              className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create Exam from Layout</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {questionTemplates.map((tpl) => {
                        const typeLabels: { [key: string]: string } = {
                          mcq: "Multiple Choice (MCQ)",
                          short: "Short Essay",
                          code: "Structured Code Challenge",
                          file: "File Upload Space",
                          "audio-video": "A/V Response Recording"
                        };
                        const label = typeLabels[tpl.question.type || "mcq"] || "Question";

                        return (
                          <div key={tpl.id} className="p-5 border border-slate-100 dark:border-slate-900 rounded-xl bg-slate-50/20 dark:bg-slate-900/10 flex flex-col justify-between hover:border-slate-200 dark:hover:border-slate-800 hover:shadow-xs transition-all group">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  tpl.isCustom
                                    ? "bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400"
                                    : "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-400"
                                }`}>
                                  {tpl.isCustom ? "Custom saved" : "System seed"}
                                </span>
                                {tpl.isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuestionTemplate(tpl.id)}
                                    className="text-slate-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                    title="Delete custom template"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{tpl.name}</h4>
                              <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px] font-bold">
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                  {label}
                                </span>
                                <span className="bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400">
                                  {tpl.question.points || 5} Points
                                </span>
                              </div>
                              <div 
                                className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4 p-2 bg-slate-100/30 dark:bg-slate-900/40 rounded-lg border border-slate-100/40"
                                dangerouslySetInnerHTML={{ __html: tpl.question.questionText || "" }}
                              />
                            </div>

                            {editingExam ? (
                              <button
                                type="button"
                                onClick={() => handleInsertQuestionTemplate(tpl)}
                                className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Insert to Active Exam</span>
                              </button>
                            ) : (
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic text-center">
                                Start editing/creating an exam to insert this question
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Info */}
                <div className="border-t border-slate-100 dark:border-slate-900 pt-4 mt-6 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  <span>Tip: Custom saved templates are stored in your browser local storage securely.</span>
                  <button
                    onClick={() => setShowTemplateLibrary(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Close Library
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== DIALOG: SAVE EXAM AS LAYOUT TEMPLATE ==================== */}
      <AnimatePresence>
        {showSaveExamTplModal && (
          <div className="fixed inset-0 z-55 overflow-y-auto" id="save-exam-template-dialog">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveExamTplModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.form
                onSubmit={handleSaveExamAsTemplate}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
              >
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Layout Exporter</span>
                  <h3 className="text-md font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-indigo-500" />
                    <span>Save Assessment as Template</span>
                  </h3>
                  <p className="text-xs text-slate-400">Save your custom configuration, timelines, proctor constraints, and structural question layout for immediate reuse.</p>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400">Template Identifier / Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Advanced AI System Lab"
                      value={saveTemplateName}
                      onChange={(e) => setSaveTemplateName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400">Brief Layout Description</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. A 90-minute design session blueprint featuring code challenges and technical submissions."
                      value={saveTemplateDesc}
                      onChange={(e) => setSaveTemplateDesc(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-50 dark:border-slate-900">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveExamTplModal(false);
                      setSaveTemplateName("");
                      setSaveTemplateDesc("");
                    }}
                    className="px-4 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/10 active:scale-95 transition-all"
                  >
                    Save Layout Template
                  </button>
                </div>
              </motion.form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== DIALOG: SAVE QUESTION AS TEMPLATE ==================== */}
      <AnimatePresence>
        {showSaveQTplModal && (
          <div className="fixed inset-0 z-55 overflow-y-auto" id="save-question-template-dialog">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveQTplModal(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.form
                onSubmit={handleSaveQuestionAsTemplate}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
              >
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Question Exporter</span>
                  <h3 className="text-md font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-indigo-500" />
                    <span>Save Question as Template</span>
                  </h3>
                  <p className="text-xs text-slate-400">Save this specific question prompt, standard points, options, or solution rubrics into your library of reusable question designs.</p>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400">Question Template Name / Prompt Tag</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JavaScript Closure Interview Probe"
                    value={saveTemplateName}
                    onChange={(e) => setSaveTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-50 dark:border-slate-900">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveQTplModal(null);
                      setSaveTemplateName("");
                    }}
                    className="px-4 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/10 active:scale-95 transition-all"
                  >
                    Save Reusable Question
                  </button>
                </div>
              </motion.form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== DIALOG: INSERT QUESTION TEMPLATE SELECTOR ==================== */}
      <AnimatePresence>
        {showInsertQuestionTplModal && (
          <div className="fixed inset-0 z-55 overflow-y-auto" id="insert-question-template-dialog">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInsertQuestionTplModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Library Insertion</span>
                    <h3 className="text-md font-black text-slate-800 dark:text-slate-100">Select Question Template</h3>
                  </div>
                  <button
                    onClick={() => setShowInsertQuestionTplModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {questionTemplates.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6 italic">No question templates saved yet.</p>
                  ) : (
                    questionTemplates.map((tpl) => {
                      const typeLabels: { [key: string]: string } = {
                        mcq: "Multiple Choice",
                        short: "Short Essay",
                        code: "Structured Code Challenge",
                        file: "File Upload Space",
                        "audio-video": "A/V Response Recording"
                      };
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => handleInsertQuestionTemplate(tpl)}
                          className="p-3.5 border border-slate-100 dark:border-slate-900 rounded-xl bg-slate-50/20 dark:bg-slate-900/10 flex items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-900 cursor-pointer transition-all hover:bg-indigo-500/5"
                        >
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{tpl.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-extrabold text-slate-500 dark:text-slate-400">
                                {typeLabels[tpl.question.type || "mcq"]}
                              </span>
                              <span className="text-[9px] font-extrabold text-indigo-500">
                                {tpl.question.points} Points
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-indigo-500 hover:text-indigo-700 font-extrabold flex items-center gap-0.5">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Insert</span>
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-50 dark:border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowInsertQuestionTplModal(false)}
                    className="px-4 py-2 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
