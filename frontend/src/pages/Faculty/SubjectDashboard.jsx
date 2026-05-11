import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';

const SubjectDashboard = () => {
  const { id } = useParams();
  const [subject, setSubject] = useState(null);
  const [contests, setContests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateContestModal, setShowCreateContestModal] = useState(false);
  const [newContest, setNewContest] = useState({ title: '', description: '', startTime: '', endTime: '', accessKey: '', isProctored: false });
  
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '' });

  const [showInviteTAModal, setShowInviteTAModal] = useState(false);
  const [taEmail, setTaEmail] = useState('');

  const fileInputRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.id || user.role !== 'faculty') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [id, user.id, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subjectRes, contestRes, assignmentRes] = await Promise.all([
        fetch(`http://localhost:5000/api/subjects/${id}`),
        fetch(`http://localhost:5000/api/subjects/${id}/contests`),
        fetch(`http://localhost:5000/api/subjects/${id}/assignments`)
      ]);

      if (subjectRes.ok) setSubject(await subjectRes.json());
      if (contestRes.ok) setContests(await contestRes.json());
      if (assignmentRes.ok) setAssignments(await assignmentRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContest = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newContest, createdBy: user.id, subjectId: id })
      });
      if (response.ok) {
        const created = await response.json();
        setContests([...contests, created]);
        setShowCreateContestModal(false);
        setNewContest({ title: '', description: '', startTime: '', endTime: '', accessKey: '', isProctored: false });
      }
    } catch (error) { console.error(error); }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAssignment, createdBy: user.id, subjectId: id })
      });
      if (response.ok) {
        const created = await response.json();
        setAssignments([...assignments, created]);
        setShowCreateAssignmentModal(false);
        setNewAssignment({ title: '', description: '', dueDate: '' });
      }
    } catch (error) { console.error(error); }
  };

  const handleInviteTA = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/subjects/${id}/invite-ta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: taEmail })
      });
      if (response.ok) {
        alert('TA Invited successfully');
        setShowInviteTAModal(false);
        setTaEmail('');
        fetchData();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to invite TA');
      }
    } catch (error) {
      console.error(error);
      alert('Error inviting TA');
    }
  };

  const handleBulkInviteStudents = (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

        const response = await fetch(`http://localhost:5000/api/subjects/${id}/invite-students`, {
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
          fetchData();
        } else {
          alert('Failed to bulk invite students.');
        }
      } catch (error) {
        console.error(error);
        alert('An error occurred.');
      } finally {
        e.target.value = null;
      }
    };
    reader.readAsBinaryString(file);
  };

  if (loading || !subject) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Classroom...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 selection:bg-blue-500/30">
      <nav className="flex justify-between items-center mb-12 backdrop-blur-md sticky top-0 z-50 py-4 bg-black/50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link to="/faculty/dashboard" className="text-white/40 hover:text-white transition-colors">← Back to Classrooms</Link>
          <div className="h-4 w-px bg-white/10"></div>
          <h1 className="text-2xl font-bold tracking-tighter">{subject.name}</h1>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-[10px] font-bold">
              {user.name?.charAt(0)}
            </div>
            <span className="text-xs font-bold text-white/80">{user.name}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto space-y-12">
        <section className="bg-white/5 border border-white/10 rounded-3xl p-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold mb-2">Classroom Management</h2>
            <div className="flex gap-6 text-[10px] uppercase tracking-widest text-white/40 font-bold">
              <span>{subject.students?.length || 0} Students</span>
              <span>{subject.teachingAssistants?.length || 0} Teaching Assistants</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowInviteTAModal(true)} className="px-6 py-2.5 bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white transition-all">Invite TA</button>
            <button onClick={() => fileInputRef.current.click()} className="px-6 py-2.5 bg-blue-600/20 text-blue-500 border border-blue-500/30 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all">Bulk Invite Students</button>
            <input type="file" ref={fileInputRef} onChange={handleBulkInviteStudents} accept=".xlsx, .xls, .csv" className="hidden" />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black tracking-tight">Active Contests</h2>
            <button onClick={() => setShowCreateContestModal(true)} className="px-6 py-2.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all">Deploy Contest</button>
          </div>
          {contests.length > 0 ? (
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
                      <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mt-1">{contest.status}</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/faculty/contest/${contest._id}/monitor`)} className="w-full py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 hover:text-white">Monitor</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm">No contests deployed yet.</p>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black tracking-tight">Assignments</h2>
            <button onClick={() => setShowCreateAssignmentModal(true)} className="px-6 py-2.5 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-purple-500 transition-all">Deploy Assignment</button>
          </div>
          {assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {assignments.map(assignment => (
                <div key={assignment._id} className="group bg-[#0d0d0d] border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-all flex flex-col justify-between relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center bg-white/5 border border-white/5 text-white/40">
                      <span className="text-[8px] font-bold">DUE</span>
                      <span className="text-sm font-black">{new Date(assignment.dueDate).getDate()}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white/90 group-hover:text-purple-400 transition-colors line-clamp-1">{assignment.title}</h3>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mt-1">{assignment.status}</p>
                    </div>
                  </div>
                  <button className="w-full py-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-bold uppercase tracking-widest rounded-xl hover:bg-purple-500 hover:text-white">Manage</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm">No assignments deployed yet.</p>
          )}
        </section>
      </div>

      {showInviteTAModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#0d0d0d] border border-white/10 rounded-3xl p-8 relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Invite Teaching Assistant</h2>
              <button onClick={() => setShowInviteTAModal(false)} className="text-white/20 hover:text-white text-2xl">×</button>
            </div>
            <form onSubmit={handleInviteTA} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">TA Email Address</label>
                <input type="email" placeholder="faculty@university.edu" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs mt-2 focus:outline-none focus:border-emerald-500/50" value={taEmail} onChange={e => setTaEmail(e.target.value)} required />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-500">Send Invite</button>
            </form>
          </div>
        </div>
      )}

      {showCreateContestModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-3xl p-8 relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Deploy Contest</h2>
              <button onClick={() => setShowCreateContestModal(false)} className="text-white/20 hover:text-white text-2xl">×</button>
            </div>
            <form onSubmit={handleCreateContest} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Title</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs mt-2" value={newContest.title} onChange={e => setNewContest({...newContest, title: e.target.value})} required />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Description</label>
                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs mt-2 h-20" value={newContest.description} onChange={e => setNewContest({...newContest, description: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Start Time</label>
                  <input type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] mt-2" value={newContest.startTime} onChange={e => setNewContest({...newContest, startTime: e.target.value})} required />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">End Time</label>
                  <input type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] mt-2" value={newContest.endTime} onChange={e => setNewContest({...newContest, endTime: e.target.value})} required />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 mt-4">Create Contest</button>
            </form>
          </div>
        </div>
      )}

      {showCreateAssignmentModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-3xl p-8 relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Deploy Assignment</h2>
              <button onClick={() => setShowCreateAssignmentModal(false)} className="text-white/20 hover:text-white text-2xl">×</button>
            </div>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Title</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs mt-2" value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} required />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Description</label>
                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs mt-2 h-20" value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} required />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Due Date</label>
                <input type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] mt-2" value={newAssignment.dueDate} onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})} required />
              </div>
              <button type="submit" className="w-full py-4 bg-purple-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-purple-500 mt-4">Create Assignment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectDashboard;
