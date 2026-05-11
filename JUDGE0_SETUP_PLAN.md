# 🚀 Judge0 & Monaco Editor Implementation Plan

This plan outlines the steps to transition from local `child_process` execution to a professional, sandboxed **Judge0 CE** environment with a **Monaco Editor** frontend.

## 1. Judge0 Infrastructure (Self-Hosted)
Since you have 16GB RAM and a Ryzen 5, you can easily host Judge0 locally using Docker.

1.  **Install Docker Desktop**: Ensure Docker is running on your Windows machine.
2.  **Create Judge Directory**:
    ```bash
    mkdir judge0-ce
    cd judge0-ce
    ```
3.  **Download Stack**:
    Download the latest `docker-compose.yml` and `judge0.conf` from the [Judge0 Releases](https://github.com/judge0/judge0/releases).
4.  **Launch**:
    ```bash
    docker-compose up -d
    ```
5.  **Verify**: Open `http://localhost:2358/health` in your browser.

---

## 2. Frontend Upgrade: Monaco Editor
We will replace the current `textarea` with a professional IDE.

### Step 2.1: Install Dependency
```bash
cd frontend
npm install @monaco-editor/react
```

### Step 2.2: Update `ProblemSolve.jsx`
*   Replace `textarea` with `<Editor />`.
*   Update the `LANGUAGES` array to include Judge0 Language IDs.
*   **Common Language IDs**:
    *   C: 50
    *   C++: 54
    *   Java: 62
    *   Python: 71
    *   Bash (Shell): 46

---

## 3. Backend Upgrade: Judge0 API Integration
We will refactor `backend/index.js` to communicate with the local Docker container.

### Step 3.1: Add Judge0 URL to `.env`
```env
JUDGE0_URL=http://localhost:2358
```

### Step 3.2: Refactor `/api/submissions`
1.  **Prepare Payload**: Encode student code and stdin to Base64.
2.  **Send Request**: Use `axios` or `fetch` to POST to `${process.env.JUDGE0_URL}/submissions?wait=true`.
3.  **Process Verdict**: Map Judge0 status IDs (3: Accepted, 4: Wrong Answer, etc.) to your DB.

---

## 4. Execution Workflow
1.  **Student** writes code in Monaco.
2.  **Frontend** sends request to **Your Backend**.
3.  **Your Backend** acts as a proxy, sending the code to **Local Judge0**.
4.  **Judge0** executes the code and returns the result.
5.  **Your Backend** updates the database and sends the result back to the **Frontend**.
