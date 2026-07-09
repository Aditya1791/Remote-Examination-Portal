export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type QuestionType = 'mcq' | 'short' | 'code' | 'file' | 'audio-video';

export interface Question {
  id: string;
  questionText: string;
  type: QuestionType;
  options?: string[]; // relevant for MCQ
  correctAnswer: string; // for auto-grading MCQs, or matching standard answers
  points: number;
  
  // Advanced parameters for code editor, file uploads, and audio-video questions
  codeLanguage?: string;
  codeTemplate?: string;
  maxFileSizeMB?: number;
  recordingDurationSeconds?: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  creatorId: string;
  creatorName: string;
  questions: Question[];
  createdAt: string;

  // Custom proctoring configuration rules
  proctorRules?: {
    warningThreshold: number; // e.g., 3 warnings
    blockCopyPaste: boolean;
    autoSubmitOnViolation: boolean;
    enableNoiseDetection?: boolean;
    noiseThreshold?: number; // 0 to 100 percentage
  };
}

export interface Submission {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  startTime: string;
  submitTime?: string;
  answers: { [questionId: string]: string };
  score: number;
  maxScore: number;
  graded: boolean;
  feedback?: string;
  status: 'started' | 'submitted';
  durationSeconds?: number;
  resultStatus?: 'passed' | 'failed';
  questionScores?: { [questionId: string]: number };
}

export type ProctorEvent = 'tab-switch' | 'blur' | 'focus' | 'keyboard-shortcut' | 'context-menu' | 'noise-alert' | 'intervention';

export interface ProctorWarning {
  id: string;
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface ProctorLog {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  eventType: ProctorEvent;
  timestamp: string;
  details: string;
}

export interface DashboardStats {
  totalExams: number;
  totalSubmissions: number;
  totalStudents: number;
  totalTeachers: number;
}

export interface TeacherAnalytics {
  examId: string;
  examTitle: string;
  averageScore: number;
  maxScore: number;
  passRate: number; // percentage of students who passed (e.g. >= 50% score)
  totalSubmissions: number;
  scoreDistribution: { range: string; count: number }[];
  durationAverageSeconds: number;
}
