import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';

const MacWindow = ({ children, title = "code-arena -- terminal" }) => (
  <div className="w-full max-w-4xl mx-auto glass-dark rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/5 animate-fade-in-up">
    <div className="h-10 bg-white/[0.03] flex items-center px-5 justify-between border-b border-white/5 backdrop-blur-md">
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_10px_rgba(255,95,86,0.3)]" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_10px_rgba(255,189,46,0.3)]" />
        <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_10px_rgba(39,201,63,0.3)]" />
      </div>
      <div className="text-[9px] text-white/30 font-black tracking-[0.3em] uppercase">{title}</div>
      <div className="w-12" />
    </div>
    <div className="p-8 bg-black/60">{children}</div>
  </div>
);

const ProtectedRoute = ({ children, roleRequired }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return <Navigate to="/login" replace />;
  if (roleRequired && user.role !== roleRequired) return <Navigate to="/" replace />;
  return children;
};

const SecretKeyModal = ({ isOpen, onClose, onConfirm, title = "Authorize Access" }) => {
  const [key, setKey] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-fade-in">
      <div className="w-full max-w-sm glass-card p-10 rounded-[1.5rem] border border-white/10 animate-fade-in-up shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
        <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 mx-auto mb-6 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-400">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h3 className="text-lg font-bold mb-1 text-center tracking-tight uppercase text-white/90">Authorized Entry</h3>
        <p className="text-white/30 text-[8px] text-center mb-8 uppercase tracking-[0.2em] font-black">Room Key Required</p>
        <input 
          type="password" 
          autoFocus
          placeholder="••••••••" 
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-white text-center text-lg focus:outline-none focus:border-blue-500/50 mb-8 transition-all font-mono tracking-widest selection:bg-blue-600/30"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <div className="flex gap-3">
          <button onClick={() => onConfirm(key)} className="flex-1 bg-blue-600 font-black py-4 rounded-xl hover:bg-blue-500 transition-all shadow-lg text-[9px] uppercase tracking-[0.2em] active:scale-95">Unlock</button>
          <button onClick={onClose} className="px-5 glass-button text-white/30 font-black py-4 rounded-xl hover:text-white transition-all uppercase text-[9px] tracking-[0.2em]">Cancel</button>
        </div>
      </div>
    </div>
  );
};

const EvaluateModal = ({ isOpen, participant, onClose, onSave }) => {
  const [score, setScore] = useState(participant?.manualScore || 0);
  const [feedback, setFeedback] = useState(participant?.feedback || '');
  if (!isOpen || !participant) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-fade-in">
      <div className="w-full max-w-6xl glass-card rounded-[2rem] border border-white/10 animate-fade-in-up flex h-[75vh] overflow-hidden shadow-[0_100px_200px_rgba(0,0,0,0.9)]">
        <div className="flex-1 p-10 bg-black/40 border-r border-white/5 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="text-blue-400 text-[9px] font-black tracking-[0.3em] uppercase mb-1">Technical Review</div>
              <h3 className="text-xl font-bold text-white tracking-tight uppercase">{participant.username}</h3>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-white/20 font-black uppercase tracking-widest block mb-0.5">Engine Score</span>
              <span className="text-2xl font-mono text-blue-400 font-bold">{participant.autoScore}<span className="text-white/10 text-sm ml-1">/ 100</span></span>
            </div>
          </div>
          <div className="flex-1 bg-black/60 rounded-xl border border-white/5 p-8 font-mono text-[11px] overflow-auto leading-relaxed text-blue-100/40 whitespace-pre-wrap custom-scrollbar selection:bg-blue-600/30">
            {participant.submissionCode || "// No data received."}
          </div>
        </div>
        <div className="w-80 p-10 bg-white/[0.01] flex flex-col justify-between">
          <div className="space-y-8">
            <div>
              <label className="block text-[9px] font-black text-white/20 uppercase mb-3 tracking-[0.2em]">Marks</label>
              <input type="number" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-white text-xl focus:border-blue-500/50 outline-none transition-all font-mono" value={score} onChange={e => setScore(e.target.value)} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-white/20 uppercase mb-3 tracking-[0.2em]">Feedback</label>
              <textarea rows="8" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-blue-500/50 outline-none text-[13px] leading-relaxed transition-all resize-none custom-scrollbar" placeholder="Analysis..." value={feedback} onChange={e => setFeedback(e.target.value)} />
            </div>
          </div>
          <div className="space-y-3 pt-8 border-t border-white/5">
            <button onClick={() => onSave(participant._id, score, feedback)} className="w-full bg-blue-600 py-4 rounded-xl font-black uppercase tracking-[0.3em] hover:bg-blue-500 transition-all shadow-xl text-[9px] active:scale-95">Publish</button>
            <button onClick={onClose} className="w-full glass-button py-3.5 rounded-xl font-black text-white/20 hover:text-white transition-all text-[9px] uppercase tracking-[0.3em]">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Navbar = () => {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    setUser(savedUser);
  }, [location]);

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-[1500px] mx-auto px-8 h-12 flex items-center justify-between">
        <Link to={user ? (user.role === 'faculty' ? '/admin' : '/dashboard') : '/'} className="flex items-center gap-3 group">
          <div className="w-7 h-7 bg-blue-600/10 rounded-lg flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-600/30 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-400">
              <polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight uppercase text-white/80">CodeArena</span>
        </Link>
        <div className="flex items-center gap-8">
          <Link to="/leaderboard" className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white transition-all">Leaderboard</Link>
          {user ? (
            <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="px-4 py-1.5 bg-red-500/5 text-red-400 border border-red-500/20 rounded-full text-[8px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all">Logout</button>
          ) : (
            <Link to="/login"><button className="bg-white text-black px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-lg">Start Link</button></Link>
          )}
        </div>
      </div>
    </nav>
  );
};

const Home = () => {
  return (
    <main className="h-screen w-screen overflow-hidden relative flex flex-col justify-center items-center text-center px-8 bg-[#020202]">
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-600/[0.05] rounded-full blur-[120px] animate-pulse" />
      <div className="max-w-7xl mx-auto mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-white/[0.02] border border-white/5 text-blue-400 text-[9px] font-black tracking-[0.3em] uppercase animate-fade-in-up">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
          Ahmedabad University Enterprise
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter animate-fade-in-up leading-[1.1] uppercase">
          Build for <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">Pure Innovation.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-base text-white/30 mb-10 leading-relaxed animate-fade-in-up delay-100 font-medium">
          The unified high-fidelity simulation ecosystem for AU's engineering talent. <br />
          Architect. Code. Conquer.
        </p>
        
        <div className="flex justify-center gap-6 animate-fade-in-up delay-200">
          <Link to="/signup"><button className="bg-blue-600 px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-blue-500 transition-all shadow-2xl active:scale-95">Enter Mesh</button></Link>
          <Link to="/login"><button className="glass-button px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition-all active:scale-95 text-white/20 border border-white/5">Login</button></Link>
        </div>
      </div>

      <div className="w-full max-w-5xl relative animate-fade-in-up delay-300 perspective-2000 mb-[-50px]">
        <MacWindow title="code-arena // internal-mesh">
          <div className="font-mono text-[13px] space-y-4 pr-16 text-white/40 text-left leading-relaxed">
            <div className="flex gap-3"><span className="text-green-500 font-black">➜</span><span className="text-blue-500 font-bold uppercase tracking-widest text-[9px]">~/arena-control</span><span className="text-yellow-400">./initialize.sh</span></div>
            <p className="text-white/10 font-black tracking-widest uppercase text-[9px]">● establishing AU secure mesh handshake...</p>
            <div className="flex gap-3"><p className="text-cyan-500 font-black">[AUTH]</p><p className="italic">Key recognized. Deploying local simulation nodes...</p></div>
            <p className="text-blue-400 font-bold uppercase text-[9px] tracking-widest">● Mesh Synchronized. System Ready.</p>
            <div className="flex gap-2 pt-1"><span className="w-1.5 h-4 bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.8)]" /></div>
          </div>
        </MacWindow>
      </div>
    </main>
  );
};

const ArenaDashboard = () => {
  const [contests, setContests] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [modalData, setModalData] = useState({ isOpen: false, contestId: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/contests').then(res => res.json()).then(data => setContests(data));
  }, []);

  const handleJoinAttempt = (id) => {
    setModalData({ isOpen: true, contestId: id });
  };

  const handleConfirmKey = async (key) => {
    const res = await fetch(`http://localhost:5000/api/contests/${modalData.contestId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, username: user.username, password: key })
    });
    if (res.ok) {
      localStorage.setItem(`contest_auth_${modalData.contestId}`, 'true');
      navigate(`/contest/${modalData.contestId}`);
    } else {
      alert('Handshake Failure: Authorization Mismatch.');
    }
  };

  const getContestStatus = (c) => {
    if (user.role === 'faculty') return 'manage';
    const now = new Date().getTime();
    const start = new Date(c.date).getTime();
    const end = start + (c.duration * 60000);
    if (now < start) return 'future';
    if (now > end) return 'ended';
    return 'live';
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-10 bg-[#080808]">
      <SecretKeyModal isOpen={modalData.isOpen} onClose={() => setModalData({ isOpen: false, contestId: '' })} onConfirm={handleConfirmKey} />
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-end mb-14 border-b border-white/5 pb-8">
          <div>
            <div className="text-blue-400 text-[9px] font-black tracking-[0.4em] uppercase mb-1.5">Network Node</div>
            <h2 className="text-2xl font-bold tracking-tight uppercase text-white/90 leading-none">{user?.username}</h2>
          </div>
          <div className="text-right">
            <div className="text-white/10 text-[9px] font-black tracking-[0.4em] uppercase mb-1.5">Hub Status</div>
            <div className="text-white/30 font-mono text-[10px] uppercase tracking-widest">Active Channels: <span className="text-blue-400 font-bold">{contests.filter(c => getContestStatus(c) === 'live').length}</span></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests.map(c => {
            const status = getContestStatus(c);
            return (
              <div key={c._id} className={`glass-card p-10 rounded-[2rem] border border-white/5 transition-all duration-500 group relative overflow-hidden ${status === 'future' || status === 'ended' ? 'opacity-30 hover:opacity-100 grayscale hover:grayscale-0' : 'hover:border-blue-500/40 hover:shadow-2xl bg-white/[0.01]'}`}>
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <h4 className="font-bold text-xl group-hover:text-blue-400 transition-all tracking-tight uppercase leading-[1.1] max-w-[80%] text-white/90">{c.name}</h4>
                  <div className={`px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] border ${status === 'live' || status === 'manage' ? 'bg-blue-600/10 text-blue-400 border-blue-500/30' : 'bg-white/5 text-white/20 border-white/5'}`}>
                    {status === 'future' ? 'Pending' : status === 'ended' ? 'Archive' : 'Live'}
                  </div>
                </div>
                <div className="space-y-1.5 mb-10 relative z-10">
                  <div className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">Launch Sequence</div>
                  <div className="text-xs font-mono text-white/30 tracking-tight">{new Date(c.date).toLocaleString()}</div>
                </div>
                
                {status === 'future' ? (
                  <button disabled className="w-full glass-button py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.4em] opacity-30 cursor-not-allowed">Encrypted</button>
                ) : status === 'ended' ? (
                  <button disabled className="w-full glass-button py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.4em] opacity-30 cursor-not-allowed">Expired</button>
                ) : (
                  <button onClick={() => handleJoinAttempt(c._id)} className="w-full bg-blue-600/10 text-blue-400 border border-blue-500/20 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.4em] hover:bg-blue-600 hover:text-white transition-all shadow-lg active:scale-95 relative z-10">Authorize</button>
                )}
                
                <div className="absolute -bottom-12 -right-12 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-1000 rotate-[-15deg] scale-110">
                  <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StudentContestRoom = () => {
  const { id } = useParams();
  const [contest, setContest] = useState(null);
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState('javascript');
  const [simulationOutput, setSimulationOutput] = useState('');
  const [timeLeft, setTimeLeft] = useState("");
  const [activeTab, setActiveTab] = useState('overview'); 
  const [announcement, setAnnouncement] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!localStorage.getItem(`contest_auth_${id}`)) { navigate('/dashboard'); return; }
    fetchContest();
    const interval = setInterval(fetchContest, 15000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (contest && user.role === 'student') {
      const start = new Date(contest.date).getTime();
      const end = start + (contest.duration * 60000);
      const now = new Date().getTime();
      if (now < start || now > end) {
        alert("Session Window Purged.");
        navigate('/dashboard');
      }
    }
  }, [contest, user]);

  useEffect(() => {
    if (activeTab === 'editor') {
      const savedCode = localStorage.getItem(`code_${id}_${activeProblemIdx}`);
      setCode(savedCode || "// Node implementation ready...");
    }
  }, [activeProblemIdx, id, activeTab]);

  useEffect(() => {
    if (activeTab === 'editor') {
      localStorage.setItem(`code_${id}_${activeProblemIdx}`, code);
    }
  }, [code, id, activeProblemIdx, activeTab]);

  const [isExpiring, setIsExpiring] = useState(false);

  useEffect(() => {
    if (!contest) return;
    const timer = setInterval(() => {
      const start = new Date(contest.date).getTime();
      const end = start + (contest.duration * 60000);
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("PURGED");
        setIsExpiring(false);
        if (activeTab === 'editor') {
          handleRunSimulation(true);
        }
        clearInterval(timer);
      } else {
        if (diff < 300000) setIsExpiring(true);
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [contest]);

  const fetchContest = async () => {
    const res = await fetch(`http://localhost:5000/api/admin/contests/${id}`);
    const data = await res.json();
    setContest(data);
    if (data.announcements.length > 0) setAnnouncement(data.announcements[data.announcements.length - 1]);
  };

  const handleRunSimulation = async (isAuto = false) => {
    setSimulationOutput(prev => prev + `\n● [${isAuto ? 'AUTO-COMMIT' : 'SYSTEM'}] Initializing analysis...`);
    const problem = contest.problems[activeProblemIdx];
    const res = await fetch(`http://localhost:5000/api/contests/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, problemId: problem._id, code, language })
    });
    const data = await res.json();
    const prefix = data.success ? "● [SUCCESS]" : "● [ERROR]";
    setSimulationOutput(prev => prev + `\n${prefix} Node Response: ${data.message}\n● [INFO] Status: ${data.success ? 'NOMINAL' : 'FAILURE'}`);
  };

  const currentProblem = contest?.problems[activeProblemIdx];

  return (
    <div className="h-screen bg-[#050505] flex flex-col pt-12 overflow-hidden">
      {announcement && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl animate-fade-in-up">
          <div className="mx-6 p-4 rounded-[1.5rem] border border-purple-500/50 bg-purple-600/10 backdrop-blur-3xl flex items-center gap-5 shadow-2xl">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(147,51,234,0.5)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><path d="M18 8a6 6 0 0 0-12 0c0 7 3 9 3 9h6s3-2 3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <div className="flex-1">
              <p className="text-[8px] font-black uppercase text-purple-400 tracking-[0.4em] mb-0.5">Network Alert</p>
              <p className="text-white text-[12px] font-bold tracking-tight">{announcement.message}</p>
            </div>
            <button onClick={() => setAnnouncement(null)} className="p-2 text-white/20 hover:text-white transition-all"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
        </div>
      )}

      {/* Elite Combat Bar */}
      <div className="h-11 border-b border-white/5 flex items-center justify-between px-8 bg-black/60 backdrop-blur-2xl">
        <div className="flex items-center gap-8">
          <button onClick={() => setActiveTab('overview')} className="group flex items-center gap-3 text-white/20 hover:text-white transition-all">
            <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5 group-hover:border-blue-500/40 transition-all"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="15 18 9 12 15 6"></polyline></svg></div>
            <span className="text-[8px] font-black uppercase tracking-[0.3em]">Network</span>
          </button>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-white/10 uppercase tracking-[0.4em] mb-0.5">Uplink active</span>
            <h2 className="font-bold text-[11px] tracking-tight text-white/80 uppercase leading-none">{contest?.name}</h2>
          </div>
        </div>
        <div className="flex items-center gap-10">
          <div className="flex flex-col items-end">
            <span className={`text-[7px] font-black uppercase tracking-[0.4em] mb-0.5 transition-colors ${isExpiring ? 'text-red-500 animate-pulse' : 'text-blue-400/20'}`}>Time Limit</span>
            <div className={`font-mono text-sm font-bold tracking-widest transition-all ${isExpiring ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-blue-400'}`}>{timeLeft}</div>
          </div>
          <button onClick={() => setActiveTab('rankings')} className={`px-5 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'rankings' ? 'bg-white text-black shadow-lg' : 'text-white/20 hover:text-white hover:bg-white/[0.03]'}`}>Live Stats</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'overview' && (
          <div className="flex-1 p-16 overflow-auto animate-fade-in bg-[#030303]">
            <div className="max-w-4xl mx-auto">
              <div className="mb-16">
                <div className="text-blue-400 text-[9px] font-black tracking-[0.4em] uppercase mb-3">Objective Manifest</div>
                <h2 className="text-3xl font-bold uppercase tracking-tight mb-4 leading-none text-white/90 tracking-[-0.03em]">Combat Problems.</h2>
                <div className="w-16 h-1 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)]" />
              </div>
              <div className="grid grid-cols-1 gap-4">
                {contest?.problems.map((p, i) => (
                  <div key={p._id} onClick={() => { setActiveProblemIdx(i); setActiveTab('editor'); }} className="glass-card p-8 rounded-[1.5rem] border border-white/5 hover:border-blue-500/50 transition-all duration-700 group flex items-center justify-between bg-white/[0.01] cursor-pointer hover:shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-10 relative z-10">
                      <div className="w-14 h-14 bg-white/[0.02] border border-white/5 rounded-[1.2rem] flex items-center justify-center font-black text-white/10 group-hover:text-blue-400 transition-all duration-700 text-xl tracking-tighter shadow-inner">
                        {String(i+1).padStart(2, '0')}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold group-hover:text-white transition-all tracking-tight mb-1.5 uppercase leading-none">{p.title}</h3>
                        <div className="flex gap-4 items-center">
                          <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3.5 py-1 rounded-full border ${p.difficulty === 'Easy' ? 'bg-green-500/5 text-green-400 border-green-500/30' : p.difficulty === 'Medium' ? 'bg-yellow-500/5 text-yellow-400 border-yellow-500/30' : 'bg-red-500/5 text-red-400 border-red-500/30'}`}>{p.difficulty}</span>
                          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/10 group-hover:text-white/30 transition-colors">{p.points} Tokens</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-700 relative z-10">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-white/10 group-hover:text-white transition-all"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="flex-1 flex overflow-hidden bg-[#020202]">
            {/* Split Description Pane */}
            <div className="w-1/2 flex flex-col border-r border-white/5 bg-[#080808]">
              <div className="h-9 border-b border-white/5 flex items-center px-6 gap-8 bg-white/[0.01]">
                <div className="flex items-center gap-3 h-full tab-active">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-blue-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">Objective</span>
                </div>
                <div className="flex items-center gap-3 h-full text-white/10 hover:text-white transition-all cursor-pointer group">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:rotate-[-90deg] transition-all duration-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span className="text-[8px] font-black uppercase tracking-[0.3em]">History</span>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-12 custom-scrollbar selection:bg-blue-600/30">
                <div className="max-w-2xl">
                  <div className="text-blue-400 text-[8px] font-black tracking-[0.4em] uppercase mb-4">Node {String(activeProblemIdx+1).padStart(2, '0')} // Handshake verified</div>
                  <h2 className="text-2xl font-bold mb-6 tracking-tight uppercase leading-[1.0] text-white/90">{currentProblem?.title}</h2>
                  <div className="flex gap-3 mb-10">
                    <span className={`px-4 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] border ${currentProblem?.difficulty === 'Easy' ? 'bg-green-500/5 text-green-400 border-green-500/30' : currentProblem?.difficulty === 'Medium' ? 'bg-yellow-500/5 text-yellow-400 border-yellow-500/30' : 'bg-red-500/5 text-red-400 border-red-500/30'}`}>
                      {currentProblem?.difficulty}
                    </span>
                    <span className="px-4 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] bg-blue-600/5 text-blue-400 border border-blue-500/30">
                      {currentProblem?.points} Tokens
                    </span>
                  </div>
                  
                  <div className="space-y-12">
                    <div className="prose prose-invert max-w-none text-white/50 leading-relaxed text-[14px] font-medium tracking-tight">
                      {currentProblem?.description}
                    </div>
                    
                    {currentProblem?.constraints && (
                      <div className="p-8 rounded-[1.5rem] bg-white/[0.01] border border-white/5">
                        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3 text-white/30">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]" /> Architectural Constraints
                        </h4>
                        <pre className="text-[11px] text-white/30 font-mono leading-relaxed whitespace-pre-wrap">{currentProblem.constraints}</pre>
                      </div>
                    )}

                    <div className="space-y-10 pb-12">
                      <div className="space-y-6">
                        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10 flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-white/10 rounded-full" /> Initial Sandbox
                        </h4>
                        <div className="bg-black/60 border border-white/5 rounded-[2rem] p-8 space-y-8 font-mono text-[11px] shadow-2xl">
                          <div className="group transition-all">
                            <p className="text-blue-400/30 uppercase font-black text-[8px] mb-4 tracking-[0.3em] group-hover:text-blue-400 transition-colors">Stream Input</p>
                            <div className="p-4 bg-white/[0.02] rounded-xl text-blue-100/40 border border-white/5 font-mono text-[12px] shadow-inner">{currentProblem?.sampleInput || "// Standby"}</div>
                          </div>
                          <div className="group transition-all">
                            <p className="text-purple-400/30 uppercase font-black text-[8px] mb-4 tracking-[0.3em] group-hover:text-purple-400 transition-colors">Target Output</p>
                            <div className="p-4 bg-white/[0.02] rounded-xl text-purple-100/40 border border-white/5 font-mono text-[12px] shadow-inner">{currentProblem?.sampleOutput || "// Terminal State"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Pane: Tactical Implementation Hub */}
            <div className="w-1/2 flex flex-col bg-[#040404]">
              {/* Action Bar */}
              <div className="h-9 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.01]">
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-white/20 border border-white/5 px-2.5 py-1 rounded-lg bg-white/[0.02]">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    Secure
                  </div>
                  <select className="bg-transparent text-[8px] font-black uppercase text-white/40 outline-none cursor-pointer hover:text-white transition-all tracking-[0.2em] font-mono" value={language} onChange={e => setLanguage(e.target.value)}>
                    <option value="javascript">JS_ECMA_20</option>
                    <option value="python">PY_3_11</option>
                    <option value="cpp">CPP_STD_20</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleRunSimulation()} className="px-4 py-1.5 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl text-[8px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-all border border-white/5 active:scale-95 shadow-lg">Run</button>
                  <button onClick={() => handleRunSimulation()} className="px-6 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-[8px] font-black uppercase tracking-[0.3em] text-white transition-all shadow-lg active:scale-95 border border-blue-400/30">Submit</button>
                </div>
              </div>

              {/* Code Engine */}
              <div className="flex-[0.65] relative bg-black/40 shadow-inner">
                <div className="absolute top-0 left-0 w-12 h-full bg-white/[0.005] border-r border-white/5 flex flex-col items-center pt-8 space-y-4 font-mono text-[10px] text-white/5 select-none font-bold">
                  {Array.from({length: 30}).map((_, i) => <div key={i}>{String(i+1).padStart(2, '0')}</div>)}
                </div>
                <textarea 
                  className="w-full h-full pl-14 pr-8 py-8 bg-transparent font-mono text-[12px] text-blue-100/40 outline-none resize-none leading-[1.8] custom-scrollbar selection:bg-blue-600/30 placeholder:text-white/5"
                  spellCheck="false"
                  placeholder="// Architecture initialization..."
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const start = e.target.selectionStart;
                      const end = e.target.selectionEnd;
                      const val = e.target.value;
                      setCode(val.substring(0, start) + "    " + val.substring(end));
                      setTimeout(() => {
                        e.target.selectionStart = e.target.selectionEnd = start + 4;
                      }, 0);
                    }
                  }}
                />
              </div>

              {/* Industrial Diagnostics */}
              <div className="flex-[0.35] flex flex-col border-t border-white/10 bg-[#020202]">
                <div className="h-8 border-b border-white/5 flex items-center px-6 gap-6 bg-white/[0.005]">
                  <div className="flex items-center gap-3 h-full border-b-2 border-green-500">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">Diagnostics</span>
                  </div>
                  <div className="text-[7px] font-black uppercase tracking-[0.2em] text-white/5">NOMINAL</div>
                </div>
                <div className="flex-1 p-8 font-mono text-[11px] text-blue-200/40 overflow-auto whitespace-pre-wrap leading-relaxed custom-scrollbar bg-black/60 shadow-inner">
                  <div className="flex gap-3 mb-2 border-b border-white/5 pb-2">
                    <span className="text-green-500 font-bold">➜</span>
                    <span className="text-white/10 uppercase text-[8px] font-black tracking-[0.3em]">Telemetry Initiated...</span>
                  </div>
                  {simulationOutput || "● [STATUS] Waiting for tactical simulation...\n● [READY] Monitoring IO stream..."}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rankings' && (
          <div className="flex-1 p-16 overflow-auto animate-fade-in bg-[#030303]">
            <div className="max-w-5xl mx-auto">
              <div className="mb-16 text-center">
                <div className="text-blue-400 text-[9px] font-black tracking-[0.4em] uppercase mb-4">Division Matrix Status</div>
                <h2 className="text-4xl font-bold uppercase tracking-tight mb-5 leading-none tracking-tighter text-white/90">Elite <br />Leaderboard.</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full shadow-[0_0_30px_rgba(37,99,235,0.6)]" />
              </div>
              <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 bg-white/[0.005] shadow-2xl bg-black/40">
                <table className="w-full text-left">
                  <thead className="bg-white/[0.02] text-[8px] font-black uppercase text-white/20 tracking-[0.4em]">
                    <tr><th className="px-12 py-8">Pos</th><th className="px-12 py-8">Engineer</th><th className="px-12 py-8">Tokens</th><th className="px-12 py-8 text-right">Integrity</th></tr>
                  </thead>
                  <tbody>
                    {contest?.participants.sort((a,b) => (b.autoScore + b.manualScore) - (a.autoScore + a.manualScore)).map((p, i) => (
                      <tr key={p._id} className="border-t border-white/5 hover:bg-white/[0.01] transition-all group duration-500">
                        <td className="px-12 py-10 font-black text-white/10 group-hover:text-blue-400/40 transition-all text-2xl tracking-tighter italic">#{String(i + 1).padStart(2, '0')}</td>
                        <td className="px-12 py-10 font-bold group-hover:text-white transition-all text-lg tracking-tight uppercase leading-none">
                          {p.username} 
                          {p.userId === user.id && <span className="ml-4 text-[7px] bg-blue-600 px-3 py-1 rounded-full text-white uppercase tracking-[0.3em] font-black shadow-lg">Local</span>}
                        </td>
                        <td className="px-12 py-10 font-mono text-3xl text-white/20 group-hover:text-white transition-all tracking-tighter font-black">{p.autoScore + p.manualScore}</td>
                        <td className="px-12 py-10 text-right"><span className="text-[8px] font-black uppercase bg-blue-600/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-full shadow-2xl tracking-[0.1em] group-hover:bg-blue-600 group-hover:text-white transition-all">Verified</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [contests, setContests] = useState([]);
  const [newContest, setNewContest] = useState({ name: '', date: '', duration: 60, totalMarks: 100, password: '', description: '' });
  const [modalData, setModalData] = useState({ isOpen: false, contestId: '' });
  const navigate = useNavigate();

  useEffect(() => { fetchContests(); }, []);

  const fetchContests = async () => {
    const res = await fetch('http://localhost:5000/api/contests');
    const data = await res.json();
    setContests(data);
  };

  const handleCreateContest = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/admin/contests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContest)
    });
    if (res.ok) { fetchContests(); setActiveTab('overview'); }
  };

  const handleAdminEnter = async (key) => {
    const res = await fetch(`http://localhost:5000/api/contests/${modalData.contestId}/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: key })
    });
    if (res.ok) {
      localStorage.setItem(`admin_auth_${modalData.contestId}`, 'true');
      navigate(`/admin/contest/${modalData.contestId}`);
    } else {
      alert('AUTHORIZATION BREACH: Key Mismatch.');
    }
  };

  const exportCSV = (contest) => {
    const headers = "Enrollment No,Status,Auto Score,Manual Score,Total,Joined At\n";
    const rows = contest.participants.map(p => `${p.username},${p.status},${p.autoScore},${p.manualScore},${Number(p.autoScore) + Number(p.manualScore)},${new Date(p.joinedAt).toLocaleString()}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Results_${contest.name}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-10 bg-[#020202] text-white">
      <SecretKeyModal isOpen={modalData.isOpen} onClose={() => setModalData({ isOpen: false, contestId: '' })} onConfirm={handleAdminEnter} title="Command Center" />
      <div className="max-w-[1500px] mx-auto">
        <div className="flex justify-between items-end mb-16 border-b border-white/5 pb-8">
          <div>
            <div className="text-blue-400 text-[9px] font-black tracking-[0.4em] uppercase mb-1.5">Tactical Command Hub</div>
            <h2 className="text-3xl font-bold uppercase tracking-tight leading-none text-white/90">Command Center.</h2>
          </div>
          <div className="flex gap-2.5 p-1.5 bg-white/[0.01] border border-white/5 rounded-2xl shadow-2xl">
            {['overview', 'launch-contest', 'export-results'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === t ? 'bg-blue-600 text-white shadow-lg' : 'text-white/20 hover:text-white'}`}>{t.replace('-', ' ')}</button>
            ))}
          </div>
        </div>
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up">
            {contests.map(c => (
              <div key={c._id} className="glass-card p-10 rounded-[2rem] border border-white/5 hover:border-blue-500/50 transition-all duration-700 group relative overflow-hidden bg-white/[0.01]">
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <h3 className="font-bold text-xl tracking-tight leading-[1.1] max-w-[80%] uppercase group-hover:text-blue-400 transition-colors text-white/90">{c.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.3em] border ${c.status === 'live' ? 'bg-blue-600/10 text-blue-400 border-blue-500/30' : 'bg-white/5 text-white/20 border-white/5'}`}>{c.status}</span>
                </div>
                <p className="text-white/10 text-[9px] font-black uppercase tracking-[0.4em] mb-10 relative z-10">{new Date(c.date).toLocaleDateString()}</p>
                <button onClick={() => setModalData({ isOpen: true, contestId: c._id })} className="w-full bg-blue-600/5 text-blue-400 border border-blue-500/20 py-5 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95 relative z-10">Initialize</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'launch-contest' && (
          <div className="max-w-xl mx-auto glass-card p-12 rounded-[2.5rem] border border-white/10 animate-fade-in-up shadow-2xl bg-black/40">
            <div className="text-blue-400 text-[9px] font-black tracking-[0.4em] uppercase mb-4 text-center">Protocol Initialization</div>
            <h3 className="text-2xl font-bold mb-10 text-center uppercase tracking-tight leading-none text-white/90">Initialize Arena.</h3>
            <form onSubmit={handleCreateContest} className="space-y-8">
              <div className="group">
                <label className="text-[8px] font-black uppercase tracking-[0.3em] text-white/10 ml-3 mb-3 block group-hover:text-blue-400 transition-colors">Mission Name</label>
                <input required placeholder="Initialize Mission ID" className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 transition-all text-lg font-bold shadow-inner" value={newContest.name} onChange={e => setNewContest({...newContest, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="group">
                  <label className="text-[8px] font-black uppercase tracking-[0.3em] text-white/10 ml-3 mb-3 block group-hover:text-blue-400 transition-colors">Launch Clock</label>
                  <input type="datetime-local" className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 transition-all font-mono text-sm shadow-inner" value={newContest.date} onChange={e => setNewContest({...newContest, date: e.target.value})} />
                </div>
                <div className="group">
                  <label className="text-[8px] font-black uppercase tracking-[0.3em] text-white/10 ml-3 mb-3 block group-hover:text-blue-400 transition-colors">Duration (Min)</label>
                  <input type="number" placeholder="60" className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 transition-all font-mono text-lg font-bold shadow-inner" value={newContest.duration} onChange={e => setNewContest({...newContest, duration: e.target.value})} />
                </div>
              </div>
              <div className="group">
                <label className="text-[8px] font-black uppercase tracking-[0.3em] text-white/10 ml-3 mb-3 block group-hover:text-blue-400 transition-colors">Encryption Key</label>
                <input type="password" placeholder="Room Secret" className="w-full bg-blue-600/[0.02] border border-blue-600/20 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 font-mono tracking-[0.3em] text-lg font-bold shadow-inner" value={newContest.password} onChange={e => setNewContest({...newContest, password: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-blue-600 py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl hover:bg-blue-500 transition-all active:scale-95 mt-6 border border-blue-400/30">Commit Deployment</button>
            </form>
          </div>
        )}

        {activeTab === 'export-results' && (
          <div className="animate-fade-in-up">
            <div className="glass-card p-12 rounded-[3rem] border border-white/5 shadow-2xl bg-black/40">
              <div className="text-blue-400 text-[9px] font-black tracking-[0.4em] uppercase mb-4 text-center">Master Data Hub</div>
              <h3 className="text-3xl font-black mb-12 text-center uppercase tracking-tight leading-none text-white/90">Result Archive.</h3>
              <div className="space-y-4">
                {contests.map(c => (
                  <div key={c._id} className="flex items-center justify-between p-8 bg-white/[0.01] rounded-[2rem] border border-white/5 hover:border-blue-500/40 transition-all group duration-700">
                    <div className="flex items-center gap-8">
                      <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-blue-400 font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner group-hover:scale-105">
                        CSV
                      </div>
                      <div>
                        <p className="font-bold text-lg tracking-tight group-hover:text-white transition-all uppercase leading-none mb-1 text-white/90">{c.name}</p>
                        <p className="text-[8px] text-white/10 uppercase tracking-[0.3em] font-black group-hover:text-blue-400/40 transition-all">{String(c.participants?.length || 0).padStart(3, '0')} Uplinks</p>
                      </div>
                    </div>
                    <button onClick={() => exportCSV(c)} className="bg-white text-black px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl border border-white/20">Fetch CSV</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ContestControlCenter = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('problems');
  const [contest, setContest] = useState(null);
  const [isAddingProblem, setIsAddingProblem] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [evaluatingParticipant, setEvaluatingParticipant] = useState(null);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [newProblem, setNewProblem] = useState({ 
    title: '', description: '', difficulty: 'Medium', gradingType: 'auto', 
    points: 20, constraints: '', sampleInput: '', sampleOutput: '', testCases: '' 
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem(`admin_auth_${id}`)) { navigate('/admin'); return; }
    fetchContest();
    const interval = setInterval(fetchContest, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchContest = async () => {
    const res = await fetch(`http://localhost:5000/api/admin/contests/${id}`);
    const data = await res.json();
    setContest(data);
  };

  const handleDeleteProblem = async (problemId) => {
    if (!window.confirm("PROTOCOL PURGE: Proceed with permanent data deletion?")) return;
    const res = await fetch(`http://localhost:5000/api/admin/contests/${id}/problems/${problemId}`, {
      method: 'DELETE'
    });
    if (res.ok) fetchContest();
  };

  const handleAddProblem = async (e) => {
    e.preventDefault();
    const url = editingProblemId ? `http://localhost:5000/api/admin/contests/${id}/problems/${editingProblemId}` : `http://localhost:5000/api/admin/contests/${id}/problems`;
    const method = editingProblemId ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProblem) });
    setIsAddingProblem(false);
    setEditingProblemId(null);
    fetchContest();
    setNewProblem({ title: '', description: '', difficulty: 'Medium', gradingType: 'auto', points: 20, constraints: '', sampleInput: '', sampleOutput: '', testCases: '' });
  };

  const sendBroadcast = async () => {
    if (!broadcastMsg) return;
    await fetch(`http://localhost:5000/api/admin/contests/${id}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: broadcastMsg })
    });
    setBroadcastMsg('');
    alert('TRANSMISSION ACKNOWLEDGED.');
  };

  const handleEvaluate = async (participantId, score, feedback) => {
    await fetch(`http://localhost:5000/api/admin/contests/${id}/evaluate/${participantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manualScore: score, feedback })
    });
    setEvaluatingParticipant(null);
    fetchContest();
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-10 bg-[#020202] text-white">
      <EvaluateModal isOpen={!!evaluatingParticipant} participant={evaluatingParticipant} onClose={() => setEvaluatingParticipant(null)} onSave={handleEvaluate} />
      
      <div className="max-w-[1500px] mx-auto">
        <div className="flex justify-between items-end mb-16 border-b border-white/5 pb-8">
          <div>
            <div className="text-blue-400 text-[9px] font-black tracking-[0.4em] uppercase mb-1.5">Node Environment Control</div>
            <h2 className="text-3xl font-bold uppercase tracking-tight leading-none text-white/90">{contest?.name || 'Protocol Hub'}</h2>
          </div>
          <div className="flex gap-2.5 p-1.5 bg-white/[0.01] border border-white/5 rounded-2xl shadow-2xl">
            {['problems', 'results', 'broadcast'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === t ? 'bg-blue-600 text-white shadow-lg' : 'text-white/20 hover:text-white'}`}>{t}</button>
            ))}
          </div>
        </div>

        {activeTab === 'problems' && (
          <div className="space-y-10 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-2xl uppercase tracking-tight text-white/90">Objective Bucket</h3>
              <button onClick={() => { setIsAddingProblem(true); setEditingProblemId(null); }} className="bg-blue-600 px-8 py-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl border border-blue-400/30">+ Objective</button>
            </div>

            {!isAddingProblem ? (
              <div className="grid grid-cols-1 gap-4">
                {contest?.problems.map(p => (
                  <div key={p._id} className="glass-card p-8 rounded-[2rem] border border-white/5 hover:border-blue-500/40 transition-all duration-700 group flex justify-between items-center bg-white/[0.01] relative overflow-hidden">
                    <div className="flex items-center gap-10 relative z-10">
                      <div className="w-14 h-14 bg-white/[0.03] rounded-[1.2rem] flex items-center justify-center font-black text-white/5 group-hover:text-blue-400 transition-all duration-700 text-2xl tracking-tighter border border-white/5 shadow-inner">
                        {p.points}
                      </div>
                      <div>
                        <p className="font-bold text-xl group-hover:text-white transition-all tracking-tight mb-2 uppercase leading-none text-white/90">{p.title}</p>
                        <div className="flex gap-4 items-center">
                          <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1 rounded-full border ${p.difficulty === 'Easy' ? 'bg-green-500/5 text-green-400 border-green-500/30' : p.difficulty === 'Medium' ? 'bg-yellow-500/5 text-yellow-400 border-yellow-500/30' : 'bg-red-500/5 text-red-400 border-red-500/30'}`}>{p.difficulty}</span>
                          <span className="text-[8px] font-black uppercase text-white/10 tracking-[0.3em]">{p.gradingType} Mode</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 relative z-10">
                      <button onClick={() => { setNewProblem(p); setEditingProblemId(p._id); setIsAddingProblem(true); }} className="p-4 glass-button text-white/10 hover:text-blue-400 hover:border-blue-500/40 rounded-[1.2rem] transition-all duration-500">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDeleteProblem(p._id)} className="p-4 glass-button text-white/5 hover:text-red-500 hover:border-red-500/40 rounded-[1.2rem] transition-all duration-500">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-12 rounded-[3.5rem] border border-white/10 animate-fade-in-up shadow-2xl bg-black/40">
                <div className="flex justify-between items-center mb-16 pb-8 border-b border-white/5">
                  <h3 className="text-3xl font-bold uppercase tracking-tight text-white/90 leading-none">{editingProblemId ? 'Protocol Override' : 'Architectural Brief'}</h3>
                  <button onClick={() => setIsAddingProblem(false)} className="text-[9px] font-black text-white/10 hover:text-red-500 uppercase tracking-[0.4em] transition-all">Discard</button>
                </div>
                
                <form onSubmit={handleAddProblem} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                      <label className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em] mb-3 block ml-3">Objective ID</label>
                      <input required placeholder="Initialize Mission" className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-8 py-5 text-white focus:border-blue-500/50 outline-none transition-all text-xl font-bold shadow-inner" value={newProblem.title} onChange={e => setNewProblem({...newProblem, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em] mb-3 block ml-3">Difficulty</label>
                      <select className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500/50 font-black tracking-[0.3em] text-xs shadow-inner" value={newProblem.difficulty} onChange={e => setNewProblem({...newProblem, difficulty: e.target.value})}>
                        <option value="Easy">Easy_Node</option>
                        <option value="Medium">Medium_Node</option>
                        <option value="Hard">Elite_Node</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em] mb-3 block ml-3">Narrative</label>
                    <textarea rows="6" placeholder="Define challenge..." className="w-full bg-white/[0.02] border border-white/10 rounded-[2rem] px-8 py-6 text-white outline-none focus:border-blue-500/50 transition-all resize-none text-[15px] font-medium shadow-inner" value={newProblem.description} onChange={e => setNewProblem({...newProblem, description: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em] mb-3 block ml-3">Tokens</label>
                      <input type="number" className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500/50 font-mono text-2xl font-bold shadow-inner" value={newProblem.points} onChange={e => setNewProblem({...newProblem, points: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em] mb-3 block ml-3">Grading</label>
                      <select className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500/50 font-black text-[10px] tracking-[0.3em] shadow-inner" value={newProblem.gradingType} onChange={e => setNewProblem({...newProblem, gradingType: e.target.value})}>
                        <option value="auto">Automated</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                      <div>
                        <label className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-3 block ml-3">Sample Input</label>
                        <textarea rows="4" className="w-full bg-black/60 border border-white/5 rounded-2xl px-8 py-5 text-blue-100/30 font-mono text-xs outline-none focus:border-blue-500/30 shadow-inner" value={newProblem.sampleInput} onChange={e => setNewProblem({...newProblem, sampleInput: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-[0.3em] mb-3 block ml-3">Sample Output</label>
                        <textarea rows="4" className="w-full bg-black/60 border border-white/5 rounded-2xl px-8 py-5 text-purple-100/30 font-mono text-xs outline-none focus:border-purple-500/30 shadow-inner" value={newProblem.sampleOutput} onChange={e => setNewProblem({...newProblem, sampleOutput: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-3 block ml-3">Internal Test Harness</label>
                      <textarea rows="10" className="w-full bg-black border border-yellow-500/10 rounded-[2.5rem] px-8 py-6 text-yellow-100/20 font-mono text-xs outline-none focus:border-yellow-500/30 h-[calc(100%-40px)] shadow-inner" value={newProblem.testCases} onChange={e => setNewProblem({...newProblem, testCases: e.target.value})} />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-blue-600 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.4em] hover:bg-blue-500 transition-all shadow-xl text-[10px] border border-blue-400/30 mt-6">Commit Objective</button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-10 animate-fade-in">
            <div className="glass-card rounded-[3rem] overflow-hidden border border-white/5 bg-black/40 shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/[0.02] uppercase text-[9px] font-black text-white/20 tracking-[0.4em]">
                  <tr className="border-b border-white/5"><th className="px-12 py-8">Engineer Hub</th><th className="px-12 py-8">Integrity</th><th className="px-12 py-8">Tokens</th><th className="px-12 py-8 text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {contest?.participants.map(p => (
                    <tr key={p._id} className="border-t border-white/5 hover:bg-white/[0.01] transition-all group duration-500">
                      <td className="px-12 py-10 font-bold text-xl tracking-tight group-hover:text-white transition-all uppercase leading-none text-white/90">{p.username}</td>
                      <td className="px-12 py-10">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-blue-600/5 text-blue-400 border border-blue-500/20 shadow-lg">{p.status}</span>
                      </td>
                      <td className="px-12 py-10 font-mono text-3xl text-white/10 group-hover:text-white transition-all tracking-tighter font-black">{Number(p.autoScore) + Number(p.manualScore)}</td>
                      <td className="px-12 py-10 text-right">
                        <button onClick={() => setEvaluatingParticipant(p)} className="bg-white/[0.02] text-white/20 px-8 py-2.5 rounded-[1.2rem] text-[9px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all border border-white/5 shadow-xl active:scale-95 duration-500">Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="max-w-2xl mx-auto glass-card p-12 rounded-[2.5rem] border border-white/10 animate-fade-in-up shadow-2xl bg-black/40">
            <div className="text-purple-400 text-[9px] font-black tracking-[0.4em] uppercase mb-4 text-center">Global Transmission</div>
            <h3 className="text-3xl font-black mb-10 text-center uppercase tracking-tight text-white/90 leading-none">Mission <br />Broadcast.</h3>
            <textarea rows="7" className="w-full bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 text-white focus:border-purple-500/50 outline-none mb-8 text-[15px] font-medium leading-relaxed shadow-inner" placeholder="Initialize global transmission..." value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} />
            <button onClick={sendBroadcast} className="w-full bg-purple-600 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] hover:bg-purple-500 transition-all shadow-2xl text-[10px] active:scale-95 border border-purple-400/30">Deploy Protocol</button>
          </div>
        )}
      </div>
    </div>
  );
};

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', course: '', password: '' });
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    if (res.ok) navigate('/login');
  };
  return (
    <div className="min-h-screen pt-24 pb-20 px-6 flex justify-center items-center bg-[#020202]">
      <div className="w-full max-w-sm glass-card p-10 rounded-[2rem] border border-white/10 animate-fade-in-up shadow-2xl">
        <h2 className="text-2xl font-bold mb-8 text-center uppercase tracking-tight text-white/90 leading-none">Identity <br />Initialization.</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input required placeholder="Engineer ID" className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-blue-500/50 shadow-inner text-sm font-bold" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
          <input required placeholder="Mesh Email" className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-blue-500/50 shadow-inner text-sm font-bold" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <input required placeholder="Program Core" className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-blue-500/50 shadow-inner text-sm font-bold" value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} />
          <input required type="password" placeholder="Cipher" className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-blue-500/50 font-mono tracking-[0.3em] shadow-inner text-sm font-bold" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
          <button type="submit" className="w-full bg-blue-600 font-black py-4 rounded-xl mt-6 transition-all shadow-xl active:scale-95 uppercase text-[9px] tracking-[0.3em] border border-blue-400/30">Request Access</button>
          <p className="text-center text-[9px] text-white/10 mt-6 font-black uppercase tracking-[0.3em]">Already verified? <Link to="/login" className="text-blue-400 hover:underline">Handshake</Link></p>
        </form>
      </div>
    </div>
  );
};

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.user.role === 'faculty') navigate('/admin'); else navigate('/dashboard');
    }
  };
  return (
    <div className="min-h-screen pt-24 pb-20 px-6 flex justify-center items-center bg-[#020202]">
      <div className="w-full max-w-sm glass-card p-10 rounded-[2rem] border border-white/10 animate-fade-in-up shadow-2xl">
        <h2 className="text-2xl font-bold mb-8 text-center uppercase tracking-tight text-white/90 leading-none">System <br />Access.</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <input required placeholder="Engineer ID" className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-blue-500/50 shadow-inner text-sm font-bold" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
          <input required type="password" placeholder="Cipher" className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-blue-500/50 font-mono tracking-[0.3em] shadow-inner text-sm font-bold" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
          <button type="submit" className="w-full bg-blue-600 font-black py-4 rounded-xl mt-6 transition-all shadow-xl active:scale-95 uppercase text-[9px] tracking-[0.3em] border border-blue-400/30">Verify Link</button>
          <p className="text-center text-[9px] text-white/10 mt-6 font-black uppercase tracking-[0.4em]">New to CodeArena? <Link to="/signup" className="text-blue-400 hover:underline">Join Mesh</Link></p>
        </form>
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const [contests, setContests] = useState([]);
  useEffect(() => { fetch('http://localhost:5000/api/contests').then(res => res.json()).then(data => setContests(data)); }, []);
  return (
    <div className="min-h-screen pt-24 pb-20 px-10 bg-[#020202] text-white text-center">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-20">
          <div className="text-blue-400 text-[10px] font-black tracking-[0.4em] uppercase mb-4">Network Node Status Matrix</div>
          <h2 className="text-4xl font-bold uppercase tracking-tight mb-5 leading-none tracking-tighter text-white/90 uppercase">Global <br />Leaderboard.</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full shadow-[0_0_30px_rgba(37,99,235,0.6)]" />
        </div>
        <div className="glass-card rounded-[3rem] overflow-hidden border border-white/5 bg-black/40 shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/[0.03] uppercase text-[9px] font-black text-white/20 tracking-[0.4em]">
              <tr className="border-b border-white/5"><th className="px-14 py-8">Environment</th><th className="px-14 py-8">Uplinks</th><th className="px-14 py-8 text-right">State</th></tr>
            </thead>
            <tbody>
              {contests.map(c => (
                <tr key={c._id} className="border-t border-white/5 hover:bg-white/[0.015] transition-all group duration-700">
                  <td className="px-14 py-10 font-bold text-2xl tracking-tighter group-hover:text-blue-400 transition-all duration-700 leading-none uppercase text-white/90">{c.name}</td>
                  <td className="px-14 py-10 font-mono text-lg text-blue-400/40 group-hover:text-blue-400 transition-all font-bold tracking-tighter uppercase">{String(c.participants?.length || 0).padStart(3, '0')} Engineers</td>
                  <td className="px-14 py-10 text-right">
                    <span className={`px-6 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.3em] ${c.status === 'live' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30 shadow-lg' : 'bg-white/5 text-white/10 border border-white/5'}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen relative overflow-hidden bg-[#020202] font-inter text-white selection:bg-blue-600/40">
        <Navbar />
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<ProtectedRoute><ArenaDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute roleRequired="faculty"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/contest/:id" element={<ProtectedRoute roleRequired="faculty"><ContestControlCenter /></ProtectedRoute>} />
            <Route path="/contest/:id" element={<ProtectedRoute><StudentContestRoom /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
