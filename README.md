# 🎓 Remote Examination Portal — Secure AI-Powered Proctoring Suite

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A robust, enterprise-grade, and beautifully styled remote examination platform designed to manage exams, automate and manual grade scripts, and monitor student behavior in real-time. Built with a state-of-the-art security grid, it prevents academic dishonesty through advanced client-side telemetry and acoustic proctoring.

---

## 🚀 Key Architectural Pillars

### 1. Immersive Role-Based Portals
*   **Student Dashboard**: 
    *   **Secure Monitor Workspace**: Focus-locked canvas with biometric (ID/camera) validation gates.
    *   **Academic Performance Hub**: Dedicated "My Results" tab summarizing pass/fail outcomes, average grades, and question-by-question scoring breakdowns alongside instructor comments.
*   **Teacher Control Console**:
    *   **Grading Workbench**: Dedicated canvas to evaluate short answers, code submissions, file uploads, and verbal recordings with manual points allocation, Pass/Fail overrides, and feedback comments.
    *   **Proctor Log Stream**: Real-time chronological timeline filtering student telemetry infractions. Includes an exam-wise summary registry displaying student attendance, average completion rates, and incident breakdowns.
*   **Administrator Portal**:
    *   **Exam Scheduler**: Interactive scheduling calendar to persistence-bind examinations.
    *   **Overall System Metrics**: Quick cards tracking global database size, active student/teacher accounts, and exam templates.

### 2. Multi-Dimensional Proctoring Security Grid
*   **Visibility State Tracker (`tab-switch`)**: Logs whenever a student switches browser tabs or minimizes the window.
*   **Window Focus Monitor (`blur`)**: Logs when focus leaves the browser tab (clicking outside the exam sheet or opening DevTools). Includes a **150ms debounce guard** to filter out duplicate logs during quick visibility state changes.
*   **Biometric ID Check Bypass**: Option to simulate TouchID/camera biometric clearance on test systems.
*   **Hardened Clipboard Blocker**: Intercepts and blocks all native document copy, paste, and cut operations (via hotkeys, browser menus, or drag-and-drop actions).
*   **Keydown/Shortcut Interceptor**: Disables restricted shortcut combinations (`Ctrl/Cmd + C, V, X, P, U, S`) and developer utility hotkeys (`F12`).
*   **Context Menu Blocker**: Disables right-clicks globally during active test taking.
*   **Acoustic Proctoring**: Live microphone monitoring that maps average voice amplitudes to a 0–100 scale. Continuous noise levels exceeding the threshold for 25 consecutive animation frames (~1s) trigger a flagged incident.

### 3. Advanced Assessment Modalities
*   **MCQ Challenges**: Automated, instant grading with interactive response selections.
*   **Short Essays**: Textboxes paired with instructor grading rubrics.
*   **Structured Code Challenges**: Built-in developer code sandbox with compilation feedback.
*   **Secure File Uploads**: Attachment modules supporting custom max file size limits.
*   **Verbal Assessment Recordings**: Built-in microphone audio recorder for oral presentations and speaking exams.

---

## 🛠️ Technology Stack
*   **Frontend**: React (with Hook-Ref state decoupling), TypeScript, TailwindCSS, Framer Motion, Lucide Icons, Chart.js.
*   **Backend**: Node.js, Express.js.
*   **Database**: JSON-based mock DB with local filesystem write-backs.

---

## 💻 Running Locally

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18.0 or higher recommended)
*   [npm](https://www.npmjs.com/)

### Step-by-Step Setup
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Aditya1791/Remote-Examination-Portal.git
    cd remote-examination-portal
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Run in Development Mode**:
    ```bash
    npm run dev
    ```
    This launches the Vite bundler and the Express server concurrently. Access the portal at:
    🔗 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Seeding / Demo Accounts
The database contains pre-configured profiles initialized for evaluators and students. Log in with the credentials below:

*   **Administrator Portal**:
    *   **Email**: `admin@exam.com`
    *   **Password**: `password123`
*   **Teacher Portal**:
    *   **Email**: `teacher@exam.com`
    *   **Password**: `password123`
*   **Student Portal**:
    *   **Email**: `student@exam.com`
    *   **Password**: `password123`

---

## 💖 Support & Sponsor

If you find this project useful or it helped you in your work, consider sponsoring!

[![Sponsor via UPI](https://img.shields.io/badge/Sponsor%20via%20UPI-097969?style=for-the-badge&logo=google-pay&logoColor=white)](upi://pay?pa=swainaditya85-2@oksbi&pn=Aditya%20Swain)

**UPI ID**: `swainaditya85-2@oksbi`

---

## 🔒 License
Distributed under the MIT License. See `LICENSE` for more information.
