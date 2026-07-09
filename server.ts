import express from "express";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { 
  User, 
  UserRole, 
  Exam, 
  Question, 
  Submission, 
  ProctorLog, 
  ProctorWarning,
  DashboardStats, 
  TeacherAnalytics 
} from "./src/types.js";

const PORT = 3000;
const JWT_SECRET = process.env.GEMINI_API_KEY || "SUPER_SECRET_JWT_KEY_RemoteExamPortal_2026";
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Ensure data directory and DB file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseSchema {
  users: Array<User & { passwordHash: string }>;
  exams: Exam[];
  submissions: Submission[];
  proctorLogs: ProctorLog[];
  warnings?: ProctorWarning[];
}

// Read database from JSON file
function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return seedDatabase();
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    parsed.warnings = parsed.warnings || [];
    return parsed;
  } catch (error) {
    console.error("Failed to read database, returning default seed:", error);
    return seedDatabase();
  }
}

// Write database to JSON file
function writeDb(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to database file:", error);
  }
}

// Seed Database with initial dummy data
function seedDatabase(): DatabaseSchema {
  console.log("Seeding initial database contents with evaluator seed accounts and exams...");
  
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync("password123", salt);

  const seededUsers = [
    {
      id: "u-admin-1",
      name: "Arthur Pendragon",
      email: "admin@exam.com",
      role: "admin" as UserRole,
      createdAt: new Date("2026-01-10T12:00:00Z").toISOString(),
      passwordHash,
    },
    {
      id: "u-teacher-1",
      name: "Professor Charles Xavier",
      email: "teacher@exam.com",
      role: "teacher" as UserRole,
      createdAt: new Date("2026-02-15T09:30:00Z").toISOString(),
      passwordHash,
    },
    {
      id: "u-student-1",
      name: "Peter Parker",
      email: "student@exam.com",
      role: "student" as UserRole,
      createdAt: new Date("2026-03-01T10:00:00Z").toISOString(),
      passwordHash,
    },
    {
      id: "u-student-2",
      name: "Gwen Stacy",
      email: "gwen@exam.com",
      role: "student" as UserRole,
      createdAt: new Date("2026-03-02T11:00:00Z").toISOString(),
      passwordHash,
    },
    {
      id: "u-student-3",
      name: "Miles Morales",
      email: "miles@exam.com",
      role: "student" as UserRole,
      createdAt: new Date("2026-03-05T14:15:00Z").toISOString(),
      passwordHash,
    },
    {
      id: "u-student-4",
      name: "Bruce Wayne",
      email: "bruce@exam.com",
      role: "student" as UserRole,
      createdAt: new Date("2026-03-06T15:20:00Z").toISOString(),
      passwordHash,
    }
  ];

  const seededExams: Exam[] = [
    {
      id: "exam-1",
      title: "React & TypeScript Frontend Architecture (MCQ)",
      description: "Assessments on custom state sync, virtual DOM concepts, React 19 hooks, and TypeScript module resolution configurations.",
      durationMinutes: 15,
      creatorId: "u-teacher-1",
      creatorName: "Professor Charles Xavier",
      createdAt: new Date("2026-06-15T10:00:00Z").toISOString(),
      questions: [
        {
          id: "q1",
          questionText: "<p>Which of the following is true regarding <strong>React 19 Server Actions</strong>?</p>",
          type: "mcq",
          options: [
            "They can only run on client-side environments.",
            "They are functions designed to handle form submissions and data mutations directly on the server.",
            "They completely replace Redux Toolkit for local global state management.",
            "They must return HTML structures instead of serializable JSON objects."
          ],
          correctAnswer: "They are functions designed to handle form submissions and data mutations directly on the server.",
          points: 10
        },
        {
          id: "q2",
          questionText: "<p>In <strong>tsconfig.json</strong>, what is the primary benefit of enabling the <code>moduleResolution: \"bundler\"</code> flag?</p>",
          type: "mcq",
          options: [
            "It forces TypeScript to compile files to CommonJS format.",
            "It configures the compiler to resolve imports modeled after modern frontend bundlers (like Vite or Webpack).",
            "It disables all external type-checking to speed up builds.",
            "It automatically bundles node_modules into a single production index file."
          ],
          correctAnswer: "It configures the compiler to resolve imports modeled after modern frontend bundlers (like Vite or Webpack).",
          points: 10
        },
        {
          id: "q3",
          questionText: "<p>What is the exact behavior of <strong>useMemo</strong> dependency checking in React 18+?</p>",
          type: "mcq",
          options: [
            "It performs deep recursive equality checks on all objects inside the dependency array.",
            "It performs strict reference equality checks (Object.is) on the primitive or object values declared in the array.",
            "It forces a component re-render even if the dependency values are completely identical.",
            "It runs the memoized calculation asynchronously in a separate web worker thread."
          ],
          correctAnswer: "It performs strict reference equality checks (Object.is) on the primitive or object values declared in the array.",
          points: 10
        },
        {
          id: "q4",
          questionText: "<p>Which Tailwind v4 directive is the official syntax for importing Tailwind classes in <code>index.css</code>?</p>",
          type: "mcq",
          options: [
            "@tailwind base; @tailwind components; @tailwind utilities;",
            "@import \"tailwindcss\";",
            "@import \"tailwind/v4/all.css\";",
            "import 'tailwindcss' in main.tsx instead of css files."
          ],
          correctAnswer: "@import \"tailwindcss\";",
          points: 10
        }
      ]
    },
    {
      id: "exam-2",
      title: "Advanced System Engineering & Cloud Infrastructure (All Types)",
      description: "Advanced topics covering relational Spanner database schemas, security rule hardening, and JWT authentication middleware setups.",
      durationMinutes: 45,
      creatorId: "u-teacher-1",
      creatorName: "Professor Charles Xavier",
      createdAt: new Date("2026-06-20T14:00:00Z").toISOString(),
      questions: [
        {
          id: "e2-q1",
          questionText: "<p>In the context of REST APIs, why is it critical to handle <strong>sensitive API keys</strong> exclusively server-side (e.g. in Express routes) instead of local browser components?</p>",
          type: "short",
          options: [],
          correctAnswer: "To prevent exposing private credentials, API tokens, and access rights in public client-side bundles accessible via DevTools.",
          points: 15
        },
        {
          id: "e2-q2",
          questionText: "<p>Which of the following describes the difference between symmetric and asymmetric token signing in JWT?</p>",
          type: "mcq",
          options: [
            "Asymmetric signing uses a single shared secret, while symmetric signing uses a public/private keypair.",
            "Symmetric signing uses a single shared secret key, while asymmetric signing uses a public/private keypair (like RS256).",
            "Asymmetric signing is strictly forbidden in modern web frameworks.",
            "Symmetric signing is inherently slower because it requires network verification."
          ],
          correctAnswer: "Symmetric signing uses a single shared secret key, while asymmetric signing uses a public/private keypair (like RS256).",
          points: 10
        },
        {
          id: "e2-q3",
          questionText: "<p>Describe how you would configure a <strong>Rate Limiter</strong> in an Express gateway. Detail the architectural reasons for placing this middleware before JWT validation.</p>",
          type: "short",
          options: [],
          correctAnswer: "Rate limiters must be placed before JWT verification to mitigate DoS/brute-force attacks on CPU-intensive decryption operations. Express-rate-limit or Redis stores are commonly configured.",
          points: 15
        },
        {
          id: "e2-q4",
          questionText: "<p><strong>Programming Challenge:</strong> Write a JavaScript function that takes a positive integer and returns its factorial.</p>",
          type: "code",
          codeLanguage: "javascript",
          codeTemplate: "function factorial(n) {\n  // Write your code here\n  \n}",
          correctAnswer: "function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}",
          points: 20
        },
        {
          id: "e2-q5",
          questionText: "<p><strong>Architecture Submission:</strong> Upload your certified technical architect report or cloud system design diagram (PDF format preferred).</p>",
          type: "file",
          maxFileSizeMB: 10,
          correctAnswer: "",
          points: 20
        },
        {
          id: "e2-q6",
          questionText: "<p><strong>Verbal Presentation:</strong> Explain the key differences between ACID and BASE database properties in under 60 seconds.</p>",
          type: "audio-video",
          recordingDurationSeconds: 60,
          correctAnswer: "",
          points: 20
        }
      ]
    }
  ];

  const initialDb = {
    users: seededUsers,
    exams: seededExams,
    submissions: [],
    proctorLogs: [],
    warnings: []
  };

  writeDb(initialDb);
  return initialDb;
}

// Start building Server
const app = express();
app.use(express.json());

// Express Logging and Simple CORS (Not strictly needed since we are on the same origin, but good practice)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Middleware: Authenticate Token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required (missing JWT token)." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired session token. Please re-authenticate." });
    }
    req.user = decoded;
    next();
  });
}

// Middleware: Role Access Control
function authorizeRoles(...roles: UserRole[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access Denied: Insufficient permissions for this portal." });
    }
    next();
  };
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required (name, email, password, role)." });
  }

  const validRoles: UserRole[] = ["admin", "teacher", "student"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role selected." });
  }

  const db = readDb();
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ message: "An account with this email already exists." });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const newUser: User = {
    id: `u-${Math.random().toString(36).substring(2, 11)}`,
    name,
    email: email.toLowerCase(),
    role,
    createdAt: new Date().toISOString()
  };

  db.users.push({ ...newUser, passwordHash });
  writeDb(db);

  // Generate JWT
  const token = jwt.sign(
    { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: "6h" }
  );

  res.status(201).json({ token, user: newUser });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const db = readDb();
  const userRecord = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!userRecord || !bcrypt.compareSync(password, userRecord.passwordHash)) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = jwt.sign(
    { id: userRecord.id, name: userRecord.name, email: userRecord.email, role: userRecord.role },
    JWT_SECRET,
    { expiresIn: "6h" }
  );

  const { passwordHash, ...userResponse } = userRecord;
  res.json({ token, user: userResponse });
});

app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User session not found." });
  }
  const { passwordHash, ...userResponse } = user;
  res.json(userResponse);
});

// Silent token refresh endpoint
app.post("/api/auth/refresh", authenticateToken, (req: any, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const { testShortExpiry } = req.body;
  // If testShortExpiry is requested, expire in 8 minutes so there are 8m total, triggering the 5m warning in 3m.
  const expiresIn = testShortExpiry ? "8m" : "6h";

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn }
  );

  res.json({ token });
});


// ==========================================
// ADMIN PORTAL ENDPOINTS (Admin only)
// ==========================================

app.get("/api/admin/users", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const db = readDb();
  const safeUsers = db.users.map(({ passwordHash, ...user }) => user);
  res.json(safeUsers);
});

app.put("/api/admin/users/:id/role", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles: UserRole[] = ["admin", "teacher", "student"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role specified." });
  }

  const db = readDb();
  const userIndex = db.users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found." });
  }

  db.users[userIndex].role = role;
  writeDb(db);

  const { passwordHash, ...userResponse } = db.users[userIndex];
  res.json({ message: "User role updated successfully", user: userResponse });
});

app.delete("/api/admin/users/:id", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const initialCount = db.users.length;
  db.users = db.users.filter(u => u.id !== id);
  
  if (db.users.length === initialCount) {
    return res.status(404).json({ message: "User not found." });
  }

  // Also clean up student submissions and logs
  db.submissions = db.submissions.filter(s => s.studentId !== id);
  db.proctorLogs = db.proctorLogs.filter(l => l.studentId !== id);

  writeDb(db);
  res.json({ message: "User account and all related sub-data removed." });
});

app.get("/api/admin/stats", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const db = readDb();
  const stats: DashboardStats = {
    totalExams: db.exams.length,
    totalSubmissions: db.submissions.length,
    totalStudents: db.users.filter(u => u.role === "student").length,
    totalTeachers: db.users.filter(u => u.role === "teacher").length,
  };
  res.json(stats);
});


// ==========================================
// EXAM PORTAL ENDPOINTS (Teachers & Students)
// ==========================================

// Get all exams
app.get("/api/exams", authenticateToken, (req: any, res) => {
  const db = readDb();
  if (req.user.role === "student") {
    // Hide correct answers and questions if student has not started
    const strippedExams = db.exams.map(exam => {
      const questionsCount = exam.questions.length;
      const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
      
      // Check if student has already submitted this exam
      const studentSub = db.submissions.find(
        s => s.examId === exam.id && s.studentId === req.user.id
      );
      
      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        creatorName: exam.creatorName,
        questionsCount,
        totalPoints,
        createdAt: exam.createdAt,
        status: studentSub ? studentSub.status : "not-started",
        submission: studentSub ? {
          id: studentSub.id,
          score: studentSub.score,
          maxScore: studentSub.maxScore,
          graded: studentSub.graded,
          feedback: studentSub.feedback,
          submitTime: studentSub.submitTime,
          resultStatus: studentSub.resultStatus,
          questionScores: studentSub.questionScores
        } : null
      };
    });
    return res.json(strippedExams);
  } else {
    // Teachers/Admins get full data
    res.json(db.exams);
  }
});

// Get single exam details
app.get("/api/exams/:id", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const db = readDb();
  const exam = db.exams.find(e => e.id === id);
  if (!exam) {
    return res.status(404).json({ message: "Exam paper not found." });
  }

  // If student requests, hide correct answers!
  if (req.user.role === "student") {
    const questionsWithoutCorrectAnswers = exam.questions.map(q => {
      const { correctAnswer, ...qData } = q;
      return qData;
    });
    return res.json({
      ...exam,
      questions: questionsWithoutCorrectAnswers
    });
  }

  res.json(exam);
});

// Create exam (Teachers only)
app.post("/api/exams", authenticateToken, authorizeRoles("teacher"), (req: any, res) => {
  const { title, description, durationMinutes, questions, proctorRules } = req.body;
  if (!title || !description || !durationMinutes || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ message: "Invalid parameters. Please supply title, description, duration, and list of questions." });
  }

  const db = readDb();
  
  // Format questions
  const formattedQuestions: Question[] = questions.map((q: any, i: number) => ({
    id: q.id || `q-${Math.random().toString(36).substring(2, 9)}`,
    questionText: q.questionText,
    type: q.type || "mcq",
    options: q.options || [],
    correctAnswer: q.correctAnswer || "",
    points: Number(q.points) || 10,
    codeLanguage: q.codeLanguage,
    codeTemplate: q.codeTemplate,
    maxFileSizeMB: q.maxFileSizeMB !== undefined ? Number(q.maxFileSizeMB) : undefined,
    recordingDurationSeconds: q.recordingDurationSeconds !== undefined ? Number(q.recordingDurationSeconds) : undefined
  }));

  const newExam: Exam = {
    id: `exam-${Math.random().toString(36).substring(2, 11)}`,
    title,
    description,
    durationMinutes: Number(durationMinutes),
    creatorId: req.user.id,
    creatorName: req.user.name,
    questions: formattedQuestions,
    createdAt: new Date().toISOString(),
    proctorRules: proctorRules || {
      warningThreshold: 3,
      blockCopyPaste: true,
      autoSubmitOnViolation: false,
      enableNoiseDetection: false,
      noiseThreshold: 50
    }
  };

  db.exams.push(newExam);
  writeDb(db);
  res.status(201).json(newExam);
});

// Update exam (Teachers only)
app.put("/api/exams/:id", authenticateToken, authorizeRoles("teacher"), (req: any, res) => {
  const { id } = req.params;
  const { title, description, durationMinutes, questions, proctorRules } = req.body;

  const db = readDb();
  const examIndex = db.exams.findIndex(e => e.id === id);
  if (examIndex === -1) {
    return res.status(404).json({ message: "Exam not found." });
  }

  // Verify ownership (only creator teacher can update)
  if (db.exams[examIndex].creatorId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: You do not own this exam paper." });
  }

  const updatedQuestions: Question[] = questions ? questions.map((q: any) => ({
    id: q.id || `q-${Math.random().toString(36).substring(2, 9)}`,
    questionText: q.questionText,
    type: q.type || "mcq",
    options: q.options || [],
    correctAnswer: q.correctAnswer || "",
    points: Number(q.points) || 10,
    codeLanguage: q.codeLanguage,
    codeTemplate: q.codeTemplate,
    maxFileSizeMB: q.maxFileSizeMB !== undefined ? Number(q.maxFileSizeMB) : undefined,
    recordingDurationSeconds: q.recordingDurationSeconds !== undefined ? Number(q.recordingDurationSeconds) : undefined
  })) : db.exams[examIndex].questions;

  db.exams[examIndex] = {
    ...db.exams[examIndex],
    title: title || db.exams[examIndex].title,
    description: description || db.exams[examIndex].description,
    durationMinutes: durationMinutes ? Number(durationMinutes) : db.exams[examIndex].durationMinutes,
    questions: updatedQuestions,
    proctorRules: proctorRules || db.exams[examIndex].proctorRules
  };

  writeDb(db);
  res.json(db.exams[examIndex]);
});

// Delete exam (Teachers only)
app.delete("/api/exams/:id", authenticateToken, authorizeRoles("teacher"), (req: any, res) => {
  const { id } = req.params;
  const db = readDb();
  const exam = db.exams.find(e => e.id === id);
  
  if (!exam) {
    return res.status(404).json({ message: "Exam not found." });
  }

  if (exam.creatorId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: You cannot delete an exam paper you didn't create." });
  }

  db.exams = db.exams.filter(e => e.id !== id);
  // Also delete corresponding submissions and proctoring logs
  db.submissions = db.submissions.filter(s => s.examId !== id);
  db.proctorLogs = db.proctorLogs.filter(l => l.examId !== id);

  writeDb(db);
  res.json({ message: "Exam paper and all historical candidate records deleted." });
});


// ==========================================
// EXAM TAKING & SUBMISSIONS
// ==========================================

// Student starts an exam (creates active submission shell)
app.post("/api/exams/:id/start", authenticateToken, authorizeRoles("student"), (req: any, res) => {
  const { id } = req.params;
  const db = readDb();
  const exam = db.exams.find(e => e.id === id);
  if (!exam) {
    return res.status(404).json({ message: "Exam not found." });
  }

  // Check if student has already attempted this exam
  const existingSub = db.submissions.find(
    s => s.examId === id && s.studentId === req.user.id
  );

  if (existingSub) {
    return res.json(existingSub); // returns existing session
  }

  const newSub: Submission = {
    id: `sub-${Math.random().toString(36).substring(2, 11)}`,
    examId: id,
    examTitle: exam.title,
    studentId: req.user.id,
    studentName: req.user.name,
    startTime: new Date().toISOString(),
    answers: {},
    score: 0,
    maxScore: exam.questions.reduce((sum, q) => sum + q.points, 0),
    graded: false,
    status: "started"
  };

  db.submissions.push(newSub);
  writeDb(db);
  res.status(201).json(newSub);
});

// Student submits their exam paper
app.post("/api/exams/:id/submit", authenticateToken, authorizeRoles("student"), (req: any, res) => {
  const { id } = req.params;
  const { answers, durationSeconds } = req.body;
  if (!answers) {
    return res.status(400).json({ message: "Submissions require answers mapping." });
  }

  const db = readDb();
  const exam = db.exams.find(e => e.id === id);
  if (!exam) {
    return res.status(404).json({ message: "Exam paper not found." });
  }

  const subIndex = db.submissions.findIndex(
    s => s.examId === id && s.studentId === req.user.id
  );

  if (subIndex === -1) {
    return res.status(400).json({ message: "No active started exam session found. Start the exam first." });
  }

  if (db.submissions[subIndex].status === "submitted") {
    return res.status(400).json({ message: "This exam session has already been completed and submitted." });
  }

  // Automated grading for MCQs
  let score = 0;
  let allMCQsGraded = true;

  exam.questions.forEach(q => {
    const studentAnswer = answers[q.id] || "";
    if (q.type === "mcq") {
      if (studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        score += q.points;
      }
    } else {
      // Short answer questions must be manually graded by teachers later
      allMCQsGraded = false;
    }
  });

  const maxScore = exam.questions.reduce((sum, q) => sum + q.points, 0);

  // Initialize result status and question scores for auto-graded MCQ-only exams
  const finalResultStatus = score >= (maxScore / 2) ? "passed" : "failed";
  const questionScores: { [qId: string]: number } = {};
  exam.questions.forEach(q => {
    if (q.type === "mcq") {
      const studentAnswer = answers[q.id] || "";
      const isCorrect = studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      questionScores[q.id] = isCorrect ? q.points : 0;
    } else {
      questionScores[q.id] = 0;
    }
  });

  // Update submission status
  db.submissions[subIndex] = {
    ...db.submissions[subIndex],
    answers,
    submitTime: new Date().toISOString(),
    status: "submitted",
    score,
    maxScore,
    durationSeconds: Number(durationSeconds) || 0,
    graded: allMCQsGraded, // If MCQ-only exam, mark as graded immediately!
    resultStatus: allMCQsGraded ? finalResultStatus : undefined,
    questionScores: allMCQsGraded ? questionScores : undefined
  };

  writeDb(db);
  res.json(db.submissions[subIndex]);
});


// ==========================================
// TEACHER GRADING PORTAL
// ==========================================

// Get all submissions (Teachers can see submissions for exams they created. Admins see all)
app.get("/api/submissions", authenticateToken, (req: any, res) => {
  const db = readDb();
  if (req.user.role === "student") {
    const studentSubs = db.submissions.filter(s => s.studentId === req.user.id);
    return res.json(studentSubs);
  }

  if (req.user.role === "teacher") {
    // Filter exams created by this teacher
    const teacherExamIds = db.exams
      .filter(e => e.creatorId === req.user.id)
      .map(e => e.id);
    
    const teacherSubs = db.submissions.filter(s => teacherExamIds.includes(s.examId));
    return res.json(teacherSubs);
  }

  if (req.user.role === "admin") {
    return res.json(db.submissions);
  }

  res.status(403).json({ message: "Role unauthorized." });
});

// Single submission details with questions & answers relationally compiled
app.get("/api/submissions/:id", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const sub = db.submissions.find(s => s.id === id);
  if (!sub) {
    return res.status(404).json({ message: "Submission not found." });
  }

  // Security checks
  if (req.user.role === "student" && sub.studentId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: Access to another student's submission is restricted." });
  }

  const exam = db.exams.find(e => e.id === sub.examId);
  if (!exam) {
    return res.status(404).json({ message: "Linked exam paper could not be found." });
  }

  // Attach full detailed questions with original correct answers for grading/review
  res.json({
    submission: sub,
    exam
  });
});

// Teacher submits manual score & feedback for short answer questions
app.post("/api/submissions/:id/grade", authenticateToken, authorizeRoles("teacher", "admin"), (req: any, res) => {
  const { id } = req.params;
  const { scores, feedback, resultStatus } = req.body; // scores: { [questionId]: number }, resultStatus: 'passed' | 'failed'

  if (!scores || typeof scores !== "object") {
    return res.status(400).json({ message: "Requires a scores map of scores per question ID." });
  }

  const db = readDb();
  const subIndex = db.submissions.findIndex(s => s.id === id);
  if (subIndex === -1) {
    return res.status(404).json({ message: "Submission not found." });
  }

  const sub = db.submissions[subIndex];
  const exam = db.exams.find(e => e.id === sub.examId);
  if (!exam) {
    return res.status(404).json({ message: "Related exam paper not found." });
  }

  // Verify authority
  if (req.user.role === "teacher" && exam.creatorId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: You are not the author of this exam." });
  }

  // Calculate final score and compile question-by-question score breakdown
  let finalScore = 0;
  const savedQuestionScores: { [qId: string]: number } = {};

  exam.questions.forEach(q => {
    if (q.type === "mcq") {
      const studentAnswer = sub.answers[q.id] || "";
      const isCorrect = studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      const points = isCorrect ? q.points : 0;
      savedQuestionScores[q.id] = points;
      finalScore += points;
    } else {
      // Manual score from teacher
      const manualPoints = Number(scores[q.id]) || 0;
      const points = Math.min(manualPoints, q.points); // Ensure score doesn't exceed question points
      savedQuestionScores[q.id] = points;
      finalScore += points;
    }
  });

  const totalPossiblePoints = exam.questions.reduce((sum, q) => sum + (q.points || 0), 0);
  const calculatedStatus = finalScore >= (totalPossiblePoints / 2) ? "passed" : "failed";
  const finalResultStatus = resultStatus === "passed" || resultStatus === "failed" ? resultStatus : calculatedStatus;

  db.submissions[subIndex] = {
    ...db.submissions[subIndex],
    score: finalScore,
    graded: true,
    feedback: feedback || db.submissions[subIndex].feedback,
    resultStatus: finalResultStatus,
    questionScores: savedQuestionScores
  };

  writeDb(db);
  res.json({ message: "Grade sheet saved successfully.", submission: db.submissions[subIndex] });
});


// ==========================================
// PROCTORING SYSTEM ENDPOINTS
// ==========================================

// Register proctor log
app.post("/api/proctor/log", authenticateToken, authorizeRoles("student"), (req: any, res) => {
  const { examId, eventType, details } = req.body;
  if (!examId || !eventType) {
    return res.status(400).json({ message: "Exam ID and eventType are required." });
  }

  const db = readDb();
  const exam = db.exams.find(e => e.id === examId);
  if (!exam) {
    return res.status(404).json({ message: "Exam not found." });
  }

  const newLog: ProctorLog = {
    id: `log-${Math.random().toString(36).substring(2, 11)}`,
    examId,
    examTitle: exam.title,
    studentId: req.user.id,
    studentName: req.user.name,
    eventType,
    timestamp: new Date().toISOString(),
    details: details || "No details provided."
  };

  db.proctorLogs.push(newLog);
  writeDb(db);
  res.status(201).json(newLog);
});

// Get proctor logs (Admins see all; Teachers see logs for exams they authored)
app.get("/api/proctor/logs", authenticateToken, authorizeRoles("teacher", "admin"), (req: any, res) => {
  const db = readDb();
  if (req.user.role === "admin") {
    return res.json(db.proctorLogs);
  }

  // Filter logs for teacher's exams
  const teacherExamIds = db.exams
    .filter(e => e.creatorId === req.user.id)
    .map(e => e.id);
  
  const teacherLogs = db.proctorLogs.filter(log => teacherExamIds.includes(log.examId));
  res.json(teacherLogs);
});


// ==========================================
// PROCTORING INTERVENTION WARNINGS ENDPOINTS
// ==========================================

// Get proctor warning interventions
app.get("/api/proctor/warnings", authenticateToken, (req: any, res) => {
  const db = readDb();
  const { examId } = req.query;
  const warnings = db.warnings || [];

  if (req.user.role === "student") {
    // Return warnings for this student
    const studentWarnings = warnings.filter(w => w.studentId === req.user.id);
    if (examId) {
      return res.json(studentWarnings.filter(w => w.examId === examId));
    }
    return res.json(studentWarnings);
  }

  // Admin or Teacher can see warnings.
  if (req.user.role === "admin") {
    if (examId) {
      return res.json(warnings.filter(w => w.examId === examId));
    }
    return res.json(warnings);
  }

  // Teacher sees warnings related to their exams
  const teacherExamIds = db.exams
    .filter(e => e.creatorId === req.user.id)
    .map(e => e.id);
  
  let teacherWarnings = warnings.filter(w => teacherExamIds.includes(w.examId));
  if (examId) {
    teacherWarnings = teacherWarnings.filter(w => w.examId === examId);
  }
  return res.json(teacherWarnings);
});

// Issue manual warning intervention
app.post("/api/proctor/warn", authenticateToken, authorizeRoles("teacher", "admin"), (req: any, res) => {
  const { studentId, examId, message } = req.body;
  if (!studentId || !examId || !message) {
    return res.status(400).json({ message: "Student ID, Exam ID, and message are required." });
  }

  const db = readDb();
  
  // Find student user
  const student = db.users.find(u => u.id === studentId);
  if (!student) {
    return res.status(404).json({ message: "Student user not found." });
  }

  // Find exam
  const exam = db.exams.find(e => e.id === examId);
  if (!exam) {
    return res.status(404).json({ message: "Exam paper not found." });
  }

  // Optional security check: if user is teacher, verify they created this exam
  if (req.user.role === "teacher" && exam.creatorId !== req.user.id) {
    return res.status(403).json({ message: "Access Denied: You cannot issue warnings for another teacher's exam." });
  }

  // Initialize warnings if empty
  db.warnings = db.warnings || [];

  const newWarning: ProctorWarning = {
    id: `warn-${Math.random().toString(36).substring(2, 11)}`,
    studentId,
    studentName: student.name,
    examId,
    examTitle: exam.title,
    message,
    timestamp: new Date().toISOString(),
    acknowledged: false
  };

  db.warnings.push(newWarning);

  // Also log the intervention to the log stream
  const newLog: ProctorLog = {
    id: `log-${Math.random().toString(36).substring(2, 11)}`,
    examId,
    examTitle: exam.title,
    studentId,
    studentName: student.name,
    eventType: "intervention",
    timestamp: new Date().toISOString(),
    details: `Teacher Intervention Warning: ${message}`
  };

  db.proctorLogs.push(newLog);
  writeDb(db);

  res.status(201).json({
    message: "Manual proctor warning intervention sent successfully.",
    warning: newWarning,
    log: newLog
  });
});

// Acknowledge warning
app.post("/api/proctor/warnings/:id/acknowledge", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const db = readDb();
  db.warnings = db.warnings || [];

  const warningIndex = db.warnings.findIndex(w => w.id === id);
  if (warningIndex === -1) {
    return res.status(404).json({ message: "Warning intervention record not found." });
  }

  const warning = db.warnings[warningIndex];
  
  // Verify the student is the one acknowledging
  if (req.user.role === "student" && warning.studentId !== req.user.id) {
    return res.status(403).json({ message: "Access Denied: You cannot acknowledge another student's warning." });
  }

  db.warnings[warningIndex].acknowledged = true;

  // Add a log for acknowledgement
  const newLog: ProctorLog = {
    id: `log-${Math.random().toString(36).substring(2, 11)}`,
    examId: warning.examId,
    examTitle: warning.examTitle,
    studentId: warning.studentId,
    studentName: warning.studentName,
    eventType: "focus", // Focus restored or ack
    timestamp: new Date().toISOString(),
    details: `Student acknowledged manual intervention: "${warning.message}"`
  };
  db.proctorLogs.push(newLog);

  writeDb(db);

  res.json({ message: "Warning acknowledged.", warning: db.warnings[warningIndex] });
});


// ==========================================
// TEACHER ANALYTICS ENDPOINTS
// ==========================================

app.get("/api/teacher/analytics", authenticateToken, authorizeRoles("teacher", "admin"), (req: any, res) => {
  const db = readDb();
  
  // Filter exams by creator
  const teacherExams = req.user.role === "admin" 
    ? db.exams 
    : db.exams.filter(e => e.creatorId === req.user.id);

  const analyticsResponse: TeacherAnalytics[] = [];

  teacherExams.forEach(exam => {
    // Get all submissions for this exam that are submitted
    const examSubs = db.submissions.filter(s => s.examId === exam.id && s.status === "submitted");
    if (examSubs.length === 0) {
      // Empty statistics for exams with no participants yet
      analyticsResponse.push({
        examId: exam.id,
        examTitle: exam.title,
        averageScore: 0,
        maxScore: exam.questions.reduce((sum, q) => sum + q.points, 0),
        passRate: 0,
        totalSubmissions: 0,
        scoreDistribution: [
          { range: "0-20%", count: 0 },
          { range: "21-40%", count: 0 },
          { range: "41-60%", count: 0 },
          { range: "61-80%", count: 0 },
          { range: "81-100%", count: 0 }
        ],
        durationAverageSeconds: 0
      });
      return;
    }

    const totalSubmissions = examSubs.length;
    const totalPointsSum = exam.questions.reduce((sum, q) => sum + q.points, 0);

    let scoreSum = 0;
    let durationSum = 0;
    let passes = 0;
    let highestScore = 0;

    const distribution = [
      { range: "0-20%", count: 0 },
      { range: "21-40%", count: 0 },
      { range: "41-60%", count: 0 },
      { range: "61-80%", count: 0 },
      { range: "81-100%", count: 0 }
    ];

    examSubs.forEach(sub => {
      scoreSum += sub.score;
      durationSum += sub.durationSeconds || 0;
      if (sub.score > highestScore) highestScore = sub.score;

      // Pass criteria: score >= 50%
      const percentage = totalPointsSum > 0 ? (sub.score / totalPointsSum) * 100 : 0;
      if (percentage >= 50) {
        passes++;
      }

      // Fill distribution
      if (percentage <= 20) distribution[0].count++;
      else if (percentage <= 40) distribution[1].count++;
      else if (percentage <= 60) distribution[2].count++;
      else if (percentage <= 80) distribution[3].count++;
      else distribution[4].count++;
    });

    analyticsResponse.push({
      examId: exam.id,
      examTitle: exam.title,
      averageScore: Math.round((scoreSum / totalSubmissions) * 10) / 10,
      maxScore: highestScore,
      passRate: Math.round((passes / totalSubmissions) * 100),
      totalSubmissions,
      scoreDistribution: distribution,
      durationAverageSeconds: Math.round(durationSum / totalSubmissions)
    });
  });

  res.json(analyticsResponse);
});


// ==========================================
// DEVELOPMENT / PRODUCTION STATIC SETUP
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Integration with Vite inside development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve build directory files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Remote Exam Server] Listening securely on port http://0.0.0.0:${PORT}`);
  });
}

startServer();
