import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const difficultyConfig = {
  easy: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  hard: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
};

const API_BASE = 'http://localhost:5000';

const StudentArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  
  // Proctoring states
  const [studentLocked, setStudentLocked] = useState(false);
  const [showProctoredWarning, setShowProctoredWarning] = useState(false); // Used for the "Point of No Return" entry
  const [securityActive, setSecurityActive] = useState(false); // true once student is inside proctored contest
  const [violationReason, setViolationReason] = useState('');
  const [needsFullscreen, setNeedsFullscreen] = useState(false);
  const proctoredRef = useRef(false);
  const lockedRef = useRef(false);
  const securityActiveRef = useRef(false);

  useEffect(() => {
    if (!user.id || user.role !== 'student') {
      navigate('/login');
      return;
    }
    fetchArenaData();
  }, [id]);

  const fetchArenaData = async () => {
    try {
      setLoading(true);
      const [contestRes, problemsRes] = await Promise.all([
        fetch(`${API_BASE}/api/contests/${id}`),
        fetch(`${API_BASE}/api/problems/contest/${id}`)
      ]);

      if (!contestRes.ok) { setAccessDenied(true); return; }
      const contestData = await contestRes.json();

      // Security check: verify student is a registered participant
      const participantIds = contestData.participants?.map(p =>
        typeof p === 'object' ? p._id : p
      );
      if (!participantIds?.includes(user.id)) {
        setAccessDenied(true);
        return;
      }

      setContest(contestData);
      if (problemsRes.ok) setProblems(await problemsRes.json());

      // Check if student is already locked by the backend
      if (contestData.isProctored) {
        const lockRes = await fetch(`${API_BASE}/api/contests/${id}/lockstatus/${user.id}`);
        if (lockRes.ok) {
          const lockData = await lockRes.json();
          if (lockData.isLocked) {
            setStudentLocked(true);
            lockedRef.current = true;
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            return;
          }
        }
      }

      // Proctoring Check: Force the "Point of No Return" entry screen first
      if (contestData.isProctored) {
        const isAuth = sessionStorage.getItem(`contest_auth_${id}`);
        if (!isAuth) {
          setShowProctoredWarning(true);
          setIsLocked(false); // Hide password screen if warning is showing
        } else if (!document.fullscreenElement) {
          setNeedsFullscreen(true);
        }
      } else if (contestData.accessKey) {
        // Password Protection Check for non-proctored contests
        const isAuth = sessionStorage.getItem(`contest_auth_${id}`);
        if (!isAuth) setIsLocked(true);
      }
    } catch (error) {
      console.error('Error fetching arena:', error);
    } finally {
      setLoading(false);
    }
  };

  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
  };

  // === Report violation to backend, lock student ===
  const reportViolation = async (type, details) => {
    if (!proctoredRef.current || lockedRef.current || !securityActiveRef.current) return;
    lockedRef.current = true;
    setStudentLocked(true);
    setViolationReason(details);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    try {
      await fetch(`${API_BASE}/api/contests/${id}/violations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id, type, details })
      });
    } catch (e) { console.error('Failed to report violation:', e); }
  };

  // === Activate security once student is inside proctored contest ===
  const activateSecurity = () => {
    proctoredRef.current = true;
    securityActiveRef.current = true;
    setSecurityActive(true);
  };

  const handleVerifyPassword = (e) => {
    e.preventDefault();
    if (passwordInput === contest.accessKey) {
      sessionStorage.setItem(`contest_auth_${id}`, 'true');
      setIsLocked(false);
      setPasswordError(false);
      if (contest.isProctored) {
        enterFullscreen();
        activateSecurity();
      }
    } else {
      setPasswordError(true);
    }
  };

  const handleAcceptProctoredWarning = () => {
    // This is the point of no return. Security starts NOW.
    setShowProctoredWarning(false);
    enterFullscreen();
    setNeedsFullscreen(false);
    activateSecurity();

    // If there's a password, show it now AFTER security is active
    if (contest.accessKey) {
      setIsLocked(true);
    } else {
      sessionStorage.setItem(`contest_auth_${id}`, 'true');
    }
  };

  const handleManualFullscreen = () => {
    enterFullscreen();
    setNeedsFullscreen(false);
    activateSecurity();
  };

  useEffect(() => {
    if (!contest) return;
    const tick = () => {
      const end = new Date(contest.endTime);
      const now = new Date();
      const diff = end - now;
      if (diff <= 0) { setTimeLeft('ENDED'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [contest]);

  // === Security Event Listeners (active after student unlocks a proctored contest) ===
  useEffect(() => {
    if (!securityActive) return;

    // 2-second grace period to avoid false positives from the fullscreen request itself
    const startDelay = setTimeout(() => {

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
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I','i','J','j','C','c'].includes(e.key)) {
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

      // Store cleanup so ProblemSolve page can skip re-registering its own listeners
      window.__proctorCleanup = () => {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('blur', onBlur);
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
        document.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        aiObserver.disconnect();
        clearInterval(devToolsCheck);
      };
    }, 2000);

    return () => {
      clearTimeout(startDelay);
      if (window.__proctorCleanup) { window.__proctorCleanup(); delete window.__proctorCleanup; }
    };
  }, [securityActive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-white/10 border-t-white/60 rounded-full animate-spin mx-auto" />
          <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Initializing Arena...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-400 text-3xl">⊘</span>
          </div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-white/40 text-sm">You are not registered for this contest. Contact your faculty to be invited.</p>
          <button onClick={() => navigate('/student/dashboard')} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Student needs to enter fullscreen (e.g. after refresh)
  if (needsFullscreen) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md p-8 bg-[#0d0d0d] border border-white/5 rounded-3xl">
          <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Fullscreen Required</h1>
          <p className="text-white/40 text-sm">This is a proctored contest. You must be in fullscreen mode to view the problems and participate.</p>
          <button onClick={handleManualFullscreen} className="w-full py-4 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20">
            Enter Fullscreen Mode
          </button>
        </div>
      </div>
    );
  }

  if (studentLocked) {
    return (
      <div className="fixed inset-0 z-[300] bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-red-400 mb-2">Session Locked</h1>
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Proctoring Violation Detected</p>
          </div>
          <p className="text-white/50 text-sm leading-relaxed">
            Your contest session has been locked due to a security violation.<br />
            <span className="text-white/30">Only your faculty can restore your access.</span>
          </p>
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <p className="text-[10px] text-red-400/60 uppercase tracking-widest font-bold">Your session is terminated. Contact your faculty immediately.</p>
          </div>
          <button 
            onClick={() => navigate('/student/dashboard')} 
            className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
      {/* Top Nav */}
      <nav className="flex justify-between items-center px-8 py-4 bg-[#0a0a0a] border-b border-white/5 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (contest.isProctored && !studentLocked) {
                if (window.confirm("WARNING: Exiting the arena will lock your session. You will not be able to re-enter without faculty approval. Exit anyway?")) {
                  reportViolation('EARLY_EXIT', 'Student manually exited the arena.');
                  navigate('/student/dashboard');
                }
              } else {
                navigate('/student/dashboard');
              }
            }} 
            className="text-white/40 hover:text-white transition-colors text-xs"
          >
            ← Exit Arena
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div>
            <h1 className="text-sm font-bold flex items-center gap-2">
              {contest?.title}
              {contest?.isProctored && (
                <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-bold uppercase tracking-widest rounded-full">
                  🔒 Proctored
                </span>
              )}
            </h1>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
              {problems.length} Problems
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-sm font-bold ${
            timeLeft === 'ENDED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
            parseInt(timeLeft) === 0 && parseInt(timeLeft?.split(':')[1]) < 10 ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse' :
            'bg-white/5 border-white/10 text-white'
          }`}>
            <span className="text-[10px] text-white/30 font-sans uppercase tracking-widest not-italic">Time Left</span>
            <span>{timeLeft}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold">
              {user.name?.charAt(0)}
            </div>
            <span className="text-xs text-white/60 font-bold">{user.name}</span>
          </div>
        </div>
      </nav>

      {/* Problem List */}
      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="mb-10">
          <h2 className="text-3xl font-black tracking-tight mb-2">Problem Set</h2>
          <p className="text-white/30 text-xs uppercase tracking-widest font-bold">Select a problem to begin solving</p>
        </div>

        <div className="space-y-3">
          {problems.map((prob, idx) => {
            const diff = difficultyConfig[prob.difficulty] || difficultyConfig.easy;
            return (
              <div
                key={prob._id}
                onClick={() => navigate(`/student/contest/${id}/problem/${prob._id}`)}
                className="group flex items-center justify-between p-6 bg-[#0d0d0d] border border-white/5 rounded-2xl hover:border-purple-500/30 hover:bg-[#111] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-6">
                  <span className="text-white/20 font-mono text-sm font-bold w-6 text-right">{String(idx + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="text-base font-bold group-hover:text-purple-400 transition-colors">{prob.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border ${diff.bg} ${diff.color}`}>
                        {prob.difficulty}
                      </span>
                      {prob.tags?.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[9px] text-white/30 font-bold uppercase tracking-widest">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-black text-white/80">{prob.points}</p>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">pts</p>
                  </div>
                  <div className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                    prob.gradingType === 'automatic' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                  }`}>
                    {prob.gradingType}
                  </div>
                  <svg className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}

          {problems.length === 0 && (
            <div className="p-20 text-center border border-dashed border-white/10 rounded-2xl">
              <p className="text-white/20 text-xs uppercase tracking-widest font-bold">No problems added yet. Check back soon.</p>
            </div>
          )}
        </div>
      </div>

      {/* Proctored Warning Screen (no password needed, but is proctored) */}
      {showProctoredWarning && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#0d0d0d] border border-red-500/20 rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-red-400 mb-2">⚠ LOCKDOWN MODE</h2>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-6 text-red-400/60">Point of No Return</p>
            <p className="text-sm text-white/80 mb-6 leading-relaxed">
              You are about to enter a <span className="text-red-400 font-bold">strictly proctored environment</span>. Once you click the button below:
            </p>
            <ul className="text-left space-y-3 mb-8 text-xs text-white/60 bg-red-500/5 p-5 border border-red-500/10 rounded-2xl">
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> <span className="text-white font-bold">No Re-entry</span>: Refreshing or exiting will lock your session.</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> <span className="text-white font-bold">Fullscreen Lock</span>: Your browser will be locked to this page.</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> <span className="text-white font-bold">Activity Monitor</span>: Tab switching and DevTools are monitored.</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span> You may still copy/paste code within the workspace.</li>
            </ul>
            <button
              onClick={handleAcceptProctoredWarning}
              className="w-full py-4 bg-red-600 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-red-500 transition-all active:scale-95 shadow-xl shadow-red-900/30"
            >
              Start Proctored Session
            </button>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="mt-6 text-[10px] text-white/30 hover:text-white transition-colors uppercase tracking-widest font-bold border-b border-transparent hover:border-white/20"
            >
              Cancel and Return
            </button>
          </div>
        </div>
      )}

      {/* Password Overlay (for contests with accessKey) */}
      {isLocked && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0d0d0d] border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Secure Entry</h2>
            {contest?.isProctored && (
              <p className="text-[9px] text-red-400/70 uppercase tracking-widest font-bold mb-3">⚠ Proctored — Full-Screen will be enforced after entry</p>
            )}
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-8">This arena requires an access key</p>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <input
                type="password"
                placeholder="Enter Access Key"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className={`w-full bg-white/5 border ${passwordError ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-center text-sm focus:outline-none focus:border-blue-500 transition-all`}
                autoFocus
              />
              {passwordError && <p className="text-[8px] text-red-500 font-bold uppercase tracking-widest">Invalid Access Key</p>}
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all active:scale-95"
              >
                {contest?.isProctored ? 'Unlock & Enter Proctored Mode' : 'Unlock Arena'}
              </button>
            </form>
            <button
              onClick={() => {
                if (window.confirm("WARNING: Cancelling now will lock your session as you have already entered the proctored environment. Exit anyway?")) {
                  reportViolation('EARLY_EXIT', 'Student aborted at the password screen.');
                  navigate('/student/dashboard');
                }
              }}
              className="mt-6 text-[9px] text-white/20 hover:text-white transition-colors uppercase tracking-widest font-bold"
            >
              Cancel and Lock Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentArena;
