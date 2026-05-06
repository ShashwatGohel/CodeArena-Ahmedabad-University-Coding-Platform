# CodeArena - Development Roadmap & Todo List

> [!IMPORTANT]
> This roadmap is derived from the [Detailed PRD](file:///c:/Users/hp/Desktop/CodeArena-Ahmedabad-University-Coding-Platform/docs/PRD_Detailed.md). Refer to the PRD for full logic and non-functional requirements.


## 🚀 Completed
- [x] Initial Project Setup (Vite, React, Node.js, Tailwind v4)
- [x] High-Fidelity Landing Page
  - [x] Terminal typewriter animation
  - [x] Dark professional aesthetic
  - [x] Responsive layout (Non-scrolling)
  - [x] Custom typography (Space Grotesk & Inter)

## 🔐 Authentication & Identity
- [ ] **Backend: Identity & Security**
  - [ ] Implement Prisma schema for Users (Student, Faculty, Admin)
  - [ ] Argon2 password hashing integration
  - [ ] Device fingerprinting logic for session security
- [ ] **Auth Logic & Workflows**
  - [ ] JWT implementation (HTTP-only cookies for refresh tokens)
  - [ ] AU Email domain (@ahduni.edu.in) regex validation
  - [ ] 6-digit OTP email workflow (Nodemailer + 5-min expiration)
- [ ] **Frontend: Auth UI**
  - [ ] Premium Glassmorphic Login/Register pages
  - [ ] OTP verification view with auto-focus shifting inputs

## 💻 Judge Engine & Sandbox
- [ ] **Execution Infrastructure**
  - [ ] Redis & BullMQ cluster setup
  - [ ] Docker base images (C, C++, Java, Python, Bash)
  - [ ] Read-only test case volume mounting logic
- [ ] **Judging Core Logic**
  - [ ] Sandbox isolation (--network none, pids-limit, memory constraints)
  - [ ] Custom seccomp profile for syscall restriction
  - [ ] Verdict calculation logic (TLE/MLE/RE/CE/AC/WA)
  - [ ] Performance tracking (Time in ms, Memory in RSS)

## 🏆 Student Workspace (IDE)
- [ ] **Problem Browsing**
  - [ ] Problem List with Difficulty/Tag/Status filters
  - [ ] Fuzzy search for problem titles
- [ ] **The "Workbench" (IDE Page)**
  - [ ] Multi-pane layout (Statement | Editor | Console)
  - [ ] Monaco Editor integration with multi-language support
  - [ ] LocalStorage auto-drafting system (30s interval)
  - [ ] "Run against Sample" vs "Submit" logic

## 🛡️ Proctoring & Competitive Integrity
- [ ] **Security Monitoring**
  - [ ] Fullscreen enforcement & IDE locking logic
  - [ ] `visibilitychange` tab-switch detection and DB logging
  - [ ] Clipboard (Copy/Paste) restriction inside IDE
- [ ] **Event Lifecycle**
  - [ ] Automated start/end timers for contests
  - [ ] Live Leaderboard (Redis-backed ZSETs)

## 👨‍🏫 Control Center (Faculty/Admin)
- [ ] **Management Tools**
  - [ ] ZIP-based test case uploader
  - [ ] Contest configuration (Penalty types, visibility)
- [ ] **Analytics**
  - [ ] Plagiarism similarity reporting (MOSS-style)
  - [ ] Student performance heatmaps

## ⚙️ Infrastructure & Deployment
- [ ] **Network & LAN**
  - [ ] Nginx Reverse Proxy with AU self-signed SSL
  - [ ] PM2 clustering for API high availability
  - [ ] Daily backup CRON (PostgreSQL -> secondary drive)


---
*Last Updated: 2026-05-01*
