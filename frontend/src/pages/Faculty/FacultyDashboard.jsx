import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const FacultyDashboard = () => {
  const [contests, setContests] = useState([]);
  const [students, setStudents] = useState([]);
  const [systemStats, setSystemStats] = useState({ totalContests: 0, totalAppeared: 0, totalSubmissions: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContest, setNewContest] = useState({ title: '', description: '', startTime: '', endTime: '', accessKey: '', isProctored: false });
  
  const fileInputRef = useRef(null);
  const [uploadContestId, setUploadContestId] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.id || user.role !== 'faculty') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [contestRes, studentRes, sysRes] = await Promise.all([
          fetch(`http://localhost:5000/api/contests/faculty/${user.id}`),
          fetch(`http://localhost:5000/api/students`),
          fetch('http://localhost:5000/api/system/intelligence')
        ]);

        if (contestRes.ok) setContests(await contestRes.json());
        if (studentRes.ok) setStudents(await studentRes.json());
        if (sysRes.ok) setSystemStats(await sysRes.json());
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id, navigate]);

  const handleCreateContest = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newContest, createdBy: user.id })
      });
      if (response.ok) {
        const created = await response.json();
        setContests([...contests, created]);
        setShowCreateModal(false);
        setNewContest({ title: '', description: '', startTime: '', endTime: '', accessKey: '', isProctored: false });
      }
    } catch (error) { console.error(error); }
  };

  const handleTerminateContest = async (contestId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/contests/${contestId}`, { method: 'DELETE' });
      if (response.ok) setContests(contests.filter(c => c._id !== contestId));
    } catch (error) { console.error(error); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !uploadContestId) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const emails = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        jsonData.forEach(row => {
          row.forEach(cell => {
            if (typeof cell === 'string' && emailRegex.test(cell.trim())) {
              emails.push(cell.trim());
            }
          });
        });

        if (emails.length === 0) {
          alert('No valid emails found.');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/contests/${uploadContestId}/invite-bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emails })
        });

        if (response.ok) {
          const result = await response.json();
          let msg = `Successfully invited ${result.count} students!`;
          if (result.missingCount > 0) {
            msg += `\n\n${result.missingCount} emails were not found (not registered):\n${result.missingEmails.slice(0, 5).join(', ')}${result.missingCount > 5 ? '...' : ''}`;
          }
          alert(msg);
          
          const contestRes = await fetch(`http://localhost:5000/api/contests/faculty/${user.id}`);
          if (contestRes.ok) setContests(await contestRes.json());
        } else {
          alert('Failed to bulk invite students.');
        }
      } catch (error) {
        console.error(error);
        alert('An error occurred.');
      } finally {
        e.target.value = null;
        setUploadContestId(null);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 selection:bg-blue-500/30">
      <nav className="flex justify-between items-center mb-12 backdrop-blur-md sticky top-0 z-50 py-4 bg-black/50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tighter">CodeArena</h1>
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-bold uppercase tracking-widest rounded border border-blue-500/20">Faculty Command</span>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex gap-6 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">
            <Link to="/faculty/upcoming-contests" className="hover:text-white transition-all">Upcoming</Link>
            <Link to="/faculty/ended-contests" className="hover:text-white transition-all">Archives</Link>
            <Link to="/faculty/student-analytics" className="hover:text-white transition-all">Analytics</Link>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-[10px] font-bold">
              {user.name?.charAt(0)}
            </div>
            <span className="text-xs font-bold text-white/80">{user.name}</span>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-500/60 hover:text-red-500">Logout</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto space-y-12">
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black tracking-tight">Contest Command Center</h2>
              <div className="h-4 w-px bg-white/10"></div>
              <span className="text-[10px] text-blue-400 font-mono tracking-[0.2em] font-bold">{contests.length} ACTIVE DEPLOYMENTS</span>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="px-6 py-2.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all">Deploy New Contest</button>
          </div>

          {loading ? (
            <div className="h-60 flex items-center justify-center text-white/20 uppercase tracking-widest text-xs animate-pulse">Initializing Command Interface...</div>
          ) : contests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {contests.map(contest => (
                <div key={contest._id} className="group bg-[#0d0d0d] border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all flex flex-col justify-between relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center bg-white/5 border border-white/5 text-white/40">
                      <span className="text-[8px] font-bold">{new Date(contest.startTime).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-sm font-black">{new Date(contest.startTime).getDate()}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white/90 group-hover:text-blue-400 transition-colors line-clamp-1">{contest.title}</h3>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mt-1">{contest.participants?.length || 0} Students Invited</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setUploadContestId(contest._id); fileInputRef.current.click(); }} className="flex-1 py-2.5 bg-white/5 border border-white/5 text-white/40 text-[8px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400">Invite</button>
                      <button onClick={() => navigate(`/faculty/contest/${contest._id}/monitor`)} className="flex-1 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 hover:text-white">Monitor</button>
                    </div>
                    <button onClick={() => handleTerminateContest(contest._id)} className="w-full py-2 text-red-500/30 text-[7px] font-bold uppercase tracking-[0.3em] hover:text-red-500 transition-all">Terminate Deployment</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-16 text-center">
              <p className="text-white/20 text-xs uppercase tracking-[0.4em] font-bold mb-4">No Active Deployments</p>
              <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 bg-blue-600/10 text-blue-500 text-[10px] font-bold tracking-widest uppercase rounded-xl hover:bg-blue-600 hover:text-white transition-all">Start Your First Contest</button>
            </div>
          )}
        </section>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500"></div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold">Initialize Arena</h2>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Configure contest parameters</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-white/20 hover:text-white transition-colors text-2xl">×</button>
            </div>
            <form onSubmit={handleCreateContest} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Contest Title</label>
                <input type="text" placeholder="e.g. Data Structures Midterm" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500/50" value={newContest.title} onChange={e => setNewContest({...newContest, title: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Description</label>
                <textarea placeholder="Rules, instructions..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none h-24 resize-none" value={newContest.description} onChange={e => setNewContest({...newContest, description: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Start Time</label>
                  <input type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px]" value={newContest.startTime} onChange={e => setNewContest({...newContest, startTime: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">End Time</label>
                  <input type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px]" value={newContest.endTime} onChange={e => setNewContest({...newContest, endTime: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Access Password (Optional)</label>
                <input type="text" placeholder="e.g. AU2026_DS" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs" value={newContest.accessKey} onChange={e => setNewContest({...newContest, accessKey: e.target.value})} />
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-white/90">Proctored Mode</p>
                  <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Enforce fullscreen & block tab switching</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewContest({...newContest, isProctored: !newContest.isProctored})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${newContest.isProctored ? 'bg-red-500' : 'bg-white/10'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newContest.isProctored ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-blue-500 shadow-xl shadow-blue-900/20">Launch Arena Deployment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
