import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SubjectSelection = () => {
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
        const res = await fetch(`http://localhost:5000/api/subjects/faculty/${user.id}`);
        if (res.ok) setSubjects(await res.json());
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
        setSubjects([created, ...subjects]);
        setShowCreateModal(false);
        setNewSubject({ name: '', description: '' });
      }
    } catch (error) { console.error(error); }
  };

  const handleSubjectClick = (subjectId) => {
    navigate(`/faculty/dashboard?subjectId=${subjectId}`);
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

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-2">My Subjects</h2>
            <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Select a subject to manage contests and assignments</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20"
          >
            Create New Subject
          </button>
        </div>

        {loading ? (
          <div className="h-60 flex items-center justify-center text-white/20 uppercase tracking-widest text-xs animate-pulse">Synchronizing Subject Data...</div>
        ) : subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map(subject => (
              <div 
                key={subject._id} 
                onClick={() => handleSubjectClick(subject._id)}
                className="group bg-[#0d0d0d] border border-white/5 rounded-3xl p-8 hover:border-blue-500/30 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      →
                   </div>
                </div>
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-white/5 flex items-center justify-center mb-4 text-xl font-black text-blue-400">
                    {subject.name.charAt(0)}
                  </div>
                  <h3 className="text-xl font-bold text-white/90 group-hover:text-blue-400 transition-colors mb-2">{subject.name}</h3>
                  <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{subject.description || 'No description provided.'}</p>
                </div>
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Active Curriculum</span>
                  <span className="text-[10px] text-blue-400/60 font-mono">ID: {subject._id.substring(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0d0d0d] border border-dashed border-white/10 rounded-[3rem] p-24 text-center">
             <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8 border border-white/5">
                <span className="text-4xl">📚</span>
             </div>
             <h3 className="text-xl font-bold mb-2">No subjects found</h3>
             <p className="text-white/30 text-xs mb-8 uppercase tracking-widest font-bold">Start by creating your first subject to organize your work</p>
             <button 
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-3 bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-white hover:text-black transition-all"
             >
                Create Subject
             </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500"></div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black">New Subject</h2>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Organize your contests and student data</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-white/20 hover:text-white transition-colors text-3xl">×</button>
            </div>
            <form onSubmit={handleCreateSubject} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Subject Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Data Structures & Algorithms" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all" 
                  value={newSubject.name} 
                  onChange={e => setNewSubject({...newSubject, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Description</label>
                <textarea 
                  placeholder="Briefly describe the curriculum..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none h-32 resize-none focus:border-blue-500/50 transition-all" 
                  value={newSubject.description} 
                  onChange={e => setNewSubject({...newSubject, description: e.target.value})} 
                />
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-500 shadow-xl shadow-blue-900/40 transition-all transform hover:-translate-y-1">Create Subject Registry</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectSelection;
