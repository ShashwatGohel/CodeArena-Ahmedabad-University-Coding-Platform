import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

const ContestMonitor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'overview';

  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Proctoring state
  const [violations, setViolations] = useState([]);
  const [unlockingId, setUnlockingId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Problem Modal State
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewingSubmission, setViewingSubmission] = useState(null);
  const [viewingFileIndex, setViewingFileIndex] = useState(0);
  const [rerunResults, setRerunResults] = useState(null);
  const [rerunning, setRerunning] = useState(false);
  const [problemForm, setProblemForm] = useState({
    title: '', description: '', difficulty: 'easy', tags: '', points: 100, gradingType: 'automatic',
    testCases: [{ input: '', output: '', isSample: false }]
  });

  useEffect(() => {
    if (!user.id || user.role !== 'faculty') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [id, navigate]);

  // Auto-poll violations + submissions every 10 seconds
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const [vRes, sRes, cRes] = await Promise.all([
          fetch(`http://localhost:5000/api/contests/${id}/violations`),
          fetch(`http://localhost:5000/api/submissions/contest/${id}`),
          fetch(`http://localhost:5000/api/contests/${id}`)
        ]);
        if (vRes.ok) setViolations(await vRes.json());
        if (sRes.ok) setSubmissions(await sRes.json());
        if (cRes.ok) setContest(await cRes.json()); // refreshes lockedStudents too
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (e) {
        console.error('Poll error:', e);
      }
    }, 10000);
    return () => clearInterval(poll);
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contestRes, problemsRes, submissionsRes, violationsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/contests/${id}`),
        fetch(`http://localhost:5000/api/problems/contest/${id}`),
        fetch(`http://localhost:5000/api/submissions/contest/${id}`),
        fetch(`http://localhost:5000/api/contests/${id}/violations`)
      ]);

      if (contestRes.ok) setContest(await contestRes.json());
      if (problemsRes.ok) setProblems(await problemsRes.json());
      if (submissionsRes.ok) setSubmissions(await submissionsRes.json());
      if (violationsRes.ok) setViolations(await violationsRes.json());
    } catch (error) {
      console.error('Error fetching monitor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestCase = () => {
    setProblemForm({
      ...problemForm,
      testCases: [...problemForm.testCases, { input: '', output: '', isSample: false }]
    });
  };

  const handleRemoveTestCase = (index) => {
    const updated = [...problemForm.testCases];
    updated.splice(index, 1);
    setProblemForm({ ...problemForm, testCases: updated });
  };

  const handleTestCaseChange = (index, field, value) => {
    const updated = [...problemForm.testCases];
    updated[index][field] = value;
    setProblemForm({ ...problemForm, testCases: updated });
  };

  const openAddProblemModal = () => {
    setEditingProblemId(null);
    setProblemForm({
      title: '', description: '', difficulty: 'easy', tags: '', points: 100, gradingType: 'automatic',
      testCases: []
    });
    setShowProblemModal(true);
  };

  const openEditProblemModal = (prob) => {
    setEditingProblemId(prob._id);
    setProblemForm({
      ...prob,
      tags: Array.isArray(prob.tags) ? prob.tags.join(', ') : prob.tags
    });
    setShowProblemModal(true);
  };

  const handleProblemSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...problemForm,
        tags: problemForm.tags.split(',').map(t => t.trim()).filter(t => t),
        testCases: problemForm.testCases.filter(tc => tc.input.trim() || tc.output.trim()),
        contestId: id
      };

      const url = editingProblemId 
        ? `http://localhost:5000/api/problems/${editingProblemId}` 
        : 'http://localhost:5000/api/problems';
      
      const method = editingProblemId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowProblemModal(false);
        fetchData(); // Refresh list
      } else {
        alert('Failed to save problem');
      }
    } catch (error) {
      console.error('Error saving problem:', error);
    }
  };

  const handleDeleteProblem = async (probId) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/problems/${probId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setProblems(problems.filter(p => p._id !== probId));
      }
    } catch (error) {
      console.error('Error deleting problem:', error);
    }
  };

  const calculateStudentGrade = (studentId) => {
    const studentSubs = submissions.filter(s => s.student?._id === studentId);
    const problemMaxScores = {};
    
    studentSubs.forEach(sub => {
      const pid = sub.problem?._id;
      if (!pid) return;
      const pts = sub.points || 0;
      if (!problemMaxScores[pid] || pts > problemMaxScores[pid]) {
        problemMaxScores[pid] = pts;
      }
    });

    return Object.values(problemMaxScores).reduce((sum, score) => sum + score, 0).toFixed(1);
  };

  const handleKickStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to kick this student from the contest?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/contests/${id}/participants/${studentId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setContest({
          ...contest,
          participants: contest.participants.filter(p => p._id !== studentId)
        });
      } else {
        alert('Failed to remove student');
      }
    } catch (error) {
      console.error('Error removing student:', error);
    }
  };

  const handleToggleProctored = async () => {
    const newValue = !contest.isProctored;
    try {
      const res = await fetch(`http://localhost:5000/api/contests/${id}/proctored`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isProctored: newValue })
      });
      if (res.ok) {
        setContest({ ...contest, isProctored: newValue });
      }
    } catch (error) {
      console.error('Error toggling proctored mode:', error);
    }
  };

  const handleUnlockStudent = async (studentId) => {
    setUnlockingId(studentId);
    try {
      const res = await fetch(`http://localhost:5000/api/contests/${id}/unlock/${studentId}`, { method: 'POST' });
      if (res.ok) {
        setContest({ ...contest, lockedStudents: contest.lockedStudents.filter(s => s !== studentId && s._id !== studentId) });
        // Refresh violations
        const vRes = await fetch(`http://localhost:5000/api/contests/${id}/violations`);
        if (vRes.ok) setViolations(await vRes.json());
      }
    } catch (error) {
      console.error('Error unlocking student:', error);
    } finally {
      setUnlockingId(null);
    }
  };

  const handleRerun = async (subId) => {
    setRerunning(true);
    setRerunResults(null);
    try {
      const res = await fetch(`http://localhost:5000/api/submissions/${subId}/rerun`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setRerunResults(data.results);
        // Refresh submissions list to get updated status
        const subRes = await fetch(`http://localhost:5000/api/submissions/contest/${id}`);
        if (subRes.ok) setSubmissions(await subRes.json());
      }
    } catch (e) { console.error(e); }
    finally { setRerunning(false); }
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    
    // Group submissions by student
    const studentData = {};
    contest.participants.forEach(student => {
      studentData[student._id] = {
        info: student,
        subs: submissions.filter(s => s.student?._id === student._id)
      };
    });

    const reportsFolder = zip.folder("Reports");
    const sourceFolder = zip.folder("Source_Code");

    for (const sid in studentData) {
      const { info, subs } = studentData[sid];
      const safeName = info.name.replace(/\s+/g, '_');
      
      // 1. Generate PDF Report
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("Contest Performance Report", 20, 20);
      doc.setFontSize(12);
      doc.text(`Contest: ${contest.title}`, 20, 35);
      doc.text(`Student: ${info.name}`, 20, 45);
      doc.text(`ID Number: ${info.idNumber}`, 20, 55);
      doc.text(`Total Score: ${calculateStudentGrade(sid)}`, 20, 65);
      
      doc.text("Problem Breakdown:", 20, 80);
      let y = 90;
      problems.forEach((prob, idx) => {
        const studentProbSubs = subs.filter(s => s.problem?._id === prob._id);
        const isSolved = studentProbSubs.some(s => s.status === 'Accepted');
        doc.text(`${idx + 1}. ${prob.title} - ${isSolved ? 'SOLVED' : 'NOT SOLVED'} (${isSolved ? prob.points : 0} pts)`, 25, y);
        y += 10;
        if (y > 270) { doc.addPage(); y = 20; }
      });

      const pdfBlob = doc.output('blob');
      reportsFolder.file(`${safeName}_${info.idNumber}.pdf`, pdfBlob);

      // 2. Add Code Files
      const studentCodeFolder = sourceFolder.folder(`${safeName}_${info.idNumber}`);
      subs.forEach((sub, idx) => {
        const prob = problems.find(p => p._id === sub.problem?._id);
        const subFolder = studentCodeFolder.folder(`${prob?.title.replace(/\s+/g, '_') || 'Problem'}_Attempt_${idx + 1}`);
        
        if (sub.files && sub.files.length > 0) {
          sub.files.forEach(f => {
            subFolder.file(f.name, f.content);
          });
        } else {
          const ext = sub.language === 'cpp' ? 'cpp' : sub.language === 'python' ? 'py' : sub.language === 'java' ? 'java' : 'sh';
          subFolder.file(`solution.${ext}`, sub.code);
        }
        if (sub.customInput) subFolder.file('input.txt', sub.customInput);
      });
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contest.title.replace(/\s+/g, '_')}_Reports.zip`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Initializing Monitor...</div>;
  }

  if (!contest) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Contest not found</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Header */}
      <nav className="flex justify-between items-center p-6 bg-[#0a0a0a] border-b border-white/5 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link to="/faculty/dashboard" className="text-white/40 hover:text-white transition-colors">← Back</Link>
          <div className="h-4 w-px bg-white/10"></div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-3">
              {contest.title}
              {contest.isProctored && (
                <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-widest rounded-full">
                  🔒 Proctored
                </span>
              )}
            </h1>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{contest.status} • {problems.length} Problems</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {violations.length > 0 && (
            <button
              onClick={() => setActiveTab('violations')}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              <span className="text-red-400 text-[10px] font-bold uppercase tracking-widest">{violations.length} Violation{violations.length !== 1 ? 's' : ''}</span>
            </button>
          )}
          {lastUpdated && (
            <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest">
              ↻ {lastUpdated}
            </span>
          )}
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Tabs */}
        <aside className="w-64 border-r border-white/5 h-[calc(100vh-80px)] p-6 space-y-2 sticky top-[80px]">
          {['overview', 'problems', 'participants', 'submissions', 'violations'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${
                activeTab === tab ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-white/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              {tab}
              {tab === 'violations' && violations.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[8px] rounded-full">{violations.length}</span>
              )}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto h-[calc(100vh-80px)]">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">Contest Overview</h2>
                <div className="flex items-center gap-4">
                  {/* Proctored Mode Toggle */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-[#0d0d0d] border border-white/5 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Proctored Mode</span>
                    <button
                      onClick={handleToggleProctored}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        contest.isProctored ? 'bg-red-500' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          contest.isProctored ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${
                      contest.isProctored ? 'text-red-400' : 'text-white/20'
                    }`}>{contest.isProctored ? 'ON' : 'OFF'}</span>
                  </div>
                  <button 
                    onClick={handleDownloadAll}
                    className="px-6 py-2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download All Reports (ZIP)
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="p-6 bg-[#0d0d0d] border border-white/5 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Total Participants</p>
                  <p className="text-3xl font-bold text-white">{contest.participants?.length || 0}</p>
                </div>
                <div className="p-6 bg-[#0d0d0d] border border-white/5 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Total Problems</p>
                  <p className="text-3xl font-bold text-white">{problems.length}</p>
                </div>
                <div className="p-6 bg-[#0d0d0d] border border-white/5 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Live Submissions</p>
                  <p className="text-3xl font-bold text-emerald-400">{submissions.length}</p>
                </div>
              </div>
              {contest.isProctored && violations.length > 0 && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-4">
                  <span className="text-2xl">⚠</span>
                  <div>
                    <p className="text-xs font-bold text-red-400">Proctoring Alert</p>
                    <p className="text-[10px] text-white/40">{violations.length} violation(s) detected. Check the Violations tab.</p>
                  </div>
                  <button onClick={() => setActiveTab('violations')} className="ml-auto px-4 py-2 bg-red-500/10 text-red-400 text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-red-500/20">View</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'problems' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Problem Set</h2>
                <button 
                  onClick={openAddProblemModal}
                  className="px-6 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-blue-500 transition-colors"
                >
                  + Add Problem
                </button>
              </div>
              <div className="space-y-4">
                {problems.map(prob => (
                  <div key={prob._id} className="p-6 bg-[#0d0d0d] border border-white/5 rounded-2xl flex justify-between items-center hover:border-white/10 transition-colors">
                    <div>
                      <h3 className="text-lg font-bold">{prob.title}</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                        {prob.difficulty} • {prob.points} Points • {prob.gradingType} grading
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => openEditProblemModal(prob)} className="px-4 py-2 bg-white/5 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-white/10">Edit</button>
                      <button onClick={() => handleDeleteProblem(prob._id)} className="px-4 py-2 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-red-500/20">Delete</button>
                    </div>
                  </div>
                ))}
                {problems.length === 0 && (
                  <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl text-white/40 text-xs uppercase tracking-widest">
                    No problems added yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Enrolled Participants</h2>
              <div className="bg-[#0d0d0d] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">ID Number</th>
                      <th className="px-6 py-4">Grade (Auto)</th>
                      <th className="px-6 py-4">Violations</th>
                      {contest.isProctored && <th className="px-6 py-4">Lock Status</th>}
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contest.participants?.map(p => {
                      const studentViolations = violations.filter(v => v.student?._id === p._id);
                      const isStudentLocked = contest.lockedStudents?.some(s => (typeof s === 'object' ? s._id : s) === p._id);
                      return (
                        <tr key={p._id} className={`border-t border-white/5 ${isStudentLocked ? 'bg-red-500/5' : ''}`}>
                          <td className="px-6 py-4 font-bold">{p.name}</td>
                          <td className="px-6 py-4 font-mono text-white/60">{p.idNumber}</td>
                          <td className="px-6 py-4 text-emerald-400 font-bold">{calculateStudentGrade(p._id)}</td>
                          <td className="px-6 py-4">
                            {studentViolations.length > 0 ? (
                              <span className="text-red-400 font-bold">{studentViolations.length}</span>
                            ) : (
                              <span className="text-white/20">0</span>
                            )}
                          </td>
                          {contest.isProctored && (
                            <td className="px-6 py-4">
                              {isStudentLocked ? (
                                <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-bold uppercase tracking-widest rounded-full">🔒 Locked</span>
                              ) : (
                                <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase tracking-widest rounded-full">✓ Active</span>
                              )}
                            </td>
                          )}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {contest.isProctored && isStudentLocked && (
                                <button
                                  onClick={() => handleUnlockStudent(p._id)}
                                  disabled={unlockingId === p._id}
                                  className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                >
                                  {unlockingId === p._id ? 'Unlocking...' : 'Unlock'}
                                </button>
                              )}
                              <button 
                                onClick={() => handleKickStudent(p._id)}
                                className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-red-500/20 transition-colors"
                              >
                                Kick
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!contest.participants?.length && (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-white/40 uppercase tracking-widest">No participants yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-6">
              {!selectedStudent ? (
                <>
                  <h2 className="text-xl font-bold">Student Submissions</h2>
                  <div className="bg-[#0d0d0d] border border-white/5 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40">
                        <tr>
                          <th className="px-6 py-4">Student</th>
                          <th className="px-6 py-4">ID Number</th>
                          <th className="px-6 py-4">Total Submissions</th>
                          <th className="px-6 py-4">Accepted</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const grouped = {};
                          submissions.forEach(sub => {
                            const sid = sub.student?._id;
                            if (!sid) return;
                            if (!grouped[sid]) grouped[sid] = { student: sub.student, total: 0, accepted: 0 };
                            grouped[sid].total++;
                            if (sub.status === 'Accepted') grouped[sid].accepted++;
                          });
                          const students = Object.values(grouped);
                          if (students.length === 0) return (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-white/40 uppercase tracking-widest">No submissions yet</td></tr>
                          );
                          return students.map(s => (
                            <tr key={s.student._id} className="border-t border-white/5">
                              <td className="px-6 py-4 font-bold">{s.student.name}</td>
                              <td className="px-6 py-4 font-mono text-white/60">{s.student.idNumber}</td>
                              <td className="px-6 py-4 text-white/60">{s.total}</td>
                              <td className="px-6 py-4 text-emerald-400 font-bold">{s.accepted}</td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => setSelectedStudent(s.student)}
                                  className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-blue-500/20 transition-colors"
                                >View Submissions</button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => { setSelectedStudent(null); setViewingSubmission(null); }} className="text-white/40 hover:text-white text-xs font-bold">← Back to Students</button>
                    <div className="h-4 w-px bg-white/10" />
                    <h2 className="text-xl font-bold">{selectedStudent.name}'s Submissions</h2>
                  </div>

                  {!viewingSubmission ? (
                    <div className="bg-[#0d0d0d] border border-white/5 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40">
                          <tr>
                            <th className="px-6 py-4">#</th>
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4">Problem</th>
                            <th className="px-6 py-4">Language</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.filter(s => s.student?._id === selectedStudent._id).map((sub, i) => {
                            const prob = problems.find(p => p._id === sub.problem?._id);
                            return (
                            <tr key={sub._id} className={`border-t border-white/5 ${sub.isFinal ? 'bg-purple-500/5' : ''}`}>
                              <td className="px-6 py-4 font-mono text-white/30">
                                {i + 1}
                                {sub.isFinal && <span className="ml-2 text-[8px] bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded font-bold">FINAL</span>}
                              </td>
                              <td className="px-6 py-4 text-white/60">{new Date(sub.submittedAt).toLocaleTimeString()}</td>
                              <td className="px-6 py-4">{sub.problem?.title || 'Unknown'}</td>
                              <td className="px-6 py-4 font-mono">{sub.language}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                                  sub.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}>{sub.status}</span>
                                {prob?.gradingType === 'automatic' && (sub.points > 0 || sub.status === 'Accepted') && (
                                  <span className={`ml-2 text-[9px] font-bold ${sub.status === 'Accepted' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                    {(sub.points || 0).toFixed(1)} pts
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => { setViewingSubmission(sub); setRerunResults(null); }}
                                    className="px-3 py-1 bg-white/5 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-white/10 transition-colors"
                                  >View Code</button>
                                  <button
                                    onClick={() => { setViewingSubmission(sub); handleRerun(sub._id); }}
                                    className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-blue-500/20 transition-colors"
                                  >Run Code</button>
                                </div>
                              </td>
                            </tr>
                          )})}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <button onClick={() => { setViewingSubmission(null); setRerunResults(null); }} className="text-white/40 hover:text-white text-xs font-bold">← Back to List</button>
                        <div className="h-4 w-px bg-white/10" />
                        <div>
                          <p className="text-xs font-bold">{viewingSubmission.problem?.title}</p>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                            {viewingSubmission.language} • <span className={viewingSubmission.status === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}>{viewingSubmission.status}</span> • {viewingSubmission.executionTime}ms • {new Date(viewingSubmission.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <button
                            onClick={() => handleRerun(viewingSubmission._id)}
                            disabled={rerunning}
                            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${
                              rerunning ? 'bg-white/5 text-white/30' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            {rerunning ? (
                              <><span className="w-3 h-3 border border-white/20 border-t-emerald-400 rounded-full animate-spin" /> Running...</>
                            ) : (
                              <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> Run Code</>
                            )}
                          </button>
                        </div>                      <div className="space-y-4">
                        <div className="bg-[#080808] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                          <div className="flex gap-1 px-4 py-2 bg-black/40 border-b border-white/5 overflow-x-auto [&::-webkit-scrollbar]:h-0">
                            {(viewingSubmission.files?.length > 0 ? viewingSubmission.files : [{name: 'solution.' + (viewingSubmission.language === 'cpp' ? 'cpp' : viewingSubmission.language === 'python' ? 'py' : viewingSubmission.language === 'java' ? 'java' : 'sh'), content: viewingSubmission.code}]).map((f, i) => (
                              <button 
                                key={i} 
                                onClick={() => setViewingFileIndex(i)}
                                className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${viewingFileIndex === i ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}
                              >
                                {f.name} {viewingSubmission.mainFile === f.name ? '⚡' : ''}
                              </button>
                            ))}
                          </div>
                          <pre className="p-6 font-mono text-[12px] text-white/80 leading-relaxed overflow-auto max-h-[40vh] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10">
                            {(viewingSubmission.files?.length > 0 ? viewingSubmission.files[viewingFileIndex]?.content : viewingSubmission.code)}
                          </pre>
                        </div>
 
                        {viewingSubmission.customInput && (
                          <div className="bg-[#080808] border border-white/5 rounded-2xl overflow-hidden relative">
                            <div className="absolute top-2 right-4 text-[8px] font-bold uppercase tracking-widest text-white/10">input.txt</div>
                            <pre className="p-6 font-mono text-[12px] text-emerald-400/80 leading-relaxed overflow-auto max-h-[30vh] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10">{viewingSubmission.customInput}</pre>
                          </div>
                        )}
                      </div>

                      </div>

                      {/* Rerun Results */}
                      {rerunResults && (
                        <div className="space-y-3">
                          <div className={`flex items-center justify-between p-4 rounded-xl border ${
                            rerunResults.status === 'Accepted' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
                          }`}>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{rerunResults.status === 'Accepted' ? '✓' : '✗'}</span>
                              <div>
                                <p className={`text-sm font-black ${rerunResults.status === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}`}>{rerunResults.status}</p>
                                <p className="text-[10px] text-white/30 font-bold">{rerunResults.executionTime}ms • {rerunResults.memoryUsed}MB</p>
                              </div>
                            </div>
                          </div>
                          {rerunResults.sampleCases?.length > 0 && (
                            <div>
                              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-2">Sample Cases</p>
                              <div className="space-y-1">
                                {rerunResults.sampleCases.map((tc, i) => (
                                  <div key={i} className={`flex items-center gap-3 p-2 rounded-lg text-xs ${
                                    tc.passed ? 'bg-emerald-500/5 text-emerald-400' : 'bg-red-500/5 text-red-400'
                                  }`}>
                                    <span className="font-bold">{tc.passed ? '✓' : '✗'}</span>
                                    <span className="font-mono text-[10px] text-white/40">Input: {tc.input}</span>
                                    <span className="font-mono text-[10px] text-white/40">Expected: {tc.expectedOutput}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {rerunResults.hidden?.total > 0 && (
                            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-1">Hidden Cases</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                                  <div className={`h-full rounded-full ${rerunResults.hidden.passed === rerunResults.hidden.total ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${(rerunResults.hidden.passed / rerunResults.hidden.total) * 100}%` }} />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-white/50">{rerunResults.hidden.passed}/{rerunResults.hidden.total}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'violations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Proctoring Violations</h2>
                <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full border ${
                  contest.isProctored ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/10 text-white/30'
                }`}>{contest.isProctored ? '🔒 Proctored Mode Active' : 'Proctored Mode Off'}</span>
              </div>
              {violations.length === 0 ? (
                <div className="p-16 text-center border border-dashed border-white/10 rounded-2xl">
                  <p className="text-emerald-400 text-2xl mb-4">✓</p>
                  <p className="text-white/40 text-xs uppercase tracking-widest font-bold">No violations recorded</p>
                </div>
              ) : (
                <div className="bg-[#0d0d0d] border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40">
                      <tr>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Violation Type</th>
                        <th className="px-6 py-4">Details</th>
                        <th className="px-6 py-4">Time</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {violations.map((v) => {
                        const isStudentLocked = contest.lockedStudents?.some(s => (typeof s === 'object' ? s._id : s) === v.student?._id);
                        return (
                          <tr key={v._id} className="border-t border-white/5">
                            <td className="px-6 py-4 font-bold">{v.student?.name || 'Unknown'}</td>
                            <td className="px-6 py-4 font-mono text-white/50">{v.student?.idNumber}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-widest rounded">
                                {v.type?.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-white/40 max-w-[200px] truncate">{v.details}</td>
                            <td className="px-6 py-4 text-white/30 font-mono">{new Date(v.timestamp).toLocaleTimeString()}</td>
                            <td className="px-6 py-4 text-right">
                              {isStudentLocked ? (
                                <button
                                  onClick={() => handleUnlockStudent(v.student?._id)}
                                  disabled={unlockingId === v.student?._id}
                                  className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                >
                                  {unlockingId === v.student?._id ? 'Unlocking...' : 'Unlock Student'}
                                </button>
                              ) : (
                                <span className="text-[9px] text-emerald-400/50 uppercase tracking-widest font-bold">Unlocked</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Problem Modal */}
      {showProblemModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 py-12">
          <div className="w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden my-auto max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold">{editingProblemId ? 'Edit Problem' : 'Add New Problem'}</h2>
              </div>
              <button onClick={() => setShowProblemModal(false)} className="text-white/20 hover:text-white text-2xl">×</button>
            </div>

            <form onSubmit={handleProblemSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Title</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs" value={problemForm.title} onChange={e => setProblemForm({...problemForm, title: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Description (Markdown)</label>
                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs h-32" value={problemForm.description} onChange={e => setProblemForm({...problemForm, description: e.target.value})} required />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Difficulty</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white" value={problemForm.difficulty} onChange={e => setProblemForm({...problemForm, difficulty: e.target.value})}>
                    <option value="easy" className="bg-black">Easy</option><option value="medium" className="bg-black">Medium</option><option value="hard" className="bg-black">Hard</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Grading</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white" value={problemForm.gradingType} onChange={e => setProblemForm({...problemForm, gradingType: e.target.value})}>
                    <option value="automatic" className="bg-black">Automatic</option><option value="manual" className="bg-black">Manual</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Points</label>
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px]" value={problemForm.points} onChange={e => setProblemForm({...problemForm, points: parseInt(e.target.value)})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Tags</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px]" value={problemForm.tags} onChange={e => setProblemForm({...problemForm, tags: e.target.value})} />
                </div>
              </div>

              {/* Test Cases */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Test Cases</label>
                  <button type="button" onClick={handleAddTestCase} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest">+ Add Case</button>
                </div>
                {problemForm.testCases.map((tc, index) => (
                  <div key={index} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3 relative group">
                    {index > 0 && <button type="button" onClick={() => handleRemoveTestCase(index)} className="absolute top-4 right-4 text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100">×</button>}
                    <div className="grid grid-cols-2 gap-4">
                      <textarea placeholder="Input" className="w-full bg-white/5 rounded-lg px-3 py-2 text-[10px] font-mono h-16" value={tc.input} onChange={e => handleTestCaseChange(index, 'input', e.target.value)} required />
                      <textarea placeholder="Output" className="w-full bg-white/5 rounded-lg px-3 py-2 text-[10px] font-mono h-16" value={tc.output} onChange={e => handleTestCaseChange(index, 'output', e.target.value)} required />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={tc.isSample} onChange={e => handleTestCaseChange(index, 'isSample', e.target.checked)} />
                      <label className="text-[9px] uppercase tracking-widest text-white/40">Is Sample (Visible)</label>
                    </div>
                  </div>
                ))}
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all">Save Problem</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ContestMonitor;
