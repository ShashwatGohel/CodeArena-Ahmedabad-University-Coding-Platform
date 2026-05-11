import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SubjectList = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.id || user.role !== 'faculty') {
      navigate('/login');
      return;
    }

    const fetchSubjects = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/subjects/faculty/${user.id}`);
        if (response.ok) {
          setSubjects(await response.json());
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [user.id, navigate]);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSubject, createdBy: user.id })
      });
      if (response.ok) {
        const created = await response.json();
        setSubjects([...subjects, created]);
        setShowCreateModal(false);
        setNewSubject({ name: '', description: '' });
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 selection:bg-blue-500/30">
      <nav className="flex justify-between items-center mb-12 backdrop-blur-md sticky top-0 z-50 py-4 bg-black/50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tighter">CodeArena</h1>
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-bold uppercase tracking-widest rounded border border-blue-500/20">Faculty Command</span>
        </div>
        <div className="flex items-center gap-8">
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
              <h2 className="text-2xl font-black tracking-tight">Your Classrooms</h2>
              <div className="h-4 w-px bg-white/10"></div>
              <span className="text-[10px] text-blue-400 font-mono tracking-[0.2em] font-bold">{subjects.length} ACTIVE</span>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="px-6 py-2.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all">Create Subject</button>
          </div>

          {loading ? (
            <div className="h-60 flex items-center justify-center text-white/20 uppercase tracking-widest text-xs animate-pulse">Initializing Interface...</div>
          ) : subjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {subjects.map(subject => (
                <div key={subject._id} onClick={() => navigate(`/faculty/subject/${subject._id}`)} className="group bg-[#0d0d0d] border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all flex flex-col justify-between cursor-pointer">
                  <div>
                    <h3 className="font-bold text-white/90 group-hover:text-blue-400 transition-colors text-lg mb-2">{subject.name}</h3>
                    <p className="text-xs text-white/40 line-clamp-2">{subject.description}</p>
                  </div>
                  <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-4">
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Students: {subject.students?.length || 0}</span>
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">TAs: {subject.teachingAssistants?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-16 text-center">
              <p className="text-white/20 text-xs uppercase tracking-[0.4em] font-bold mb-4">No Classrooms Available</p>
              <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 bg-blue-600/10 text-blue-500 text-[10px] font-bold tracking-widest uppercase rounded-xl hover:bg-blue-600 hover:text-white transition-all">Create Your First Subject</button>
            </div>
          )}
        </section>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500"></div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold">New Classroom</h2>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Configure subject details</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-white/20 hover:text-white transition-colors text-2xl">×</button>
            </div>
            <form onSubmit={handleCreateSubject} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Subject Name</label>
                <input type="text" placeholder="e.g. Data Structures 101" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500/50" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Description</label>
                <textarea placeholder="Course description..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none h-24 resize-none" value={newSubject.description} onChange={e => setNewSubject({...newSubject, description: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-blue-500 shadow-xl shadow-blue-900/20">Create Subject</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectList;
