# CodeArena: High-Fidelity Technical PRD & Design Specification

## 1. Core Philosophy & Aesthetic Identity
CodeArena is designed as a premium, low-friction, high-security competitive programming platform for Ahmedabad University.
- **Aesthetic**: "Terminal Noir" – Deep blacks (#000000), subtle noise grain, glassmorphism (15-20% opacity), and "AU Purple" (#7C3AED) as the primary accent.
- **Typography**: Space Grotesk (Headings) and Inter (Body/UI).
- **UX**: Single-page application (SPA) feel, no-scroll layouts for main views, animated transitions.

---

## 2. UI/UX Design Blueprints & AI Prompts

### 🎨 2.1 The Global Design System (Common Components)
**Design Prompt**: 
> "Create a dark-themed UI system using #000000 as the background with a 3% opacity grain noise overlay. Interactive cards should use a 10% opacity white background with a `backdrop-blur-xl` filter and a 1px border of `rgba(255,255,255,0.05)`. Buttons should have a subtle #7C3AED outer glow on hover. Use 'Space Grotesk' for uppercase tracked-out headers and 'Inter' for high-readability code and body text."

---

### 🏠 2.2 Landing Page (Home)
**Page Goal**: Professional, high-impact first impression.

#### Layout Blueprint:
- **Hero Area**: Centered Title (CodeArena) in ultra-bold Space Grotesk.
- **Terminal Window**: Fixed-height Mac-style terminal showing simulated coding activity.
- **Navigation**: Minimal top-right links (Login, Register).

**Design Prompt for AI**:
> "Design a minimalist landing page with a pure black background. In the center, place a large 'CodeArena' title with letter-spacing 0.2em. Below it, add a Mac-style terminal block with a purple glow. The terminal should feature a typing animation of terminal commands like `sudo start --platform`. No scrolling allowed; keep the layout fixed and responsive."

---

### 🛡️ 2.3 Authentication Module (Login/Register/OTP)
**Page Goal**: High-trust, minimal interface.

#### Layout Blueprint:
- **Center Card**: Fixed width (450px), vertical stack.
- **Aesthetic**: Deep glassmorphism. A purple "light leak" glow in the top-right corner.
- **Interaction**: Inputs should have a 1px solid #7C3AED border that pulses on focus.

**Design Prompt for AI**:
> "Design a Login/Registration suite with a central glassmorphic card. Inputs should have floating labels and a 1px border that glows purple on focus. The 'Sign In' button should be a full-width block with a high-intensity #7C3AED color and white text. For the OTP page, use six individual square boxes with auto-focus shifting logic."

---

### 🎓 2.4 Student Dashboard (The "Lobby")
**Page Goal**: Informative, futuristic hub.

#### Layout Blueprint:
- **Top Row**: 4 small cards for Quick Stats (Total Solved, Ranking, Accuracy, Streak).
- **Main Area**: List of 'Daily Challenges' and 'Recommended Problems'.
- **Sidebar**: 'Recent Activity' feed and 'Upcoming Events'.

**Design Prompt for AI**:
> "Create a Student Dashboard using a 3-column grid. The top should have four 'Quick Stats' glass cards with neon-colored icons. The main section should be a 'Problem Feed' with high-density rows, each showing problem title, difficulty tag, and status. The sidebar should feature a vertical timeline of 'Recent Activity' with micro-animations on hover."

---

### 🏆 2.5 Contest Listing Page
**Page Goal**: Drive participation and competition.

#### Layout Blueprint:
- **Categories**: 'Active Now', 'Upcoming', 'Past Contests'.
- **Contest Card**: Shows Title, Faculty Name, Countdown Timer, and 'Register' button.

**Design Prompt for AI**:
> "Design a Contest Listing page. Use large glass cards for 'Active Now' contests with a pulsing red 'LIVE' badge. Upcoming contests should have a digital countdown clock (HH:MM:SS) in a monospaced font. Past contests should be listed in a more compact table format with a link to view the Final Standings."

---

### 🏁 2.6 Contest Lobby & Leaderboard
**Page Goal**: Real-time competitive atmosphere.

#### Layout Blueprint:
- **Leaderboard Table**: Ranks, Student Names, Total Score, and Problem-wise performance (AC/WA).
- **Real-time Updates**: Socket.io integration to auto-sort rows on every new AC submission.

**Design Prompt for AI**:
> "Create a live Leaderboard UI. Ranks 1, 2, and 3 should have gold, silver, and bronze accent borders. Use a high-density table where each problem is a square box (Green for AC, Red for WA, Gray for Unattempted). Row sorting should be animated when a student's rank changes. Top bar must show a persistent 'Contest Time Remaining' clock."

---

### 💻 2.7 The Workbench (IDE & Editor)
**Page Goal**: Zero-distraction, peak utility.

#### Layout Blueprint:
- **Header**: Problem Title, Timer, and 'Quit Exam' (if proctored).
- **Main Workspace**: Three-way split (Statement | Editor | Console/Output).

**Design Prompt for AI**:
> "Design a pro-grade IDE interface. Use a 3-pane adjustable layout. The Problem Statement should use elegant typography with LaTeX math support. The Monaco Editor should be configured with a custom 'CodeArena' dark theme. The Console at the bottom should have tabs for 'Input', 'Expected Output', 'Your Output', and 'Compiler Logs'. Use #7C3AED for all primary action buttons."

---

### 📊 2.8 Submission History & Verdict Details
**Page Goal**: Debugging and transparency.

#### Layout Blueprint:
- **Table**: Submission ID, Problem, Language, Verdict, Time, Memory.
- **Detail View**: Full source code view with syntax highlighting and a per-test-case result breakdown.

**Design Prompt for AI**:
> "Create a Submission History table with clean, striped rows. Clicking a row should open a glassmorphic side-panel (drawer) showing the full code submitted. Use a grid of icons to show 'Test Case Results' (Green check for pass, Red cross for fail) with tooltips showing execution time and memory for each case."

---

### 👨‍🏫 2.9 Faculty Dashboard & Control Center
**Page Goal**: Authority and massive data management.

#### Layout Blueprint:
- **Analytics Hero**: Area charts showing submission trends.
- **Quick Actions**: 'Create Problem', 'Schedule Contest', 'Export Grades'.

**Design Prompt for AI**:
> "Design a Faculty Dashboard with a data-dense layout. Use a sidebar for 'Contest Management', 'Problem Bank', and 'Student Analytics'. The main view should feature a 'Live Submission Stream' showing real-time activity across all active contests. Add a 'Quick Actions' floating menu for creating new content."

---

### 🛠️ 2.10 Problem & Contest Creator
**Page Goal**: Complex input handling simplified.

#### Layout Blueprint:
- **Multi-step Wizard**: General Info -> Statement (Markdown) -> Constraints -> Test Cases (File Upload).
- **Test Case Manager**: Table to manage multiple inputs/outputs with score weightage.

**Design Prompt for AI**:
> "Create a multi-step 'Problem Creator' wizard. Use a large Markdown editor for the problem description. The 'Test Case' step should feature a drag-and-drop zone for ZIP files and a table to manually edit specific inputs. Use a clean, professional form layout with high-contrast labels."

---

### 🔎 2.11 Analytics & Plagiarism Reports
**Page Goal**: Academic integrity and performance insights.

#### Layout Blueprint:
- **Similarity Matrix**: Grid showing % similarity between all pairs of students.
- **Code Comparison**: Side-by-side diff view of two suspicious submissions.

**Design Prompt for AI**:
> "Design a Plagiarism Detection report. Use a heatmap matrix to show similarity scores. Clicking a high-score cell should open a 'Side-by-Side Diff' view highlighting identical code segments in purple. Add a 'Flag' button to mark students for manual review."

---

## 3. Global Functional Modules (Logic)

### 3.1 Authentication Logic
- **Domain Check**: `@ahduni.edu.in` enforcement.
- **OTP**: 6-digit verification with auto-submit on the last digit.
- **Session**: Automatic logout after 30 mins of inactivity.

### 3.2 Judge Engine Logic
- **Queueing**: BullMQ workers with Redis.
- **Verdict Mapping**: AC, WA, TLE, MLE, CE, RE.
- **Resource Limits**: Configurable per problem.

### 3.3 Proctoring Engine Logic
- **Events**: `TAB_SWITCH`, `FULLSCREEN_EXIT`, `PASTE_ATTEMPT`.
- **Threshold**: Faculty-set violation limits.

---

## 4. Non-Functional Requirements (NFR)

### ⚡ Performance
- **API Latency**: <100ms.
- **Concurrency**: 500 simultaneous users on AU LAN.

### 🔒 Security
- **Sandbox**: No network, restricted syscalls.
- **Persistence**: Daily DB backups to secondary drive.

---
*End of Complete Technical & Design Specification*


