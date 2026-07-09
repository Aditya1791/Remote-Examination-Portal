import React, { useState, useEffect, useRef } from "react";
import { Exam, Question, Submission, ProctorEvent } from "../types";
import { 
  BookOpen, Clock, Play, CheckCircle, HelpCircle, ChevronLeft, ChevronRight, 
  Send, ShieldAlert, Award, FileText, Check, AlertTriangle, RefreshCw, X,
  Terminal, Cpu, UploadCloud, Mic, MicOff, Video, Square, Volume2, Paperclip,
  Fingerprint, Scan, ShieldCheck, RefreshCcw, Camera
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

interface StudentPortalProps {
  token: string;
  onTokenRefresh: (token: string) => void;
}

export default function StudentPortal({ token, onTokenRefresh }: StudentPortalProps) {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Exam session taking states
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeSub, setActiveSub] = useState<Submission | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<{ [qId: string]: string }>({});
  const studentAnswersRef = useRef(studentAnswers);
  useEffect(() => {
    studentAnswersRef.current = studentAnswers;
  }, [studentAnswers]);
  const [activeQIdx, setActiveQIdx] = useState(0);

  // Timer countdown
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // in seconds
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<any>(null);
  const blurTimeoutRef = useRef<any>(null);

  // Proctor Warning Overlays
  const [proctorWarning, setProctorWarning] = useState<string | null>(null);
  const [warningCount, setWarningCount] = useState(0);

  const [studentTab, setStudentTab] = useState<'roster' | 'results'>('roster');
  const [reviewSubId, setReviewSubId] = useState<string | null>(null);
  const [reviewSubDetail, setReviewSubDetail] = useState<{ submission: Submission; exam: Exam } | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);

  // Interactive Simulation States
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileOutput, setCompileOutput] = useState<{ [qId: string]: string }>({});
  
  const [uploadedFiles, setUploadedFiles] = useState<{ [qId: string]: { name: string, size: number, status: 'idle' | 'uploading' | 'completed' | 'error', error?: string } }>({});
  
  const [recordingStates, setRecordingStates] = useState<{ [qId: string]: { isRecording: boolean, timeLeft: number, audioUrl: string | null } }>({});
  const recordingTimerRef = useRef<{ [qId: string]: any }>({});

  // Ambient Noise Detection States
  const [currentNoiseLevel, setCurrentNoiseLevel] = useState<number>(0);
  const [isNoiseProctorActive, setIsNoiseProctorActive] = useState<boolean>(false);

  // Student FaceID / TouchID Biometric Verification State
  const [biometricModalOpen, setBiometricModalOpen] = useState<boolean>(false);
  const [biometricExamId, setBiometricExamId] = useState<string | null>(null);
  const [biometricMethod, setBiometricMethod] = useState<'face' | 'fingerprint'>('face');
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [biometricProgress, setBiometricProgress] = useState<number>(0);
  const [biometricFeedback, setBiometricFeedback] = useState<string>("");
  const [verifiedExams, setVerifiedExams] = useState<{ [examId: string]: boolean }>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Quick Review summary modal state
  const [quickReview, setQuickReview] = useState<{
    examTitle: string;
    totalQuestions: number;
    answeredQuestions: number;
    timeTakenSeconds: number;
    totalPoints: number;
  } | null>(null);

  // Real-time proctoring logs and toasts
  const [proctorLogs, setProctorLogs] = useState<Array<{
    id: string;
    eventType: ProctorEvent;
    details: string;
    timestamp: Date;
  }>>([]);

  const [proctorToasts, setProctorToasts] = useState<Array<{
    id: string;
    eventType: ProctorEvent;
    details: string;
    timestamp: Date;
    isDismissed: boolean;
  }>>([]);

  // Proctor Manual Warning Interventions State
  const [activeWarnings, setActiveWarnings] = useState<any[]>([]);
  const [unacknowledgedWarning, setUnacknowledgedWarning] = useState<any | null>(null);
  const [acknowledgingWarningId, setAcknowledgingWarningId] = useState<string | null>(null);

  // Poll for manual teacher intervention warnings
  useEffect(() => {
    if (!activeExam) {
      setUnacknowledgedWarning(null);
      return;
    }

    const pollWarnings = () => {
      fetch(`/api/proctor/warnings?examId=${activeExam.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch warnings");
        })
        .then(warnings => {
          setActiveWarnings(warnings);
          // Find first unacknowledged warning
          const unacked = warnings.find((w: any) => !w.acknowledged);
          if (unacked) {
            setUnacknowledgedWarning(unacked);
          } else {
            setUnacknowledgedWarning(null);
          }
        })
        .catch(err => console.error("Error polling proctor warnings:", err));
    };

    // Poll immediately
    pollWarnings();

    const interval = setInterval(pollWarnings, 3000);
    return () => clearInterval(interval);
  }, [activeExam, token]);

  const handleAcknowledgeWarning = async (warningId: string) => {
    setAcknowledgingWarningId(warningId);
    try {
      const res = await fetch(`/api/proctor/warnings/${warningId}/acknowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to acknowledge warning.");
      }

      // Update warning list
      setUnacknowledgedWarning(null);
      
      // Fetch newest warnings to stay completely in sync
      const warningsRes = await fetch(`/api/proctor/warnings?examId=${activeExam?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (warningsRes.ok) {
        const warnings = await warningsRes.json();
        setActiveWarnings(warnings);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to record acknowledgement. Please try again.");
    } finally {
      setAcknowledgingWarningId(null);
    }
  };

  // ==========================================
  // SESSION EXPIRY MONITORING & REFRESH LOGIC
  // ==========================================
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);
  const [showSessionExpiryModal, setShowSessionExpiryModal] = useState<boolean>(false);
  const [refreshingSession, setRefreshingSession] = useState<boolean>(false);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [simulatedTimeLeft, setSimulatedTimeLeft] = useState<number>(0);

  const getJwtExpiry = (jwtToken: string): number | null => {
    try {
      const payloadBase64 = jwtToken.split(".")[1];
      if (!payloadBase64) return null;
      const decodedJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
      const decoded = JSON.parse(decodedJson);
      return decoded.exp || null;
    } catch (err) {
      console.error("Error decoding JWT payload:", err);
      return null;
    }
  };

  // Monitor session token lifetime
  useEffect(() => {
    const checkExpiry = () => {
      if (simulationActive) {
        setSimulatedTimeLeft(prev => {
          const nextVal = prev > 0 ? prev - 1 : 0;
          setSessionTimeLeft(nextVal);
          if (nextVal <= 300 && nextVal > 0 && activeExam) {
            setShowSessionExpiryModal(true);
          } else if (nextVal === 0) {
            setShowSessionExpiryModal(false);
          }
          return nextVal;
        });
        return;
      }

      const expiryEpoch = getJwtExpiry(token);
      if (!expiryEpoch) {
        setSessionTimeLeft(null);
        return;
      }

      const nowEpoch = Math.floor(Date.now() / 1000);
      const remainingSeconds = expiryEpoch - nowEpoch;
      setSessionTimeLeft(remainingSeconds);

      // Warning triggers at 5 minutes (300 seconds) before expiration
      if (remainingSeconds <= 300 && remainingSeconds > 0 && activeExam) {
        setShowSessionExpiryModal(true);
      } else {
        if (remainingSeconds > 300) {
          setShowSessionExpiryModal(false);
        }
      }
    };

    const interval = setInterval(checkExpiry, 1000);
    checkExpiry();

    return () => clearInterval(interval);
  }, [token, activeExam, simulationActive]);

  const handleSilentTokenRefresh = async (isTestShort: boolean = false) => {
    setRefreshingSession(true);
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ testShortExpiry: isTestShort })
      });

      if (!res.ok) {
        throw new Error("Failed to refresh session token.");
      }

      const data = await res.json();
      if (data.token) {
        setSimulationActive(false);
        onTokenRefresh(data.token);
        setShowSessionExpiryModal(false);
      }
    } catch (err) {
      console.error("Error refreshing token:", err);
      alert("Failed to extend exam session token silently. Please try again.");
    } finally {
      setRefreshingSession(false);
    }
  };

  const triggerInstantSimulation = () => {
    setSimulationActive(true);
    setSimulatedTimeLeft(280); // 4 minutes 40 seconds remaining (triggers warnings instantly)
    setSessionTimeLeft(280);
    setShowSessionExpiryModal(true);
  };

  const triggerShortTokenSimulation = async () => {
    // This will fetch a real token from the server with 8-minute lifespan.
    // The warning modal will appear naturally in 3 minutes when time left <= 5 minutes.
    await handleSilentTokenRefresh(true);
  };

  const fetchStudentExams = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/exams", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load candidate exam roster.");
      setExams(await res.json());
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to communicate with Express exam server.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = async (submissionId: string) => {
    setLoadingReview(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load review sheet.");
      const data = await res.json();
      setReviewSubDetail(data);
      setReviewSubId(submissionId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingReview(false);
    }
  };

  useEffect(() => {
    fetchStudentExams();
  }, [token]);

  // Student Biometric Verification Handlers
  const fingerprintIntervalRef = useRef<any>(null);

  const handleInitiateExam = (examId: string) => {
    if (verifiedExams[examId]) {
      handleStartExam(examId);
    } else {
      setBiometricExamId(examId);
      setBiometricStatus('idle');
      setBiometricProgress(0);
      setBiometricFeedback('Authentication required. Select verification method below to verify identity.');
      setBiometricModalOpen(true);
    }
  };

  const handleStartBiometricScan = async (method: 'face' | 'fingerprint') => {
    if (fingerprintIntervalRef.current) {
      clearInterval(fingerprintIntervalRef.current);
    }
    // Release any previous camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
    }

    setBiometricMethod(method);
    setBiometricStatus('scanning');
    setBiometricProgress(0);
    setBiometricFeedback(method === 'face' ? 'Requesting secure camera stream...' : 'Place and hold finger on biometric sensor below...');

    if (method === 'face') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // Simulating facial recognition scanning
        let p = 0;
        const interval = setInterval(() => {
          p += 4;
          if (p <= 20) {
            setBiometricFeedback('Detecting facial alignment & structure...');
          } else if (p <= 50) {
            setBiometricFeedback('Mapping facial landmarks & coordinates...');
          } else if (p <= 75) {
            setBiometricFeedback('Performing anti-spoofing live feedback analysis...');
          } else if (p < 100) {
            setBiometricFeedback('Matching biometric profile with candidate records...');
          } else {
            clearInterval(interval);
            setBiometricFeedback('FaceID Identity Match Confirmed!');
            setBiometricProgress(100);
            setBiometricStatus('success');
            
            // Turn off camera
            if (videoRef.current && videoRef.current.srcObject) {
              const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
              tracks.forEach(t => t.stop());
            }

            // Successfully verified - launch exam
            setTimeout(() => {
              if (biometricExamId) {
                setVerifiedExams(prev => ({ ...prev, [biometricExamId]: true }));
                setBiometricModalOpen(false);
                handleStartExam(biometricExamId);
              }
            }, 1000);
            return;
          }
          setBiometricProgress(p);
        }, 120);
        fingerprintIntervalRef.current = interval; // share handle for teardown
      } catch (err) {
        console.error('Biometric Camera Access Denied:', err);
        setBiometricStatus('error');
        setBiometricFeedback('Camera hardware unavailable or permission denied. Please use the Fingerprint Scanner fallback method.');
      }
    }
  };

  const startFingerprintHold = () => {
    if (biometricStatus === 'success') return;
    setBiometricStatus('scanning');
    setBiometricProgress(0);
    setBiometricFeedback('Touch ID scanner active. Hold your finger down...');

    fingerprintIntervalRef.current = setInterval(() => {
      setBiometricProgress(prev => {
        const next = prev + 5;
        if (next <= 30) {
          setBiometricFeedback('Scanning pattern lines and bifurcation points...');
        } else if (next <= 60) {
          setBiometricFeedback('Processing epidermal ridge data...');
        } else if (next <= 85) {
          setBiometricFeedback('Matching database credentials...');
        } else if (next < 100) {
          setBiometricFeedback('Completing fingerprint authentication...');
        } else {
          clearInterval(fingerprintIntervalRef.current);
          setBiometricFeedback('Fingerprint Verification Confirmed!');
          setBiometricStatus('success');
          
          setTimeout(() => {
            if (biometricExamId) {
              setVerifiedExams(prev => ({ ...prev, [biometricExamId]: true }));
              setBiometricModalOpen(false);
              handleStartExam(biometricExamId);
            }
          }, 1000);
          return 100;
        }
        return next;
      });
    }, 120);
  };

  const stopFingerprintHold = () => {
    if (biometricStatus === 'success') return;
    if (fingerprintIntervalRef.current) {
      clearInterval(fingerprintIntervalRef.current);
    }
    setBiometricStatus('idle');
    setBiometricProgress(0);
    setBiometricFeedback('Scanner released early. Please click and hold until scan completes.');
  };

  const closeBiometricModal = () => {
    if (fingerprintIntervalRef.current) {
      clearInterval(fingerprintIntervalRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
    }
    setBiometricModalOpen(false);
    setBiometricStatus('idle');
    setBiometricProgress(0);
    setBiometricExamId(null);
  };

  // Start taking an exam
  const handleStartExam = async (examId: string) => {
    setLoading(true);
    try {
      // 1. Trigger session start on backend
      const startRes = await fetch(`/api/exams/${examId}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!startRes.ok) throw new Error("Could not initialize started exam session.");
      const subData = await startRes.json();
      setActiveSub(subData);

      // 2. Load full questions sheet (stripped of correct answers for student)
      const examRes = await fetch(`/api/exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!examRes.ok) throw new Error("Failed to pull candidate examination paper.");
      const examData = await examRes.json();
      setActiveExam(examData);

      // Save active exam ID to local storage for persistence across reloads
      localStorage.setItem("active_exam_id", examId);

      // Load saved answers from localStorage if available, otherwise fallback to subData.answers
      const savedAnswersRaw = localStorage.getItem(`exam_answers_${examId}`);
      let mergedAnswers = subData.answers || {};
      if (savedAnswersRaw) {
        try {
          mergedAnswers = { ...mergedAnswers, ...JSON.parse(savedAnswersRaw) };
        } catch (e) {
          console.error("Failed to parse local storage answers:", e);
        }
      }

      // Initialize answer states
      setStudentAnswers(mergedAnswers);
      setActiveQIdx(0);
      setElapsedSeconds(0);
      setWarningCount(0);
      setProctorWarning(null);
      setProctorLogs([]);
      setProctorToasts([]);

      // Initialize countdown timer: duration in minutes to seconds
      const maxTimeSeconds = examData.durationMinutes * 60;
      const alreadyPassedSeconds = Math.floor((Date.now() - new Date(subData.startTime).getTime()) / 1000);
      const remaining = Math.max(maxTimeSeconds - alreadyPassedSeconds, 0);

      setTimeLeft(remaining);

      // If remaining time has already elapsed, trigger auto-submit immediately
      if (remaining <= 0) {
        alert("TIME EXPIRED! This exam time has already finished. Your paper will be submitted automatically.");
        handleSubmitExamAnswers(mergedAnswers);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerPremiumConfetti = () => {
    try {
      // Left side burst
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ["#6366f1", "#10b981", "#3b82f6", "#f59e0b"]
      });
      // Right side burst
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ["#6366f1", "#10b981", "#3b82f6", "#f59e0b"]
      });
      
      // Middle pop after a slight delay
      setTimeout(() => {
        confetti({
          particleCount: 35,
          spread: 70,
          origin: { x: 0.5, y: 0.65 },
          colors: ["#6366f1", "#10b981", "#3b82f6", "#f59e0b"]
        });
      }, 250);
    } catch (e) {
      console.error("Confetti execution error:", e);
    }
  };

  // Submit student answers worksheet
  const handleSubmitExamAnswers = async (finalAnswersMap = studentAnswers) => {
    if (!activeExam) return;
    setLoading(true);

    // Stop active timer
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const res = await fetch(`/api/exams/${activeExam.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          answers: finalAnswersMap,
          durationSeconds: elapsedSeconds
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to finalize exam submission.");
      }

      // Calculate details for Quick Review before clearing states
      const totalQuestions = activeExam.questions.length;
      const answeredQuestions = activeExam.questions.filter(
        q => finalAnswersMap[q.id] !== undefined && finalAnswersMap[q.id] !== null && String(finalAnswersMap[q.id]).trim() !== ""
      ).length;
      const timeTakenSeconds = elapsedSeconds;
      const totalPoints = activeExam.questions.reduce((sum, q) => sum + (q.points || 0), 0);

      const reviewDetails = {
        examTitle: activeExam.title,
        totalQuestions,
        answeredQuestions,
        timeTakenSeconds,
        totalPoints
      };

      // Clear localStorage persistence keys for this exam
      localStorage.removeItem("active_exam_id");
      localStorage.removeItem(`exam_answers_${activeExam.id}`);

      // Reset exam taking scopes
      setActiveExam(null);
      setActiveSub(null);
      setTimeLeft(null);
      
      // Refresh list
      fetchStudentExams();
      
      // Set quick review to show the modal
      setQuickReview(reviewDetails);

      // Trigger the subtle, professional confetti celebration
      triggerPremiumConfetti();
    } catch (err: any) {
      alert(err.message || "Something went wrong finalizing your answers.");
    } finally {
      setLoading(false);
    }
  };

  // Stable persistent countdown timer effect (without dependency array recreation flickering)
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && activeExam) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
        setTimeLeft(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Submit with latest local answers from localStorage fallback if state is stale
            const savedAnswersRaw = localStorage.getItem(`exam_answers_${activeExam.id}`);
            let finalAnswers = studentAnswers;
            if (savedAnswersRaw) {
              try {
                finalAnswers = JSON.parse(savedAnswersRaw);
              } catch (e) {
                console.error("Failed to parse latest answers on expiration:", e);
              }
            }
            // Trigger automatic submission
            setTimeout(() => {
              alert("TIME EXPIRED! Your exam paper will be submitted automatically with your current answers.");
              handleSubmitExamAnswers(finalAnswers);
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeExam, timeLeft === null]); // stable trigger upon initialization

  // Auto-resume active/started exam sessions
  useEffect(() => {
    if (exams.length > 0 && !activeExam) {
      const savedExamId = localStorage.getItem("active_exam_id");
      const inProgressExam = exams.find(e => e.id === savedExamId) || exams.find(e => e.status === "started");
      if (inProgressExam) {
        handleInitiateExam(inProgressExam.id);
      }
    }
  }, [exams, activeExam]);

  // Shared Proctoring Helper Functions
  const logProctorViolation = async (eventType: ProctorEvent, details: string) => {
    if (!activeExam) return;

    const newLog = {
      id: Math.random().toString(36).substring(7),
      eventType,
      details,
      timestamp: new Date()
    };

    setProctorLogs(prev => [newLog, ...prev]);

    if (eventType === "tab-switch" || eventType === "blur" || eventType === "keyboard-shortcut" || eventType === "context-menu" || eventType === "noise-alert") {
      setProctorToasts(prev => [
        ...prev,
        {
          ...newLog,
          isDismissed: false
        }
      ]);
    }

    try {
      await fetch("/api/proctor/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          examId: activeExam.id,
          eventType,
          details
        })
      });
    } catch (err) {
      console.error("Failed to stream proctor log telemetry:", err);
    }
  };

  const checkViolationEnforcement = (currentCount: number) => {
    if (!activeExam) return;
    const threshold = activeExam.proctorRules?.warningThreshold ?? 3;
    const shouldAutoSubmit = activeExam.proctorRules?.autoSubmitOnViolation ?? false;
    
    if (shouldAutoSubmit && currentCount >= threshold) {
      // Submit answers immediately
      alert(`EXAM FORCEFULLY CLOSED! You have exceeded the maximum warning threshold of ${threshold} infractions. Your active answers are being submitted automatically to protect assessment integrity.`);
      const savedAnswersRaw = localStorage.getItem(`exam_answers_${activeExam.id}`);
      let finalAnswers = studentAnswersRef.current;
      if (savedAnswersRaw) {
        try {
          finalAnswers = JSON.parse(savedAnswersRaw);
        } catch (e) {
          console.error("Failed to parse latest answers on force submit:", e);
        }
      }
      handleSubmitExamAnswers(finalAnswers);
    }
  };

  // MICROPHONE AMBIENT NOISE PROCTORING
  useEffect(() => {
    if (!activeExam || !activeExam.proctorRules?.enableNoiseDetection) {
      setCurrentNoiseLevel(0);
      setIsNoiseProctorActive(false);
      return;
    }

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let stream: MediaStream | null = null;
    let animationFrameId: number | null = null;
    
    let consecHighCounts = 0;
    const threshold = activeExam.proctorRules.noiseThreshold ?? 50;
    let lastLogTime = 0;

    const startAudioProctoring = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioCtx();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        setIsNoiseProctorActive(true);

        const checkVolume = () => {
          if (!analyser || !audioContext) return;
          
          analyser.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength;
          
          // Map average amplitude to a 0-100 scale
          const level = Math.min(100, Math.round((avg / 48) * 100));
          setCurrentNoiseLevel(level);

          if (level > threshold) {
            consecHighCounts++;
          } else {
            consecHighCounts = Math.max(0, consecHighCounts - 1);
          }

          // If sound levels are continuously high for ~1 second (around 25 animation frames)
          if (consecHighCounts >= 25) {
            consecHighCounts = 0;
            const now = Date.now();
            // Throttle noise infractions to once every 10 seconds to avoid spamming
            if (now - lastLogTime > 10000) {
              lastLogTime = now;
              
              const msg = `Suspicious background acoustics detected: Current sound level (${level}%) exceeds the configured limit of ${threshold}%. Potential background speech or tutor interaction.`;
              
              setWarningCount(c => {
                const nextCount = c + 1;
                checkViolationEnforcement(nextCount);
                return nextCount;
              });

              setProctorWarning(`ACOUSTIC INCIDENT DETECTED: Ambient noise level (${level}%) exceeds allowed limit (${threshold}%). Please maintain classroom silence.`);
              logProctorViolation("noise-alert", msg);
            }
          }

          animationFrameId = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      } catch (err) {
        console.warn("Could not activate microphone-based ambient noise tracking:", err);
        setIsNoiseProctorActive(false);
      }
    };

    startAudioProctoring();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (source) {
        source.disconnect();
      }
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setCurrentNoiseLevel(0);
      setIsNoiseProctorActive(false);
    };
  }, [activeExam, token]);

  // PROCTORING EVENT DETECTION HOOKS
  useEffect(() => {
    if (!activeExam) return;

    // Tab switcher tracker
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const msg = "Student minimized browser window or switched active application tabs.";
        setWarningCount(c => {
          const nextCount = c + 1;
          checkViolationEnforcement(nextCount);
          return nextCount;
        });
        setProctorWarning("SUSPICIOUS ACTIVITY: TAB / WINDOW SWITCH DETECTED");
        logProctorViolation("tab-switch", msg);
      }
    };

    // Blur focus loss tracker
    const handleBlur = () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = setTimeout(() => {
        if (document.hidden) return; // Tab switch handled by visibilitychange, ignore duplicate blur
        const msg = "Student lost browser focus (clicked away outside the exam canvas).";
        setWarningCount(c => {
          const nextCount = c + 1;
          checkViolationEnforcement(nextCount);
          return nextCount;
        });
        setProctorWarning("SUSPICIOUS ACTIVITY: EXAM WINDOW LOST FOCUS (CLICKED AWAY)");
        logProctorViolation("blur", msg);
      }, 150);
    };

    // Refocus tracker
    const handleFocus = () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      logProctorViolation("focus", "Student returned focus to the exam dashboard.");
    };

    // Keyboard shortcut preventer
    const handleKeyDown = (e: KeyboardEvent) => {
      const blockCopyPaste = activeExam.proctorRules?.blockCopyPaste ?? true;
      if (!blockCopyPaste) return; // copy/paste limits bypassed!

      const isMeta = e.ctrlKey || e.metaKey;
      let blocked = false;
      let details = "";

      // Check for Copy/Paste/Cut/Print/View Source/Save
      if (isMeta) {
        const key = e.key.toLowerCase();
        if (key === 'c') {
          blocked = true;
          details = "Attempted to COPY text content using keyboard shortcut (Ctrl/Cmd + C).";
        } else if (key === 'v') {
          blocked = true;
          details = "Attempted to PASTE text content using keyboard shortcut (Ctrl/Cmd + V).";
        } else if (key === 'x') {
          blocked = true;
          details = "Attempted to CUT content using keyboard shortcut (Ctrl/Cmd + X).";
        } else if (key === 'p') {
          blocked = true;
          details = "Attempted to PRINT or save PDF of page using keyboard shortcut (Ctrl/Cmd + P).";
        } else if (key === 'u') {
          blocked = true;
          details = "Attempted to VIEW SOURCE using keyboard shortcut (Ctrl/Cmd + U).";
        } else if (key === 's') {
          blocked = true;
          details = "Attempted to SAVE document using keyboard shortcut (Ctrl/Cmd + S).";
        }
      }

      // Check for F12 or devtools keys
      if (e.key === 'F12') {
        blocked = true;
        details = "Attempted to inspect elements using F12 hotkey.";
      }
      if (isMeta && e.shiftKey && e.key.toLowerCase() === 'i') {
        blocked = true;
        details = "Attempted to inspect elements using developer console shortcut (Ctrl/Cmd + Shift + I).";
      }
      if (isMeta && e.altKey && e.key.toLowerCase() === 'i') {
        blocked = true;
        details = "Attempted to inspect elements using developer console shortcut (Ctrl/Cmd + Alt + I).";
      }

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        setWarningCount(c => {
          const nextCount = c + 1;
          checkViolationEnforcement(nextCount);
          return nextCount;
        });
        setProctorWarning(`SECURITY WARNING: Keyboard Shortcut Blocked. ${details}`);
        logProctorViolation("keyboard-shortcut", details);
      }
    };

    // Context menu click preventer
    const handleContextMenu = (e: MouseEvent) => {
      const blockCopyPaste = activeExam.proctorRules?.blockCopyPaste ?? true;
      if (!blockCopyPaste) return; // right-clicks allowed!

      e.preventDefault();
      const details = "Attempted to open right-click context menu (possibly to copy/paste/inspect).";
      setWarningCount(c => {
        const nextCount = c + 1;
        checkViolationEnforcement(nextCount);
        return nextCount;
      });
      setProctorWarning("SECURITY WARNING: Right-click is strictly disabled during active exams.");
      logProctorViolation("context-menu", details);
    };

    // Clipboard event handler (cut, copy, paste)
    const handleClipboard = (e: ClipboardEvent) => {
      const blockCopyPaste = activeExam.proctorRules?.blockCopyPaste ?? true;
      if (!blockCopyPaste) return;

      e.preventDefault();
      const action = e.type.toUpperCase();
      const details = `Attempted to ${action} content inside the exam canvas.`;
      
      setWarningCount(c => {
        const nextCount = c + 1;
        checkViolationEnforcement(nextCount);
        return nextCount;
      });
      setProctorWarning(`SECURITY WARNING: Clipboard Action Blocked. ${details}`);
      logProctorViolation("keyboard-shortcut", details);
    };

    // Bind event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("copy", handleClipboard, true);
    document.addEventListener("paste", handleClipboard, true);
    document.addEventListener("cut", handleClipboard, true);

    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("copy", handleClipboard, true);
      document.removeEventListener("paste", handleClipboard, true);
      document.removeEventListener("cut", handleClipboard, true);
    };
  }, [activeExam, token]);

  const handleSelectOption = (qId: string, value: string) => {
    const updated = { ...studentAnswers, [qId]: value };
    setStudentAnswers(updated);
    if (activeExam) {
      localStorage.setItem(`exam_answers_${activeExam.id}`, JSON.stringify(updated));
    }
  };

  const handleShortTextChange = (qId: string, text: string) => {
    const updated = { ...studentAnswers, [qId]: text };
    setStudentAnswers(updated);
    if (activeExam) {
      localStorage.setItem(`exam_answers_${activeExam.id}`, JSON.stringify(updated));
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading && exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500 font-medium font-sans">Connecting to security gateway...</p>
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
        {/* 1. CANDIDATE EXAM ROSTER VIEW */}
        {!activeExam && (
          <motion.div
            key="exam-roster"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Student Assessment Dashboard</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Participate in monitored exams and review graded feedback</p>
            </div>
            <button
              onClick={fetchStudentExams}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Roster</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-900 pb-3 gap-6">
            <button
              type="button"
              onClick={() => setStudentTab('roster')}
              className={`pb-1.5 text-xs font-black uppercase tracking-wider transition-all relative ${
                studentTab === 'roster'
                  ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <span>Available Exams</span>
              {studentTab === 'roster' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setStudentTab('results')}
              className={`pb-1.5 text-xs font-black uppercase tracking-wider transition-all relative ${
                studentTab === 'results'
                  ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <span>My Results & Performance</span>
              {studentTab === 'results' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded" />
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl">
              {error}
            </div>
          )}

          {studentTab === 'roster' ? (
            exams.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-900 rounded-2xl bg-white dark:bg-slate-950/20">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="text-md font-bold text-slate-800 dark:text-slate-200">No Assessment Scheduled</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Your instructors haven't posted any assessments. Coordinate with your teacher to assign examination templates.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {exams.map((exam) => {
                  const isSubmitted = exam.status === "submitted";
                  const isStarted = exam.status === "started";
                  const submission = exam.submission;

                  return (
                    <div key={exam.id} className="p-6 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md">
                            {exam.durationMinutes} Min Limit
                          </span>
                          
                          {/* Status tag */}
                          {isSubmitted ? (
                            submission?.graded ? (
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  submission.resultStatus === "passed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}>
                                  <span>{submission.resultStatus === "passed" ? "Passed" : "Failed"}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-800">
                                  <span>Graded</span>
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                                <Clock className="w-2.5 h-2.5 animate-pulse" />
                                <span>Awaiting Marks</span>
                              </span>
                            )
                          ) : isStarted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 animate-pulse">
                              <Clock className="w-2.5 h-2.5 animate-spin" />
                              <span>In Progress</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
                              <span>Ready</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-md font-extrabold text-slate-900 dark:text-slate-100 leading-tight">{exam.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{exam.description}</p>
                      </div>

                      {/* Footer Score or Launch Option */}
                      <div className="pt-4 border-t border-slate-50 dark:border-slate-900/60 flex flex-col space-y-3">
                        {isSubmitted ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-400">Your Scored Grade:</span>
                              <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100">
                                {submission?.graded ? `${submission.score} / ${submission.maxScore}` : `-- / ${submission.maxScore}`}
                              </span>
                            </div>

                            {submission?.feedback && (
                              <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1">
                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Instructor Comments</p>
                                <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                                  &quot;{submission.feedback}&quot;
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400">
                              Questions: <span className="font-mono text-slate-700 dark:text-slate-300 font-extrabold">{exam.questionsCount}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleInitiateExam(exam.id)}
                              className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center gap-1.5 ${
                                isStarted
                                  ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/10"
                                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10"
                              }`}
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>{isStarted ? "Resume Examination" : "Start Examination"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Results Tab View */
            (() => {
              const gradedExams = exams.filter(e => e.status === "submitted" && e.submission?.graded);
              const totalGraded = gradedExams.length;
              const passedCount = gradedExams.filter(e => e.submission?.resultStatus === "passed").length;
              const failedCount = gradedExams.filter(e => e.submission?.resultStatus === "failed").length;

              const totalPercentage = totalGraded > 0
                ? Math.round(gradedExams.reduce((sum, e) => sum + ((e.submission?.score || 0) / (e.submission?.maxScore || 1)) * 100, 0) / totalGraded)
                : 0;

              return (
                <div className="space-y-6">
                  {/* Results metrics header */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl flex flex-col justify-between shadow-sm">
                      <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Average Performance</span>
                      <span className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2 font-mono">
                        {totalPercentage}%
                      </span>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl flex flex-col justify-between shadow-sm">
                      <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Passed Sheets</span>
                      <span className="text-2xl font-black text-emerald-600 mt-2 font-mono">
                        {passedCount}
                      </span>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl flex flex-col justify-between shadow-sm">
                      <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider">Failed Sheets</span>
                      <span className="text-2xl font-black text-rose-600 mt-2 font-mono">
                        {failedCount}
                      </span>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl flex flex-col justify-between shadow-sm">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Graded</span>
                      <span className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2 font-mono">
                        {totalGraded}
                      </span>
                    </div>
                  </div>

                  {/* List of submissions */}
                  {totalGraded === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-900 rounded-2xl bg-white dark:bg-slate-950/20">
                      <Award className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3 animate-pulse" />
                      <h3 className="text-md font-bold text-slate-800 dark:text-slate-200">No Graded Submissions</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                        Any exams you complete and submit will show up here once graded and validated by your academic instructor.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {gradedExams.map(exam => {
                        const sub = exam.submission!;
                        const percent = Math.round((sub.score / sub.maxScore) * 100);
                        const isPassed = sub.resultStatus === "passed";

                        return (
                          <div key={exam.id} className="p-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  isPassed 
                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/10" 
                                    : "bg-rose-500/10 text-rose-600 border border-rose-500/10"
                                }`}>
                                  {isPassed ? "Passed" : "Failed"}
                                </span>
                                {sub.submitTime && (
                                  <span className="text-[10px] text-slate-400 font-bold font-sans">
                                    Submitted: {new Date(sub.submitTime).toLocaleDateString()} at {new Date(sub.submitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                                {exam.title}
                              </h3>
                              {sub.feedback && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                                  Instructor note: &quot;{sub.feedback}&quot;
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-start">
                              <div className="text-right">
                                <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-100 block leading-none">
                                  {sub.score} / {sub.maxScore}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 font-mono">
                                  ({percent}%)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenReview(sub.id)}
                                disabled={loadingReview}
                                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
                              >
                                {loadingReview && reviewSubId === sub.id ? "Loading..." : "Review Paper"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()
          )}
          </motion.div>
        )}

        {/* 2. IMMERSIVE EXAMINATION CLIENT */}
        {activeExam && activeSub && timeLeft !== null && (
          <motion.div
            key="active-exam-client"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative min-h-[calc(100vh-200px)] flex flex-col justify-between bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 overflow-hidden select-none"
          >
          
          {/* Proctor Infraction Modal Overlay */}
          {proctorWarning && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 mb-4 animate-bounce">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-rose-500 tracking-tight">{proctorWarning}</h3>
              <p className="text-sm text-slate-300 max-w-md mt-2 leading-relaxed">
                Our automated security grid detected tab switching, minimization, or loss of application focus. 
                All window violations are digitally signed and streamed to your instructor with immediate timestamps.
              </p>
              
              <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-300">
                Warning Threshold Count: <span className="text-white text-sm underline">{warningCount} logged infractions</span>
              </div>

              <button
                type="button"
                onClick={() => setProctorWarning(null)}
                className="mt-8 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-500/15 transition-all active:scale-95"
              >
                I understand. Resume monitored assessment
              </button>
            </div>
          )}

          {/* Floating client status headers */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-900 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest font-mono">Secured Monitor Mode Active</span>
              </div>
              <h2 className="text-lg font-black text-slate-950 dark:text-slate-100 leading-none">
                {activeExam.title}
              </h2>
            </div>

            {/* Timer countdown module */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm shrink-0 transition-all duration-300 ${
              timeLeft < 60
                ? "border-rose-500 bg-rose-600 text-white animate-pulse"
                : timeLeft < 300
                ? "border-rose-400 bg-rose-500/10 text-rose-500 animate-pulse"
                : "border-slate-200 dark:border-slate-800 bg-slate-50 text-slate-700 dark:text-slate-300"
            }`}>
              <Clock className={`w-4 h-4 shrink-0 ${timeLeft < 60 ? "animate-spin" : ""}`} />
              <span className="text-sm font-black font-mono leading-none">
                {formatTimeRemaining(timeLeft)}
              </span>
            </div>
          </div>

          {/* Silent Session Token Lifeline Monitor */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs select-none">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 shrink-0">
                <Fingerprint className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="font-bold text-slate-500 dark:text-slate-400 block sm:inline">JWT Auth Session Lifeline: </span>
                <span className="text-slate-900 dark:text-slate-200 font-extrabold font-mono">
                  {sessionTimeLeft !== null ? (
                    sessionTimeLeft > 3600 ? (
                      `${Math.floor(sessionTimeLeft / 3600)}h ${Math.floor((sessionTimeLeft % 3600) / 60)}m`
                    ) : sessionTimeLeft > 0 ? (
                      `${Math.floor(sessionTimeLeft / 60)}m ${sessionTimeLeft % 60}s`
                    ) : (
                      "Expired"
                    )
                  ) : (
                    "Loading..."
                  )}
                </span>
                {sessionTimeLeft !== null && sessionTimeLeft <= 300 && (
                  <span className="ml-2 text-rose-500 font-bold uppercase tracking-wider animate-pulse text-[10px]">
                    ● Expiry Imminent
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Simulation Desk:</span>
              <button
                type="button"
                onClick={triggerInstantSimulation}
                className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold rounded-xl border border-amber-500/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                title="Sets time left to 4m 40s to trigger warning instantly"
              >
                Simulate 5m Warning
              </button>
              <button
                type="button"
                onClick={triggerShortTokenSimulation}
                className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold rounded-xl border border-indigo-500/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                title="Fetch a real token expiring in 8 minutes"
              >
                Simulate 8m Token
              </button>
            </div>
          </div>

          {/* Main Content Workspace Split with Real-Time Security Sidebar */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Hand: Question Sheets & Inputs */}
            <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
              {activeExam.questions.length > 0 && (
                <div className="flex-1 space-y-6">
                  
                  {/* Visual Progress Dashboard */}
                  {(() => {
                    const totalQuestions = activeExam.questions.length;
                    const answeredQuestions = Object.keys(studentAnswers).filter(k => activeExam.questions.some(q => q.id === k && studentAnswers[k]?.trim() !== "")).length;
                    const remainingQuestions = totalQuestions - answeredQuestions;
                    const percentComplete = Math.round((answeredQuestions / totalQuestions) * 100);

                    return (
                      <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-900 rounded-2xl shadow-sm space-y-4 select-none">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-3 bg-indigo-600 dark:bg-indigo-500 rounded-full animate-pulse" />
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Exam Progress Monitor</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs font-extrabold text-slate-500">
                            <span>
                              Answered: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{answeredQuestions}</strong> / {totalQuestions}
                            </span>
                            <span className="text-slate-200 dark:text-slate-800">|</span>
                            <span>
                              Remaining: <strong className="text-rose-500 font-black">{remainingQuestions}</strong>
                            </span>
                            <span className="text-slate-200 dark:text-slate-800">|</span>
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black">
                              {percentComplete}% Complete
                            </span>
                          </div>
                        </div>

                        {/* Continuous Smooth Progress Bar */}
                        <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentComplete}%` }}
                            transition={{ type: "spring", stiffness: 80, damping: 15 }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full absolute left-0 top-0 shadow-lg"
                          />
                        </div>

                        {/* Interactive Segmented Blueprint Map */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Interactive Question Map</p>
                            <span className="text-[9px] text-slate-400 font-extrabold">Jump to question by clicking any segment</span>
                          </div>
                          <div className="flex items-stretch gap-1 h-3">
                            {activeExam.questions.map((q, idx) => {
                              const isActive = idx === activeQIdx;
                              const isAnswered = studentAnswers[q.id] && studentAnswers[q.id].trim() !== "";
                              
                              return (
                                <button
                                  key={q.id}
                                  type="button"
                                  onClick={() => setActiveQIdx(idx)}
                                  className={`h-full rounded-md flex-1 transition-all duration-300 relative group overflow-visible cursor-pointer ${
                                    isActive
                                      ? "bg-indigo-600 dark:bg-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.7)] ring-2 ring-indigo-400/50 dark:ring-indigo-500/50 scale-y-110 z-10"
                                      : isAnswered
                                      ? "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500/95 dark:hover:bg-emerald-500"
                                      : "bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800"
                                  }`}
                                  title={`Navigate to Question ${idx + 1}`}
                                >
                                  {/* Tooltip on hover */}
                                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-950 dark:bg-slate-900 text-[10px] font-black text-slate-100 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 scale-95 group-hover:scale-100 whitespace-nowrap shadow-xl border border-slate-800/80 dark:border-slate-850 z-25 flex flex-col items-center gap-0.5">
                                    <span className="text-white">Question {idx + 1}</span>
                                    <span className={isAnswered ? "text-emerald-400" : "text-rose-400"}>
                                      {isAnswered ? "✓ Answered" : "✗ Unanswered"}
                                    </span>
                                    {isActive && <span className="text-indigo-400 text-[8px] uppercase font-black">Currently Active</span>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Color Map / Legend */}
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-0.5">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Answered</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" /> Active Question</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full" /> Remaining</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Question content */}
                  <div className="space-y-6">
                    <div 
                      className="text-base font-extrabold text-slate-900 dark:text-slate-50 leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{ __html: activeExam.questions[activeQIdx].questionText }}
                    />

                    {/* Multiple choice fields */}
                    {activeExam.questions[activeQIdx].type === "mcq" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        {activeExam.questions[activeQIdx].options?.map((opt, optIdx) => {
                          const isSelected = studentAnswers[activeExam.questions[activeQIdx].id] === opt;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectOption(activeExam.questions[activeQIdx].id, opt)}
                              className={`p-4 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between gap-3 transition-all ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                                  : "border-slate-200 dark:border-slate-800 bg-slate-50/50 hover:bg-slate-50 text-slate-700 hover:border-slate-300 dark:text-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center border ${
                                  isSelected 
                                    ? "bg-emerald-500 border-emerald-500 text-white" 
                                    : "bg-white dark:bg-slate-900 border-slate-200 text-slate-500"
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Essay answers textareas */}
                    {activeExam.questions[activeQIdx].type === "short" && (
                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Write your response essay</label>
                        <textarea
                          rows={6}
                          value={studentAnswers[activeExam.questions[activeQIdx].id] || ""}
                          onChange={(e) => handleShortTextChange(activeExam.questions[activeQIdx].id, e.target.value)}
                          placeholder="Write your structural answers, analytical points, and conceptual details here..."
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all font-medium leading-relaxed"
                        />
                      </div>
                    )}

                    {/* Interactive Code Editor */}
                    {activeExam.questions[activeQIdx].type === "code" && (() => {
                      const q = activeExam.questions[activeQIdx];
                      const codeVal = studentAnswers[q.id] !== undefined ? studentAnswers[q.id] : (q.codeTemplate || "");
                      const outputText = compileOutput[q.id] || "Compiler idle. Click 'Run Integrity Tests' below.";
                      const language = q.codeLanguage || "javascript";
                      
                      const triggerCompile = () => {
                        setIsCompiling(true);
                        setTimeout(() => {
                          setIsCompiling(false);
                          if (codeVal.includes("return") || codeVal.includes("def ") || codeVal.includes("cout") || codeVal.includes("System.out")) {
                            setCompileOutput(prev => ({
                              ...prev,
                              [q.id]: `[STDOUT] Parsing challenge specifications...\n[STDOUT] Language sandbox: ${language.toUpperCase()}\n[STDOUT] Injecting custom proctor test hooks...\n[STDOUT] Running unit tests...\n[STDOUT] TEST 1: Passed\n[STDOUT] TEST 2: Passed\n[STDOUT] TEST 3: Passed\n\n[SUCCESS] All test suites completed cleanly (3/3). Code contains correct syntactic signatures.`
                            }));
                          } else {
                            setCompileOutput(prev => ({
                              ...prev,
                              [q.id]: `[STDOUT] Parsing challenge specifications...\n[STDOUT] Language sandbox: ${language.toUpperCase()}\n[STDOUT] Injecting custom proctor test hooks...\n[STDOUT] Running unit tests...\n[STDERR] SyntaxError: Unexpected end of implementation. Make sure you return an active value.\n\n[FAIL] Test cases failed (0/3). Please refine your solution logic.`
                            }));
                          }
                        }, 1200);
                      };

                      return (
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center justify-between bg-slate-900 text-slate-100 px-4 py-2 rounded-t-2xl border-b border-slate-800">
                            <div className="flex items-center gap-2">
                              <Terminal className="w-4 h-4 text-emerald-400" />
                              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-300">
                                Sandboxed IDE ({language})
                              </span>
                            </div>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          </div>
                          
                          <div className="relative font-mono text-xs">
                            <textarea
                              rows={10}
                              value={codeVal}
                              onChange={(e) => handleShortTextChange(q.id, e.target.value)}
                              placeholder={`// Enter your structured ${language} code here...`}
                              className="w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs rounded-b-2xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                              style={{ tabSize: 2 }}
                            />
                          </div>

                          <div className="flex justify-between items-center gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Reset code back to original starter boilerplate?")) {
                                  handleShortTextChange(q.id, q.codeTemplate || "");
                                }
                              }}
                              className="text-xs text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1"
                            >
                              Reset Boilerplate
                            </button>
                            <button
                              type="button"
                              disabled={isCompiling}
                              onClick={triggerCompile}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
                            >
                              {isCompiling ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Simulating Sandbox...</span>
                                </>
                              ) : (
                                <>
                                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Run Integrity Tests</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IDE Output Console</label>
                            <div className="p-3 bg-slate-900 text-slate-300 rounded-xl border border-slate-800 font-mono text-[10px] whitespace-pre-wrap leading-relaxed h-28 overflow-y-auto">
                              {outputText}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* File Upload Area */}
                    {activeExam.questions[activeQIdx].type === "file" && (() => {
                      const q = activeExam.questions[activeQIdx];
                      const maxMB = q.maxFileSizeMB || 10;
                      const fileState = uploadedFiles[q.id];
                      const storedAns = studentAnswers[q.id];
                      
                      const simulateFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const sizeMB = file.size / (1024 * 1024);
                        if (sizeMB > maxMB) {
                          setUploadedFiles(prev => ({
                            ...prev,
                            [q.id]: { name: file.name, size: file.size, status: 'error', error: `File size exceeds the configured maximum limit of ${maxMB}MB.` }
                          }));
                          return;
                        }

                        setUploadedFiles(prev => ({
                          ...prev,
                          [q.id]: { name: file.name, size: file.size, status: 'uploading' }
                        }));

                        setTimeout(() => {
                          setUploadedFiles(prev => ({
                            ...prev,
                            [q.id]: { name: file.name, size: file.size, status: 'completed' }
                          }));
                          const metadataStr = `[FILE_UPLOAD] Name: ${file.name} | Size: ${(file.size / 1024).toFixed(1)} KB | SHA256: HashVerified`;
                          handleShortTextChange(q.id, metadataStr);
                        }, 1500);
                      };

                      return (
                        <div className="space-y-4 pt-2">
                          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-all relative">
                            <input
                              type="file"
                              onChange={simulateFileDrop}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              title="Drag or click to choose file"
                            />
                            <div className="space-y-2 pointer-events-none">
                              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto animate-bounce" />
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Click to upload or drag files here
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium leading-normal max-w-xs mx-auto">
                                Files are checked, encrypted, and compiled immediately. Limit file size to <strong className="text-slate-600 dark:text-slate-300">{maxMB}MB</strong>.
                              </p>
                            </div>
                          </div>

                          {fileState && (
                            <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                              fileState.status === 'completed' 
                                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                                : fileState.status === 'error'
                                ? "bg-rose-500/5 border-rose-500/20 text-rose-800 dark:text-rose-400"
                                : "bg-slate-50 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            }`}>
                              <Paperclip className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="text-xs font-bold truncate">{fileState.name}</div>
                                <div className="text-[10px] text-slate-400 font-medium font-mono">
                                  Size: {(fileState.size / (1024 * 1024)).toFixed(2)} MB
                                </div>
                                {fileState.status === 'uploading' && (
                                  <div className="space-y-1 pt-1.5">
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-500 animate-pulse" style={{ width: '60%' }} />
                                    </div>
                                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Encrypting & Uploading to Secure Enclave...</span>
                                  </div>
                                )}
                                {fileState.status === 'completed' && (
                                  <span className="text-[9px] text-emerald-500 block font-extrabold uppercase tracking-wider flex items-center gap-1 mt-1">
                                    <CheckCircle className="w-3 h-3 text-emerald-500 inline mr-1" /> Securely Transferred & Signed
                                  </span>
                                )}
                                {fileState.status === 'error' && (
                                  <span className="text-[9px] text-rose-500 block font-extrabold uppercase tracking-wider mt-1">
                                    Error: {fileState.error}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {storedAns && storedAns.startsWith("[FILE_UPLOAD]") && !fileState && (
                            <div className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-400 flex items-center gap-3">
                              <Paperclip className="w-5 h-5 text-emerald-500 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold truncate">Secure Upload Token Loaded</div>
                                <div className="text-[9px] text-slate-400 font-mono font-bold">{storedAns}</div>
                              </div>
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Audio/Video Recording Area */}
                    {activeExam.questions[activeQIdx].type === "audio-video" && (() => {
                      const q = activeExam.questions[activeQIdx];
                      const maxDuration = q.recordingDurationSeconds || 60;
                      const recordState = recordingStates[q.id] || { isRecording: false, timeLeft: maxDuration, audioUrl: null };
                      const storedAns = studentAnswers[q.id];
                      
                      const startRecording = () => {
                        setRecordingStates(prev => ({
                          ...prev,
                          [q.id]: { isRecording: true, timeLeft: maxDuration, audioUrl: null }
                        }));
                        
                        let currentRemaining = maxDuration;
                        const interval = setInterval(() => {
                          currentRemaining -= 1;
                          if (currentRemaining <= 0) {
                            clearInterval(interval);
                            stopRecording();
                          } else {
                            setRecordingStates(prev => ({
                              ...prev,
                              [q.id]: { ...prev[q.id], timeLeft: currentRemaining }
                            }));
                          }
                        }, 1000);
                        recordingTimerRef.current[q.id] = interval;
                      };

                      const stopRecording = () => {
                        const interval = recordingTimerRef.current[q.id];
                        if (interval) clearInterval(interval);
                        
                        setRecordingStates(prev => ({
                          ...prev,
                          [q.id]: { isRecording: false, timeLeft: 0, audioUrl: "[SIMULATED_RECORDING_URL]" }
                        }));

                        const metadataStr = `[AUDIO_RECORDING] Duration: ${maxDuration}s | TrackVerified: True | Timestamp: ${new Date().toISOString()}`;
                        handleShortTextChange(q.id, metadataStr);
                      };

                      return (
                        <div className="space-y-4 pt-2">
                          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-4 relative overflow-hidden">
                            {recordState.isRecording && (
                              <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
                            )}
                            
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Encrypted Mic Gateway</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${recordState.isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`} />
                                <span className="text-[10px] font-mono text-slate-300 font-bold uppercase">{recordState.isRecording ? 'Broadcasting' : 'Muted'}</span>
                              </div>
                            </div>

                            <div className="h-16 flex items-center justify-center gap-1">
                              {recordState.isRecording ? (
                                Array.from({ length: 18 }).map((_, i) => (
                                  <span 
                                    key={i} 
                                    className="w-1 bg-red-500 rounded-full transition-all duration-300"
                                    style={{ 
                                      height: `${Math.floor(Math.random() * 32) + 10}px`
                                    }} 
                                  />
                                ))
                              ) : (
                                <div className="text-xs text-slate-500 font-bold font-sans">Click 'Begin Interactive Recording' to activate audio streams</div>
                              )}
                            </div>

                            <div className="flex justify-center items-center gap-4">
                              {!recordState.isRecording ? (
                                <button
                                  type="button"
                                  onClick={startRecording}
                                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-500/10 active:scale-95 transition-all"
                                >
                                  <Mic className="w-3.5 h-3.5" />
                                  <span>Begin Interactive Recording</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={stopRecording}
                                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold rounded-xl active:scale-95 transition-all"
                                >
                                  <Square className="w-3.5 h-3.5 text-red-500 inline mr-1" />
                                  <span>Finalize & Stop ({recordState.timeLeft}s)</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {(recordState.audioUrl || (storedAns && storedAns.startsWith("[AUDIO_RECORDING]"))) && (
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <Volume2 className="w-5 h-5 text-emerald-500" />
                                <div>
                                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Verbal Assessment Recording Locked</div>
                                  <p className="text-[10px] text-slate-400 font-mono font-medium truncate max-w-sm">
                                    {storedAns || "Simulated audio voice payload compiled and verified."}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2.5 py-0.5 rounded">Ready</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  </div>
                </div>
              )}
            </div>

            {/* Right Hand: Persistent Real-Time Proctor Security Dashboard */}
            <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-900 pt-6 lg:pt-0 lg:pl-6 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                {/* Visual Interactive Exam Progress Tracker Grid */}
                <div className="space-y-2 border-b border-slate-100 dark:border-slate-900 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Progress Tracker</p>
                    <span className="text-[10px] font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {Object.keys(studentAnswers).filter(k => activeExam.questions.some(q => q.id === k && studentAnswers[k]?.trim() !== "")).length} / {activeExam.questions.length} Completed
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {activeExam.questions.map((q, idx) => {
                      const isCurrent = idx === activeQIdx;
                      const isAnswered = studentAnswers[q.id] && studentAnswers[q.id].trim() !== "";
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setActiveQIdx(idx)}
                          className={`h-8 rounded-xl text-xs font-black flex items-center justify-center transition-all ${
                            isCurrent
                              ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950 ring-2 ring-emerald-500 shadow-lg transform scale-105"
                              : isAnswered
                              ? "bg-emerald-500 text-white hover:bg-emerald-600 font-bold"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800"
                          }`}
                          title={`Navigate to Question ${idx + 1}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <ShieldAlert className={`w-5 h-5 ${warningCount > 0 ? "text-rose-500 animate-pulse" : "text-emerald-500"}`} />
                      <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${warningCount > 0 ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                      Security Dashboard
                    </span>
                  </div>
                </div>

                {/* Secure Status Badge */}
                <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                  warningCount > 0 
                    ? "bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-400"
                    : "bg-emerald-500/5 border-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${warningCount > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {warningCount > 0 ? "Flagged Telemetry" : "Security Encrypted"}
                    </span>
                  </div>
                  <span className="text-xs font-black font-mono">
                    {warningCount} Infraction{warningCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Acoustic Proctoring Monitor */}
                {activeExam.proctorRules?.enableNoiseDetection && (
                  <div className="p-3 bg-indigo-500/5 dark:bg-indigo-950/15 border border-indigo-500/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                        {isNoiseProctorActive ? (
                          <Mic className="w-4 h-4 animate-pulse text-indigo-500" />
                        ) : (
                          <MicOff className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          Acoustic Proctor
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        isNoiseProctorActive 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        {isNoiseProctorActive ? "Live Mic Monitoring" : "Mic Connecting"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>Background Chatter Level</span>
                        <span className={currentNoiseLevel > (activeExam.proctorRules.noiseThreshold ?? 50) ? "text-rose-600 dark:text-rose-400 font-extrabold animate-pulse" : "text-indigo-600 dark:text-indigo-400"}>
                          {currentNoiseLevel}% / {activeExam.proctorRules.noiseThreshold ?? 50}%
                        </span>
                      </div>
                      <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200/50 dark:border-slate-800/40">
                        {/* Threshold Marker Indicator */}
                        <div 
                          className="absolute h-full w-0.5 bg-rose-500 z-10 opacity-70"
                          style={{ left: `${activeExam.proctorRules.noiseThreshold ?? 50}%` }}
                          title="Infraction Threshold"
                        />
                        {/* Audio Fill level */}
                        <div 
                          className={`h-full transition-all duration-75 ${
                            currentNoiseLevel > (activeExam.proctorRules.noiseThreshold ?? 50)
                              ? "bg-rose-500 animate-pulse"
                              : "bg-indigo-500"
                          }`}
                          style={{ width: `${currentNoiseLevel}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-tight">
                      Please keep your environment completely quiet. High noise levels or chatter will trigger automated security alerts.
                    </p>
                  </div>
                )}

                {/* Security instructions and compliance disclaimer */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900 rounded-xl space-y-1.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Proctor Rule Check</p>
                  <ul className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1 font-medium list-disc pl-4">
                    <li>Do not leave the browser tab or switch active apps</li>
                    <li>Ensure the window remains focused and active</li>
                    <li>Each focus-loss event is signed and reported</li>
                  </ul>
                </div>

                {/* Real-time incident scroll feed */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Incident Feed</p>
                    <span className="text-[9px] font-bold text-slate-300 font-mono">Live Sync</span>
                  </div>

                  <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
                    {proctorLogs.length === 0 ? (
                      <div className="py-8 text-center border border-dashed border-slate-100 dark:border-slate-900 rounded-xl bg-slate-50/20">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1.5 opacity-60" />
                        <p className="text-[10px] text-slate-400 font-semibold">No integrity events logged</p>
                        <p className="text-[9px] text-slate-500">Perfect compliance score</p>
                      </div>
                    ) : (
                      proctorLogs.map((log) => (
                        <div 
                          key={log.id} 
                          className={`p-2.5 rounded-xl border text-[11px] leading-snug space-y-1 transition-all ${
                            log.eventType === 'tab-switch' || log.eventType === 'blur'
                              ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-950/40"
                              : "bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-900"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-black uppercase tracking-wider text-[9px] ${
                              log.eventType === 'focus' 
                                ? 'text-emerald-600 font-mono' 
                                : 'text-rose-600 font-mono'
                            }`}>
                              {log.eventType === 'tab-switch' && 'Tab Switch'}
                              {log.eventType === 'blur' && 'Focus Loss'}
                              {log.eventType === 'focus' && 'Focus Restored'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium leading-relaxed">
                            {log.details}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls bottom bar */}
          <div className="border-t border-slate-100 dark:border-slate-900 pt-5 flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={activeQIdx === 0}
              onClick={() => setActiveQIdx(prev => prev - 1)}
              className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {activeQIdx < activeExam.questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveQIdx(prev => prev + 1)}
                className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you finished? Once submitted, your exam responses will be sent directly to your instructor and you cannot alter them.")) {
                    handleSubmitExamAnswers();
                  }
                }}
                className="flex items-center gap-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/15 active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Submit Exam Paper</span>
              </button>
            )}
          </div>

        </motion.div>
      )}
      </AnimatePresence>

      {/* Real-time Persistent Proctoring Toasts Stack */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {proctorToasts
          .filter(t => !t.isDismissed)
          .map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto bg-slate-950/95 border border-rose-500/30 text-rose-100 p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-start gap-3 animate-fade-in transition-all duration-300"
            >
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                    Security Violation Logged
                  </span>
                  <span className="text-[10px] font-mono text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded">
                    {toast.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-slate-100 font-bold leading-relaxed">
                  {toast.eventType === 'tab-switch' ? 'Tab / Window Switch' : 'Focus Lost (Clicked Away)'}
                </p>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  {toast.details}
                </p>
                <div className="pt-2 flex items-center justify-between gap-2">
                  <span className="text-[9px] bg-rose-950/40 text-rose-300 font-mono px-2 py-0.5 rounded border border-rose-500/20 font-bold">
                    Logged & Streamed
                  </span>
                  <button
                    onClick={() => {
                      setProctorToasts(prev =>
                        prev.map(t => (t.id === toast.id ? { ...t, isDismissed: true } : t))
                      );
                    }}
                    className="text-[10px] text-slate-400 hover:text-white underline font-bold cursor-pointer transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setProctorToasts(prev =>
                    prev.map(t => (t.id === toast.id ? { ...t, isDismissed: true } : t))
                  );
                }}
                className="text-rose-400 hover:text-rose-200 shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
      </div>

      {/* ==================== REAL-TIME PROCTORING INTERVENTION WARNER ==================== */}
      <AnimatePresence>
        {unacknowledgedWarning && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-white dark:bg-slate-950 border-2 border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-lg space-y-6 relative overflow-hidden"
            >
              {/* Animated pulsating halo backdrop */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -z-10 animate-pulse" />

              {/* Visual header warning badge */}
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/20 mb-1">
                  <ShieldAlert className="w-8 h-8 animate-bounce" />
                </div>
                <span className="text-[10px] font-black tracking-widest text-rose-500 uppercase block">Proctor Control Center</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  SECURITY INTERVENTION WARNING
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  The exam invigilator has sent an active live directive concerning your exam session integrity.
                </p>
              </div>

              {/* Warning Content */}
              <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-500/10 space-y-2.5">
                <div className="flex items-center justify-between text-[10px] text-rose-500 font-extrabold uppercase tracking-wider">
                  <span>Directive Message</span>
                  <span>{new Date(unacknowledgedWarning.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
                <p className="text-sm font-semibold text-rose-900 dark:text-rose-300 leading-relaxed italic">
                  &quot;{unacknowledgedWarning.message}&quot;
                </p>
              </div>

              {/* Security reminders */}
              <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <p className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Mandatory Compliance Reminders:</p>
                <ul className="list-disc list-inside space-y-1 font-medium">
                  <li>Keep your face centered in the camera preview frame.</li>
                  <li>Do not switch focus away from this active exam browser tab.</li>
                  <li>Keyboard shortcuts, clipboard actions, and multi-screens are actively tracked.</li>
                </ul>
              </div>

              {/* Action acknowledgement button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!!acknowledgingWarningId}
                  onClick={() => handleAcknowledgeWarning(unacknowledgedWarning.id)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black tracking-wider uppercase rounded-2xl shadow-lg shadow-rose-500/15 active:scale-98 transition-all"
                >
                  {acknowledgingWarningId ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin animate-reverse" />
                      <span>Transmitting Acknowledgement...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4.5 h-4.5 stroke-[3px]" />
                      <span>I Acknowledge & Will Comply</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== SESSION EXPIRY WARNING MODAL ==================== */}
      <AnimatePresence>
        {showSessionExpiryModal && sessionTimeLeft !== null && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-950 border-2 border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md space-y-6 relative overflow-hidden"
            >
              {/* Pulsing indigo backdrop glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse" />

              {/* Modal Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 mb-1">
                  <Clock className="w-8 h-8 animate-spin" style={{ animationDuration: "12s" }} />
                </div>
                <span className="text-[10px] font-black tracking-widest text-indigo-500 uppercase block">Assessment Guard Session lifeline</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  SESSION EXPIRATION WARNING
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Your secure authentication token is about to expire. Extend your session now to prevent disruption.
                </p>
              </div>

              {/* Expiring timer countdown indicator */}
              <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-500/10 flex flex-col items-center justify-center space-y-2">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Time Remaining Until Logged Out</span>
                <span className="text-4xl font-black font-mono text-indigo-600 dark:text-indigo-400 tracking-wider">
                  {formatTimeRemaining(sessionTimeLeft)}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold italic">
                  Exam active timer ({formatTimeRemaining(timeLeft || 0)} left) is separate.
                </span>
              </div>

              {/* Warning compliance text */}
              <p className="text-[11px] text-slate-400 leading-relaxed text-center">
                Refreshes silently in the background. Your responses, media captures, and exam progress are <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">100% preserved</strong>. No page reloads or interruption.
              </p>

              {/* Action buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  disabled={refreshingSession}
                  onClick={() => handleSilentTokenRefresh(false)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black tracking-wider uppercase rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-98 transition-all cursor-pointer"
                >
                  {refreshingSession ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                      <span>Extending Credentials...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="w-4.5 h-4.5 stroke-[3px]" />
                      <span>Silently Refresh Session Token</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowSessionExpiryModal(false)}
                  className="w-full py-2.5 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
                >
                  Snooze Warning
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BIOMETRIC ID SECURITY GATEWAY MODAL */}
      {biometricModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md space-y-6 relative overflow-hidden animate-scale-up">
            
            {/* Header branding */}
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 mb-2">
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Secure Identity Verification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Course exam integrity protocol requires confirming candidate identification via biometrics.
              </p>
            </div>

            {/* Verification Method Tabs */}
            {biometricStatus !== 'success' && (
              <div className="flex border border-slate-100 dark:border-slate-800 p-1 rounded-xl bg-slate-50 dark:bg-slate-950/60">
                <button
                  type="button"
                  onClick={() => {
                    handleStartBiometricScan('face');
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                    biometricMethod === 'face'
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-800"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>FaceID Facial Scan</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Switch to fingerprint scanner
                    if (videoRef.current && videoRef.current.srcObject) {
                      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                      tracks.forEach(t => t.stop());
                    }
                    setBiometricMethod('fingerprint');
                    setBiometricStatus('idle');
                    setBiometricProgress(0);
                    setBiometricFeedback('Click and hold the biometric sensor to verify fingerprint identity.');
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                    biometricMethod === 'fingerprint'
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-800"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>TouchID Fingerprint</span>
                </button>
              </div>
            )}

            {/* Verification Content Body */}
            <div className="space-y-4">
              {biometricMethod === 'face' ? (
                /* FACE ID VIEW */
                <div className="space-y-4">
                  {biometricStatus === 'idle' && (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-950/20">
                      <Camera className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Camera Check Required</p>
                        <p className="text-[10px] text-slate-400 max-w-xs leading-normal">Ensure your head is centered in the frame with good lighting.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartBiometricScan('face')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                      >
                        <Scan className="w-3.5 h-3.5" />
                        <span>Initialize Facial Scan</span>
                      </button>
                    </div>
                  )}

                  {biometricStatus === 'scanning' && (
                    <div className="space-y-4">
                      {/* Video feedback wrapper */}
                      <div className="relative w-full h-48 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                        
                        {/* Biometric Guide Overlays */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {/* Face placement dashed ellipse */}
                          <div className="w-36 h-48 border-2 border-dashed border-indigo-400/60 rounded-[50%] animate-pulse" />
                        </div>

                        {/* Scrolling Green Laser Line */}
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_8px_rgba(129,140,248,0.8)] animate-bounce" />
                      </div>

                      {/* Progress Bar and text feedback */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                          <span>Scanning facial structures...</span>
                          <span className="font-mono text-indigo-500">{biometricProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 transition-all duration-150"
                            style={{ width: `${biometricProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {biometricStatus === 'success' && (
                    <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-3 animate-scale-up">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center animate-bounce">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">Identity Authenticated</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Candidate credentials matching successful. Launching exam engine...</p>
                      </div>
                    </div>
                  )}

                  {biometricStatus === 'error' && (
                    <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Camera Integration Failed</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Ensure browser camera permission is allowed or select TouchID fallback.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartBiometricScan('face')}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-all"
                      >
                        Try Camera Again
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* TOUCH ID VIEW */
                <div className="space-y-4">
                  {biometricStatus !== 'success' ? (
                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-5 bg-slate-50/40 dark:bg-slate-950/10">
                      
                      {/* Live Scanning concentric ripple animation */}
                      <div className="relative flex items-center justify-center">
                        {biometricStatus === 'scanning' && (
                          <>
                            <span className="absolute inline-flex h-20 w-20 rounded-full bg-indigo-500/10 animate-ping" />
                            <span className="absolute inline-flex h-24 w-24 rounded-full bg-indigo-500/5 animate-pulse" />
                          </>
                        )}
                        
                        <button
                          type="button"
                          onMouseDown={startFingerprintHold}
                          onMouseUp={stopFingerprintHold}
                          onMouseLeave={stopFingerprintHold}
                          onTouchStart={startFingerprintHold}
                          onTouchEnd={stopFingerprintHold}
                          className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center border transition-all cursor-pointer active:scale-90 ${
                            biometricStatus === 'scanning'
                              ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30"
                              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-50"
                          }`}
                        >
                          <Fingerprint className="w-8 h-8" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          {biometricStatus === 'scanning' ? 'Scanning Biometrics...' : 'Touch ID Sensor Ready'}
                        </p>
                        <p className="text-[10px] text-slate-400 max-w-xs leading-normal">
                          {biometricStatus === 'scanning' 
                            ? 'Hold your finger down firmly on the button to trace fingerprint minutiae.' 
                            : 'Hold the button down for 2 seconds to authenticate.'}
                        </p>
                      </div>

                      {/* Progress meter */}
                      <div className="w-full space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 font-mono">
                          <span>Sensor Accuracy</span>
                          <span>{biometricProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 transition-all duration-75"
                            style={{ width: `${biometricProgress}%` }}
                          />
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-3 animate-scale-up">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center animate-bounce">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">TouchID Authenticated</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Unique fingerprint signatures matched. Initiating exam session...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status and Feedback text */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium text-center leading-normal">
                  💡 Status: {biometricFeedback}
                </p>
              </div>
            </div>

            {/* Cancel & Bypass Footer */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeBiometricModal}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                Cancel & Exit
              </button>
              <button
                type="button"
                onClick={() => {
                  if (biometricExamId) {
                    setVerifiedExams(prev => ({ ...prev, [biometricExamId]: true }));
                    setBiometricModalOpen(false);
                    handleStartExam(biometricExamId);
                  }
                }}
                className="flex-1 py-2.5 text-xs font-black rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/10 active:scale-95 transition-all"
              >
                Bypass ID Check
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QUICK REVIEW MODAL */}
      {quickReview && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-lg space-y-6 relative overflow-hidden animate-scale-up">
            
            {/* Success Visual Accent */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 mb-2">
                <CheckCircle className="w-10 h-10 stroke-[2]" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Exam Completed Successfully!
              </h3>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {quickReview.examTitle}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed">
                Your submission has been securely registered and timestamped. Here is your quick review summary:
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Metric 1: Answered Questions */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-col items-center justify-center text-center">
                <BookOpen className="w-5 h-5 text-indigo-500 mb-1" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Questions Answered</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">
                  {quickReview.answeredQuestions} <span className="text-xs font-normal text-slate-400">/ {quickReview.totalQuestions}</span>
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                  {quickReview.totalQuestions > 0 ? Math.round((quickReview.answeredQuestions / quickReview.totalQuestions) * 100) : 0}% completion
                </span>
              </div>

              {/* Metric 2: Time Taken */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-col items-center justify-center text-center">
                <Clock className="w-5 h-5 text-emerald-500 mb-1" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Taken</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">
                  {Math.floor(quickReview.timeTakenSeconds / 60)}m {quickReview.timeTakenSeconds % 60}s
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                  Active session duration
                </span>
              </div>
            </div>

            {/* Total Points or general info banner */}
            <div className="p-4 border border-indigo-500/10 bg-indigo-500/5 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Points Possible</span>
              </div>
              <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                {quickReview.totalPoints} pts
              </span>
            </div>

            {/* Helper notice */}
            <div className="text-center p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                💡 Multiple-choice questions (MCQs) have been auto-graded, while short answers & files await review by your instructor.
              </p>
            </div>

            {/* Back to Dashboard buttons */}
            <div className="flex pt-2">
              <button
                type="button"
                onClick={() => setQuickReview(null)}
                className="w-full py-3 text-sm font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
              >
                Close & Return to Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. DETAILED GRADING REVIEW CANVAS OVERLAY */}
      {reviewSubDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto">
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden select-none animate-slide-up">
            
            {/* Modal Header */}
            <div className="p-6 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 font-mono block">Performance Assessment Review</span>
                <h3 className="text-md sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
                  {reviewSubDetail.exam.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Submitted by {reviewSubDetail.submission.studentName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReviewSubId(null);
                  setReviewSubDetail(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Scroll Container */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Score summary banner */}
              <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                reviewSubDetail.submission.resultStatus === "passed"
                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-rose-500/5 border-rose-500/10 text-rose-700 dark:text-rose-400"
              }`}>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider block">Decision Outcome Status</span>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    <span className="text-md font-black uppercase tracking-widest">
                      {reviewSubDetail.submission.resultStatus === "passed" ? "Passed Approved" : "Failed / Resubmission Required"}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Scored Performance</span>
                  <span className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100 leading-none block">
                    {reviewSubDetail.submission.score} / {reviewSubDetail.submission.maxScore}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 font-mono">
                    ({Math.round((reviewSubDetail.submission.score / reviewSubDetail.submission.maxScore) * 100)}% Grade)
                  </span>
                </div>
              </div>

              {/* Feedback comment */}
              {reviewSubDetail.submission.feedback && (
                <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">Instructor Feedback Comments</span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 italic leading-relaxed">
                    &quot;{reviewSubDetail.submission.feedback}&quot;
                  </p>
                </div>
              )}

              {/* Question list review */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Exam Questions & Answers Breakdown</h4>
                <div className="space-y-4">
                  {reviewSubDetail.exam.questions.map((q, idx) => {
                    const studentAnswer = reviewSubDetail.submission.answers[q.id] || "";
                    const questionPointsAwarded = reviewSubDetail.submission.questionScores?.[q.id] ?? 0;
                    
                    if (q.type === "mcq") {
                      const isCorrect = studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                      return (
                        <div key={q.id} className="p-5 border border-slate-100 dark:border-slate-900 rounded-2xl bg-white dark:bg-slate-950 space-y-3">
                          <div className="flex items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-900 pb-2">
                            <span className="text-xs font-bold text-slate-400">MCQ Question #{idx + 1}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}>
                              {isCorrect ? `Correct (+${q.points} pts)` : "Incorrect (0 pts)"}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: q.questionText }} />

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
                                  {isStudentSel && <span className="text-[9px] font-bold ml-1.5 uppercase">(Your Selection)</span>}
                                  {isCorrectOpt && <span className="text-[9px] font-bold ml-1.5 uppercase">(Correct Solution)</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    } else {
                      // Written types
                      const typeLabels: { [key: string]: string } = {
                        short: "Short Essay Response",
                        code: "Structured Code Challenge",
                        file: "Secure File Upload",
                        "audio-video": "Verbal Assessment Recording"
                      };
                      return (
                        <div key={q.id} className="p-5 border border-slate-100 dark:border-slate-900 rounded-2xl bg-white dark:bg-slate-950 space-y-4">
                          <div className="flex items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-900/60 pb-2">
                            <span className="text-xs font-bold text-slate-400">{typeLabels[q.type] || "Written Response"} #{idx + 1}</span>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              Score: {questionPointsAwarded} / {q.points} pts
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: q.questionText }} />

                          {/* Student Answer */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Your Submission</label>
                            {q.type === "code" ? (
                              <div className="p-4 bg-slate-950 text-emerald-400 rounded-xl font-mono text-xs border border-slate-800 leading-relaxed whitespace-pre overflow-x-auto select-text">
                                {studentAnswer || "// No code response submitted"}
                              </div>
                            ) : q.type === "file" ? (
                              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-950/60 flex items-center gap-2">
                                <Paperclip className="w-4 h-4 text-indigo-500" />
                                <span>{studentAnswer || "No file uploaded"}</span>
                              </div>
                            ) : q.type === "audio-video" ? (
                              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-950/60 flex items-center gap-2">
                                <Mic className="w-4 h-4 text-rose-500" />
                                <span>{studentAnswer || "No verbal audio recording submitted"}</span>
                              </div>
                            ) : (
                              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800/60 leading-relaxed select-text whitespace-pre-wrap">
                                {studentAnswer || <em>No response entered</em>}
                              </div>
                            )}
                          </div>

                          {/* Solution / Rubric */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-indigo-500/70 uppercase tracking-wider block font-sans">Reference Solution / Criteria</label>
                            <div className="p-3.5 bg-indigo-500/5 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-400 leading-relaxed select-text whitespace-pre-wrap">
                              {q.correctAnswer}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setReviewSubId(null);
                  setReviewSubDetail(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all"
              >
                Close Review
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
