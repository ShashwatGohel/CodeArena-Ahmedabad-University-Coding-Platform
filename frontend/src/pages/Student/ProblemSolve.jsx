import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from "@monaco-editor/react";
import Terminal from '../../components/Terminal';

const LANGUAGES = [
  { label: 'C', value: 'c', judgeId: 50, monaco: 'c', ext: 'c', starter: '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}' },
  { label: 'C++', value: 'cpp', judgeId: 54, monaco: 'cpp', ext: 'cpp', starter: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}' },
  { label: 'Java', value: 'java', judgeId: 62, monaco: 'java', ext: 'java', starter: 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}' },
  { label: 'Python', value: 'python', judgeId: 71, monaco: 'python', ext: 'py', starter: '# Your code here\n' },
  { label: 'Shell', value: 'bash', judgeId: 46, monaco: 'shell', ext: 'sh', starter: '#!/bin/bash\n# Your code here\n' }
];

const API_BASE = 'http://127.0.0.1:5000';

const ProblemSolve = () => {
  const { id: contestId, problemId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [problem, setProblem] = useState(null);
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [files, setFiles] = useState([
    { name: 'main.' + LANGUAGES[0].ext || 'c', content: LANGUAGES[0].starter }
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [mainFile, setMainFile] = useState(''); // File to execute
  const [activeTab, setActiveTab] = useState('testcases');
  const [editorTab, setEditorTab] = useState('code'); // 'code', 'input', 'output', 'terminal'
  const [terminalResults, setTerminalResults] = useState(null);
  const [customInput, setCustomInput] = useState('');
  const [outputData, setOutputData] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [editorHeight, setEditorHeight] = useState(60); // percentage
  const [leftPaneWidth, setLeftPaneWidth] = useState(45); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [viewingCode, setViewingCode] = useState(null);
  const [viewingFileIndex, setViewingFileIndex] = useState(0);
  const rightPaneRef = useRef(null);
  const mainContainerRef = useRef(null);
  const codeRef = useRef(null);

  // Proctoring state
  const [isProctored, setIsProctored] = useState(false);
  const [studentLocked, setStudentLocked] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [needsFullscreen, setNeedsFullscreen] = useState(false);
  const proctoredRef = useRef(false);
  const lockedRef = useRef(false);

  useEffect(() => {
    if (!user.id || user.role !== 'student') { navigate('/login'); return; }
    fetchData();
  }, [contestId, problemId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contestRes, problemRes] = await Promise.all([
        fetch(`${API_BASE}/api/contests/${contestId}`),
        fetch(`${API_BASE}/api/problems/${problemId}`)
      ]);

      if (!contestRes.ok) { setAccessDenied(true); return; }
      const contestData = await contestRes.json();

      // Security: verify participant
      const participantIds = contestData.participants?.map(p => typeof p === 'object' ? p._id : p);
      if (!participantIds?.includes(user.id)) { setAccessDenied(true); return; }

      setContest(contestData);
      if (problemRes.ok) setProblem(await problemRes.json());

      // Check proctoring
      if (contestData.isProctored) {
        setIsProctored(true);
        proctoredRef.current = true;
        // Check if already locked
        const lockRes = await fetch(`${API_BASE}/api/contests/${contestId}/lockstatus/${user.id}`);
        if (lockRes.ok) {
          const lockData = await lockRes.json();
          if (lockData.isLocked) {
            setStudentLocked(true);
            lockedRef.current = true;
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          } else if (!document.fullscreenElement) {
            setNeedsFullscreen(true);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
    fetchSubmissions();
  };

  useEffect(() => {
    if (!contest) return;
    const tick = () => {
      const diff = new Date(contest.endTime) - new Date();
      if (diff <= 0) { setTimeLeft('ENDED'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [contest]);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/submissions/student/${user.id}/problem/${problemId}`);
      if (res.ok) setSubmissions(await res.json());
    } catch (e) { console.error(e); }
  };

  // === PROCTORING: Report violation and lock student ===
  const reportViolation = async (type, details) => {
    if (!proctoredRef.current || lockedRef.current) return;
    lockedRef.current = true;
    setStudentLocked(true);
    setViolationMessage(details);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    try {
      await fetch(`${API_BASE}/api/contests/${contestId}/violations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id, type, details })
      });
    } catch (e) { console.error('Failed to report violation:', e); }
  };

  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  };

  const handleManualFullscreen = () => {
    enterFullscreen();
    setNeedsFullscreen(false);
  };

  // === PROCTORING: All security event listeners ===
  // These listeners are registered here if the student navigated DIRECTLY to this problem
  // (bypassing StudentArena). If StudentArena already registered them, we skip.
  useEffect(() => {
    if (!isProctored) return;

    // If StudentArena already set up listeners, skip (they stay active across SPA navigation)
    if (window.__proctorCleanup) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        reportViolation('TAB_SWITCH', 'Student switched to another tab or minimized the window.');
      }
    };
    const onBlur = () => {
      reportViolation('ALT_TAB', 'Browser window lost focus (possible Alt-Tab or external application).');
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        reportViolation('FULLSCREEN_EXIT', 'Student exited fullscreen mode.');
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'F12') { e.preventDefault(); reportViolation('KEYBOARD_SHORTCUT', 'F12 (DevTools) shortcut detected.'); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        reportViolation('INSPECT_MODE', `Ctrl+Shift+${e.key} (DevTools/Inspect) shortcut detected.`);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        reportViolation('INSPECT_MODE', 'Ctrl+U (View Source) shortcut detected.');
      }
    };

    // AI Extension Detection (Sider, Monica, etc.)
    const aiObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) { // Element
            const id = (node.id || '').toLowerCase();
            const cls = (node.className || '').toString().toLowerCase();
            if (id.includes('sider') || id.includes('monica') || cls.includes('sider') || cls.includes('monica') || id.includes('ai-sidebar')) {
              reportViolation('AI_EXTENSION_DETECTED', `Suspicious AI extension element detected: ${id || cls}`);
            }
          }
        }
      }
    });
    aiObserver.observe(document.body, { childList: true, subtree: true });

    const devToolsCheck = setInterval(() => {
      if ((window.outerWidth - window.innerWidth) > 160 || (window.outerHeight - window.innerHeight) > 160) {
        reportViolation('DEVTOOLS_OPEN', 'DevTools panel detected to be open.');
      }
    }, 1500);

    const handleBeforeUnload = (e) => {
      if (!lockedRef.current) {
        reportViolation('EARLY_EXIT', 'Student attempted to close or reload the page.');
        e.preventDefault();
        e.returnValue = '';
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      aiObserver.disconnect();
      clearInterval(devToolsCheck);
    };
  }, [isProctored]);


  const handleMouseDown = () => setIsDragging(true);
  const handleLeftMouseDown = () => setIsDraggingLeft(true);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && rightPaneRef.current) {
        const rect = rightPaneRef.current.getBoundingClientRect();
        const pct = ((e.clientY - rect.top) / rect.height) * 100;
        setEditorHeight(Math.max(20, Math.min(80, pct)));
      }
      
      if (isDraggingLeft && mainContainerRef.current) {
        const rect = mainContainerRef.current.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setLeftPaneWidth(Math.max(25, Math.min(70, pct)));
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsDraggingLeft(false);
    };
    if (isDragging || isDraggingLeft) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isDraggingLeft]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    const fileName = lang.value === 'java' ? 'Solution.java' : `solution.${lang.ext}`;
    setFiles([{ name: fileName, content: lang.starter }]);
    setMainFile(fileName);
    setActiveFileIndex(0);
    setCode(lang.starter);
  };
 
  const addFile = () => {
    const name = prompt('Enter file name (e.g. utils.py):');
    if (name && !files.find(f => f.name === name)) {
      setFiles([...files, { name, content: '' }]);
      setActiveFileIndex(files.length);
    }
  };

  const deleteFile = (index) => {
    if (files.length === 1) return;
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    setActiveFileIndex(Math.max(0, activeFileIndex - 1));
  };

  const pollJobStatus = async (jobId) => {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/submissions/status/${jobId}`);
          if (!res.ok) {
            reject(new Error('Failed to fetch job status'));
            return;
          }
          const data = await res.json();
          if (data.state === 'completed') {
            resolve(data.result.results);
          } else if (data.state === 'failed') {
            reject(new Error('Execution failed in worker'));
          } else {
            setTimeout(poll, 1000); // Poll every second
          }
        } catch (e) {
          reject(e);
        }
      };
      poll();
    });
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setSubmitting(true);
    setActiveTab('results');
    setResults(null);
    try {
      const mainFileContent = files.find(f => f.name === mainFile)?.content || files[0]?.content || '';
      const res = await fetch(`${API_BASE}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          problemId,
          contestId,
          files,
          code: mainFileContent,
          mainFile: mainFile || (files[0] ? files[0].name : ''),
          language: language.value,
          customInput: customInput
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Poll for results
        const results = await pollJobStatus(data.jobId);
        setResults(results);
        setOutputData(results.outputFile || ''); 
        if (results.outputFile) setEditorTab('output');
        fetchSubmissions(); // refresh history
      } else {
        setResults({ error: data.message });
      }
    } catch (e) {
      setResults({ error: e.message || 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkFinal = async (subId) => {
    try {
      const res = await fetch(`${API_BASE}/api/submissions/${subId}/final`, { method: 'PUT' });
      if (res.ok) fetchSubmissions();
    } catch (e) { console.error(e); }
  };

  const handleRun = async () => {
    if (files.length === 0) return;
    setRunning(true);
    setActiveTab('results');
    setResults(null);
    try {
      const mainFileContent = files.find(f => f.name === mainFile)?.content || files[0]?.content || '';
      const res = await fetch(`${API_BASE}/api/submissions/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          problemId, 
          files, 
          code: mainFileContent,
          mainFile: mainFile || (files[0] ? files[0].name : ''),
          language: language.value, 
          customInput,
          contestId,
          studentId: user.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Poll for results
        const results = await pollJobStatus(data.jobId);
        setResults({ ...results, isRun: true });
        setOutputData(results.outputFile || '');
        if (results.outputFile) setEditorTab('output');
      } else {
        setResults({ error: data.message });
      }
    } catch (e) {
      setResults({ error: e.message || 'Network error. Please try again.' });
    } finally {
      setRunning(false);
    }
  };

  const handleTerminalCommand = async (command) => {
    try {
      const res = await fetch(`${API_BASE}/api/submissions/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          problemId, 
          files, 
          language: language.value, 
          contestId,
          studentId: user.id,
          type: 'terminal',
          command
        })
      });
      const data = await res.json();
      if (res.ok) {
        const results = await pollJobStatus(data.jobId);
        setTerminalResults(results);
      } else {
        setTerminalResults({ error: data.message });
      }
    } catch (e) {
      setTerminalResults({ error: e.message });
    }
  };

  // Handle Tab key in textarea
  const handleCodeKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        codeRef.current.selectionStart = codeRef.current.selectionEnd = start + 2;
      }, 0);
    }
  };

  const diffConfig = {
    easy: { label: 'Easy', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    hard: { label: 'Hard', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto" />
          <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Loading Problem...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold text-red-400">Access Denied</p>
          <p className="text-white/40 text-sm">You are not invited to this contest.</p>
          <button onClick={() => navigate('/student/dashboard')} className="px-6 py-3 bg-white/5 rounded-xl text-xs font-bold uppercase tracking-widest">Return</button>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-white/40">Problem not found.</p>
      </div>
    );
  }

  const diff = diffConfig[problem.difficulty] || diffConfig.easy;
  const sampleCases = problem.testCases?.filter(tc => tc.isSample) || [];

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden selection:bg-purple-500/30">
      {/* Top Bar */}
      <nav className="flex-none flex justify-between items-center px-6 py-3 bg-[#0a0a0a] border-b border-white/5 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/student/contest/${contestId}/arena`)}
            className="text-white/30 hover:text-white transition-colors text-xs font-bold"
          >
            ← Problem List
          </button>
          <div className="h-3 w-px bg-white/10" />
          <span className="text-xs text-white/50 font-bold">{contest?.title}</span>
        </div>
        <div className={`font-mono text-sm font-bold px-4 py-1.5 rounded-lg border ${timeLeft === 'ENDED' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/10 text-white'
          }`}>
          {timeLeft}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold">
            {user.name?.charAt(0)}
          </div>
          <span className="text-xs text-white/50 font-bold">{user.name}</span>
        </div>
      </nav>

      {/* Main split pane */}
      <div ref={mainContainerRef} className="flex-1 flex overflow-hidden">
 
        {/* ===== LEFT PANE: Problem Description ===== */}
        <div 
          className="flex flex-col border-r border-white/5 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{ width: `${leftPaneWidth}%` }}
        >
          <div className="p-8 space-y-7">
            {/* Title & Meta */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-lg border ${diff.bg} ${diff.color}`}>
                  {diff.label}
                </span>
                <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-lg bg-white/5 border border-white/10 text-white/40">
                  {problem.points} pts
                </span>
                <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-lg ${problem.gradingType === 'automatic' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                  }`}>
                  {problem.gradingType}
                </span>
              </div>
              <h1 className="text-2xl font-black">{problem.title}</h1>
              {problem.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {problem.tags.map((tag, i) => (
                    <span key={i} className="text-[9px] text-white/30 font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-3">Problem Statement</h3>
              <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap bg-white/[0.02] border border-white/5 rounded-xl p-5">
                {problem.description}
              </div>
            </div>

            {/* Sample Test Cases */}
            {sampleCases.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/30">Sample Test Cases</h3>
                {sampleCases.map((tc, i) => (
                  <div key={i} className="bg-[#0d0d0d] border border-white/5 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-white/[0.02] border-b border-white/5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Example {i + 1}</span>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-2">Input</p>
                        <pre className="font-mono text-xs text-white/70 bg-black/30 px-3 py-2 rounded-lg whitespace-pre-wrap">{tc.input}</pre>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-2">Output</p>
                        <pre className="font-mono text-xs text-white/70 bg-black/30 px-3 py-2 rounded-lg whitespace-pre-wrap">{tc.output}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vertical Resize Handle */}
        <div
          onMouseDown={handleLeftMouseDown}
          className={`w-1 cursor-col-resize flex items-center justify-center transition-colors z-50 ${isDraggingLeft ? 'bg-purple-500/30' : 'hover:bg-purple-500/10'}`}
        >
          <div className="h-8 w-0.5 bg-white/10 rounded-full" />
        </div>

        {/* ===== RIGHT PANE ===== */}
        <div ref={rightPaneRef} className="flex-1 flex flex-col overflow-hidden">

          {/* Code Editor Top Bar */}
          <div className="flex-none flex items-center justify-between px-4 py-2.5 bg-[#0d0d0d] border-b border-white/5">
            <div className="flex items-center gap-6">
              <div className="flex gap-1">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.value}
                    onClick={() => handleLanguageChange(lang)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${language.value === lang.value
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'text-white/30 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              
              {/* Secondary Tabs */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                <button 
                  onClick={() => setEditorTab('code')}
                  className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${editorTab === 'code' ? 'bg-white/10 text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}
                >
                  Editor
                </button>
                <button 
                  onClick={() => setEditorTab('input')}
                  className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${editorTab === 'input' ? 'bg-white/10 text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}
                >
                  Input.txt
                </button>
                <button 
                  onClick={() => setEditorTab('terminal')}
                  className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${editorTab === 'terminal' ? 'bg-purple-500/20 text-purple-400 shadow-lg' : 'text-white/20 hover:text-white/40'}`}
                >
                  Terminal
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Run Button */}
              <button
                onClick={handleRun}
                disabled={running || submitting}
                className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${running || submitting
                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white active:scale-[0.97]'
                  }`}
              >
                {running ? (
                  <>
                    <span className="w-3 h-3 border border-white/30 border-t-white/60 rounded-full animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Run
                  </>
                )}
              </button>
              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || running}
                className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${submitting || running
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 active:scale-[0.97]'
                  }`}
              >
                {submitting ? (
                  <>
                    <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Workspace Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* FILE EXPLORER SIDEBAR */}
            {editorTab === 'code' && (
              <div className="w-56 flex-none bg-[#0a0a0a] border-r border-white/5 flex flex-col">
                <div className="p-4 flex items-center justify-between border-b border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Explorer</span>
                  {language.value === 'bash' && (
                    <button onClick={addFile} className="w-5 h-5 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white/40">+</button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                  {files.map((file, idx) => (
                    <div 
                      key={idx}
                      className={`group px-4 py-2 flex items-center justify-between cursor-pointer transition-colors ${activeFileIndex === idx ? 'bg-purple-500/10' : 'hover:bg-white/5'}`}
                      onClick={() => setActiveFileIndex(idx)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-xs ${activeFileIndex === idx ? 'text-purple-400' : 'text-white/40'}`}>
                          {file.name.endsWith('.py') ? '🐍' : file.name.endsWith('.sh') ? '🐚' : file.name.endsWith('.java') ? '☕' : '📄'}
                        </span>
                        <span className={`text-[11px] truncate ${activeFileIndex === idx ? 'text-white' : 'text-white/50'}`}>
                          {file.name}
                        </span>
                        {mainFile === file.name && (
                          <span className="flex-none w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" title="Entry Point" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setMainFile(file.name); }}
                          className={`p-1 rounded hover:bg-white/10 ${mainFile === file.name ? 'text-purple-400' : 'text-white/20'}`}
                          title="Set as Entry Point"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </button>
                        {files.length > 1 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteFile(idx); }}
                            className="p-1 rounded hover:bg-red-500/20 text-white/20 hover:text-red-400"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-white/5 bg-black/20">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-white/20 mb-2">Active Entry Point</p>
                  <p className="text-[10px] font-mono text-purple-400 truncate">{mainFile || 'None'}</p>
                </div>
              </div>
            )}

            {/* MAIN EDITOR / CONTENT */}
            <div className="flex-1 relative flex flex-col overflow-hidden" style={{ height: `100%` }}>
              <div className="flex-1 relative">
                {editorTab === 'code' ? (
                  <Editor
                    height="100%"
                    language={language.monaco}
                    theme="vs-dark"
                    value={files[activeFileIndex]?.content || ''}
                    onChange={(value) => {
                      const newFiles = [...files];
                      newFiles[activeFileIndex].content = value || '';
                      setFiles(newFiles);
                      // Sync 'code' state if it's the main entry file
                      if (newFiles[activeFileIndex].name === mainFile) {
                        setCode(value || '');
                      }
                    }}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 20 },
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      cursorSmoothCaretAnimation: "on",
                      smoothScrolling: true,
                      contextmenu: false,
                    }}
                  />
                ) : editorTab === 'terminal' ? (
                  <Terminal onCommand={handleTerminalCommand} results={terminalResults} />
                ) : editorTab === 'input' ? (
                  <textarea
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    spellCheck={false}
                    className="w-full h-full bg-[#080808] text-[13px] font-mono text-emerald-400/80 p-6 resize-none focus:outline-none leading-relaxed"
                    placeholder="# Enter the content of input.txt here..."
                  />
                ) : (
                  <div className="w-full h-full bg-[#050505] p-6 overflow-auto font-mono text-[13px] text-blue-400/80 leading-relaxed">
                    <pre className="whitespace-pre-wrap">{outputData}</pre>
                  </div>
                )}
                
                <div className="absolute top-4 right-4 text-[8px] font-bold uppercase tracking-widest text-white/10 pointer-events-none z-10">
                  {editorTab === 'code' ? `Editing: ${files[activeFileIndex]?.name}` : editorTab.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Resizable Drag Handle */}
          <div
            onMouseDown={handleMouseDown}
            className={`h-1.5 cursor-row-resize flex items-center justify-center transition-colors ${isDragging ? 'bg-purple-500/30' : 'bg-white/5 hover:bg-white/10'
              }`}
          >
            <div className="w-8 h-0.5 bg-white/20 rounded-full" />
          </div>

          {/* Terminal / Results Bottom */}
          <div className="flex flex-col" style={{ height: `${100 - editorHeight}%` }}>
            <div className="flex-none flex items-center gap-1 px-4 py-2 bg-[#0a0a0a] border-b border-white/5">
              <button
                onClick={() => setActiveTab('testcases')}
                className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-colors ${activeTab === 'testcases' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'
                  }`}
              >
                Test Cases
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-colors flex items-center gap-1.5 ${activeTab === 'results' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'
                  }`}
              >
                Results
                {results && (
                  <span className={`w-1.5 h-1.5 rounded-full ${results.status === 'Accepted' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                )}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-colors flex items-center gap-1.5 ${activeTab === 'history' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'
                  }`}
              >
                History
                {submissions.length > 0 && (
                  <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded-full text-white/40">{submissions.length}</span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10">
              {activeTab === 'testcases' && (
                <div className="space-y-3">
                  {sampleCases.length > 0 ? sampleCases.map((tc, i) => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                      <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                        <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest mb-1">Input {i + 1}</p>
                        <pre className="font-mono text-[11px] text-white/60 whitespace-pre-wrap">{tc.input}</pre>
                      </div>
                      <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                        <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest mb-1">Expected Output</p>
                        <pre className="font-mono text-[11px] text-white/60 whitespace-pre-wrap">{tc.output}</pre>
                      </div>
                    </div>
                  )) : (
                    <p className="text-white/20 text-[11px] font-bold uppercase tracking-widest text-center py-4">No sample test cases available</p>
                  )}
                </div>
              )}

              {activeTab === 'results' && (
                <div className="space-y-4">
                  {(submitting || running) && (
                    <div className="flex items-center gap-3 text-white/40">
                      <span className="w-4 h-4 border border-white/20 border-t-purple-500 rounded-full animate-spin" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">
                        {running ? 'Running sample cases...' : 'Evaluating submission...'}
                      </span>
                    </div>
                  )}

                  {results && !results.error && (
                    <>
                      {/* Overall Status */}
                      <div className={`flex items-center justify-between p-4 rounded-xl border ${results.status === 'Accepted'
                          ? 'bg-emerald-500/10 border-emerald-500/20'
                          : 'bg-red-500/10 border-red-500/20'
                        }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{results.status === 'Accepted' ? '✓' : '✗'}</span>
                          <div>
                            <p className={`text-sm font-black ${results.status === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {results.status}
                            </p>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                              {results.executionTime}ms • {results.memoryUsed}MB • {results.points?.toFixed(1) || 0} pts
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Raw Console Output */}
                      {results.stdout && (
                        <div className="bg-[#050505] border border-white/5 rounded-xl overflow-hidden">
                          <div className="px-4 py-2 bg-white/5 flex items-center justify-between">
                            <span className="text-[8px] text-white/30 font-bold uppercase tracking-widest">Console Output</span>
                            <span className="text-[7px] text-white/20 font-mono">STDOUT</span>
                          </div>
                          <pre className="p-4 font-mono text-[11px] text-emerald-400/80 whitespace-pre-wrap max-h-[150px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10">{results.stdout}</pre>
                        </div>
                      )}

                      {/* Compilation Error Output */}
                      {results.compile_output && (
                        <div className="bg-[#050505] border border-red-500/20 rounded-xl overflow-hidden">
                          <div className="px-4 py-2 bg-red-500/10 flex items-center justify-between">
                            <span className="text-[8px] text-red-400/80 font-bold uppercase tracking-widest">Compilation Error</span>
                            <span className="text-[7px] text-red-400/50 font-mono">COMPILE_OUTPUT</span>
                          </div>
                          <pre className="p-4 font-mono text-[11px] text-red-400/80 whitespace-pre-wrap max-h-[150px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10">{results.compile_output}</pre>
                        </div>
                      )}

                      {/* Runtime Error Output */}
                      {results.stderr && (
                        <div className="bg-[#050505] border border-red-500/20 rounded-xl overflow-hidden">
                          <div className="px-4 py-2 bg-red-500/10 flex items-center justify-between">
                            <span className="text-[8px] text-red-400/80 font-bold uppercase tracking-widest">Runtime Error</span>
                            <span className="text-[7px] text-red-400/50 font-mono">STDERR</span>
                          </div>
                          <pre className="p-4 font-mono text-[11px] text-red-400/80 whitespace-pre-wrap max-h-[150px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10">{results.stderr}</pre>
                        </div>
                      )}

                      {/* Sample Case Results */}
                      {results.sampleCases?.length > 0 && (
                        <div>
                          <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-2">Sample Cases</p>
                          <div className="space-y-2">
                            {results.sampleCases.map((tc, i) => (
                              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${tc.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
                                }`}>
                                <span className={`text-xs font-bold mt-0.5 ${tc.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {tc.passed ? '✓' : '✗'}
                                </span>
                                <div className="flex-1 space-y-1 min-w-0">
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold mb-0.5">Input</p>
                                      <pre className="font-mono text-[10px] text-white/50 truncate bg-black/40 px-1.5 py-0.5 rounded">{tc.input || '(none)'}</pre>
                                    </div>
                                    <div>
                                      <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold mb-0.5">Expected</p>
                                      <pre className="font-mono text-[10px] text-white/50 truncate bg-black/40 px-1.5 py-0.5 rounded">{tc.expectedOutput}</pre>
                                    </div>
                                    <div>
                                      <p className={`text-[8px] uppercase tracking-widest font-bold mb-0.5 ${tc.passed ? 'text-white/20' : 'text-red-400/50'}`}>Actual</p>
                                      <pre className={`font-mono text-[10px] truncate px-1.5 py-0.5 rounded ${tc.passed ? 'text-white/50 bg-black/40' : 'text-red-400 bg-red-400/10'}`}>{tc.actualOutput || '(no output)'}</pre>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hidden Test Cases Summary */}
                      {results.hidden?.total > 0 && (
                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                          <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-1">Hidden Test Cases</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${results.hidden.passed === results.hidden.total ? 'bg-emerald-500' : 'bg-red-500'}`}
                                style={{ width: `${(results.hidden.passed / results.hidden.total) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-white/50">
                              {results.hidden.passed}/{results.hidden.total} passed
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {results?.error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-red-400 text-xs font-bold">{results.error}</p>
                    </div>
                  )}

                  {!results && !submitting && !running && (
                    <p className="text-white/20 text-[11px] font-bold uppercase tracking-widest text-center py-4">
                      Press <span className="text-white/40">Run</span> to test against sample cases, or <span className="text-white/40">Submit</span> to record your solution.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-2">
                  {problem?.gradingType === 'manual' && submissions.length > 0 && (
                    <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg mb-3">
                      <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">
                        Manual Grading — Select your final submission below
                      </p>
                    </div>
                  )}
                  {submissions.length > 0 ? submissions.map((sub, i) => (
                    <div
                      key={sub._id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${sub.isFinal ? 'border-purple-500/40 bg-purple-500/5' :
                          sub.status === 'Accepted' ? 'border-emerald-500/20' : 'border-red-500/20'
                        }`}
                    >
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewingCode(sub)}>
                        <span className="text-[10px] font-mono text-white/20">#{submissions.length - i}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${sub.status === 'Accepted' ? 'text-emerald-400' : 'text-red-400'
                              }`}>{sub.status}</span>
                            {sub.isFinal && (
                              <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Final</span>
                            )}
                            {problem?.gradingType === 'automatic' && (sub.points > 0 || sub.status === 'Accepted') && (
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${sub.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                {(sub.points || 0).toFixed(1)} pts
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-white/20 font-bold">{sub.language} • {sub.executionTime}ms</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {problem?.gradingType === 'manual' && (
                          sub.isFinal ? (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-[8px] font-bold uppercase tracking-widest rounded-md">✓ Final</span>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkFinal(sub._id); }}
                              className="px-2 py-1 bg-purple-500/10 text-purple-400 text-[8px] font-bold uppercase tracking-widest rounded-md hover:bg-purple-500/20 transition-colors"
                            >Mark Final</button>
                          )
                        )}
                        <span className="text-[9px] text-white/20 font-bold">{new Date(sub.submittedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-white/20 text-[11px] font-bold uppercase tracking-widest text-center py-4">No submissions yet</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer Modal */}
      {viewingCode && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="w-full max-w-3xl bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
              <div>
                <p className="text-xs font-bold">Submission #{submissions.length - submissions.findIndex(s => s._id === viewingCode._id)}</p>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                  {viewingCode.language} • <span className={viewingCode.status === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}>{viewingCode.status}</span> • {new Date(viewingCode.submittedAt).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setViewingCode(null)} className="text-white/20 hover:text-white text-xl">×</button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex gap-1 px-4 py-2 bg-black/40 border-b border-white/5 overflow-x-auto [&::-webkit-scrollbar]:h-0">
                {(viewingCode.files?.length > 0 ? viewingCode.files : [{name: 'solution.' + viewingCode.language, content: viewingCode.code}]).map((f, i) => (
                  <button 
                    key={i} 
                    onClick={() => setViewingFileIndex(i)}
                    className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${viewingFileIndex === i ? 'bg-white/10 text-white' : 'text-white/20'}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
              <pre className="flex-1 overflow-auto p-6 font-mono text-[12px] text-white/80 leading-relaxed bg-[#080808] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10">
                {(viewingCode.files?.length > 0 ? viewingCode.files[viewingFileIndex]?.content : viewingCode.code)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* === PROCTORING: Fullscreen Required Overlay === */}
      {needsFullscreen && (
        <div className="fixed inset-0 z-[250] bg-black flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-md p-8 bg-[#0d0d0d] border border-white/5 rounded-3xl">
            <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Fullscreen Required</h1>
            <p className="text-white/40 text-sm">You must be in fullscreen mode to continue working on this problem.</p>
            <button onClick={handleManualFullscreen} className="w-full py-4 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20">
              Enter Fullscreen Mode
            </button>
          </div>
        </div>
      )}

      {/* === PROCTORING: Locked Out Overlay === */}
      {studentLocked && (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-8" style={{ backdropFilter: 'blur(20px)' }}>
          <div className="text-center space-y-6 max-w-lg">
            <div className="w-28 h-28 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-14 h-14 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-red-400/60 uppercase tracking-[0.4em] font-bold mb-2">Proctoring Violation</p>
              <h1 className="text-3xl font-black text-white mb-3">Session Locked</h1>
              <p className="text-white/40 text-sm leading-relaxed">
                A security violation was detected and your session has been permanently locked.
              </p>
            </div>
            {violationMessage && (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-left">
                <p className="text-[8px] text-red-400/50 uppercase tracking-widest font-bold mb-1">Violation Reason</p>
                <p className="text-xs text-red-400/80">{violationMessage}</p>
              </div>
            )}
            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                Contact your faculty to regain access.<br />
                <span className="text-white/20">Your session is terminated until unlocked.</span>
              </p>
            </div>
            <button 
              onClick={() => navigate('/student/dashboard')} 
              className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemSolve;
