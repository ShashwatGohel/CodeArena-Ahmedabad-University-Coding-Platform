# Finalized Contest Security & Anti-Cheating Implementation Plan

This document outlines the strict security measures to be implemented for CodeArena contests. These features are designed to create a "Lockdown" environment for students while maintaining necessary functionality for legitimate coding.

## New Feature: Proctored Mode Toggle
*Objective: Give faculty control over when to enforce strict security.*

### 1. "Proctored" Status
- Every contest will have a boolean `isProctored` flag (Default: `false`).
- **Proctored Mode ON**: All security measures below (Full-screen, Lockout, Violation Tracking) are active.
- **Proctored Mode OFF**: Standard contest environment with no security restrictions.
- **Faculty Control**: A simple On/Off toggle in the Contest Creation and "Arena Monitor" views.

---

## Phase 1: Secure Contest Environment (Lockdown Mode)
*Objective: Prevent students from leaving the contest interface or using external tools.*

### 1. Mandatory Full-Screen Environment
- **Enforcement**: Upon entering the correct contest password, the browser will be forced into Full-Screen mode (if `isProctored` is ON).
- **Escapability**: The student will be warned that any attempt to exit full-screen, Alt-Tab, or switch tabs will result in an immediate and permanent lockout.
- **Lockout Mechanism**:
    - If `fullscreenchange` (exit), `visibilitychange` (hidden), or `blur` (focus loss) events occur, the student is instantly blocked from the problem-solving interface.
    - A "Contest Locked" screen will be displayed.
    - The student **cannot** re-enter using the contest password.

### 2. Admin-Only Re-entry
- **Manual Override**: Only a faculty member or administrator can unlock a student's session from their dashboard.
- **Verification**: The faculty will see a log of the specific violation that triggered the lockout before deciding to re-enable the student.

---

## Phase 2: Violation Detection & Logging
*Objective: Provide faculty with detailed intelligence on student behavior.*

### 1. Advanced Event Tracking
The system will monitor and log the following violations (only in Proctored Mode):
- **Tab Switching**: Detecting when the student moves to another browser tab.
- **Alt-Tab / Focus Loss**: Detecting when the student switches to another application (e.g., AI tools, chat).
- **Full-Screen Exit**: Detecting when the student minimizes the window or exits the forced mode.
- **Inspect Mode Protection**: 
    - Blocking F12, Ctrl+Shift+I, and Right-Click.
    - Detecting if the dev tools window is opened.
- **Extension/AI Detection**: Monitoring for unexpected DOM changes or focus patterns typical of browser AI assistants (Sider, Monica).

### 2. Violation Database
- New `Violation` schema to store: `studentId`, `contestId`, `type`, `timestamp`, and `details`.
- Real-time updates to the Faculty `ContestMonitor` dashboard.

---

## Phase 3: Controlled Functional Clipboard
*Objective: Allow legitimate code reuse while preventing external leaks.*

### 1. Internal Copy-Paste Policy
- **Allowed**: Copying from the editor, copying from the student's own previous submissions, and pasting within the editor.
- **External Block**: (Optional/Experimental) Attempt to sanitize the clipboard on focus-in to prevent pasting code copied from external sources before the contest started.

---

## Phase 4: Implementation Workflow

### 1. Backend Updates
- Update `Contest` model to include `isProctored` (Boolean) and `contestPassword` (String).
- Create `Violation` model.
- Update `User` or create `SessionLock` model to track locked status per student/contest.
- Create `/api/contests/:id/violations` and `/api/contests/:id/unlock/:studentId` routes.

### 2. Frontend Updates
- **Faculty**: Add "Proctored Mode" toggle in `ContestMonitor.jsx` and contest creation forms.
- **Student**: Update `ProblemSolve.jsx` to conditionally mount security listeners and the "Locked" UI based on the `isProctored` status.

---

**Please approve this final plan. Once approved, I will begin the implementation starting with Phase 1.**
