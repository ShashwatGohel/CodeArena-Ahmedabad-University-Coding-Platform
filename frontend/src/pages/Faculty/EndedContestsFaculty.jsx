import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const EndedContestsFaculty = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.id || user.role !== 'faculty') {
      navigate('/login');
      return;
    }

    const fetchContests = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/contests/faculty/${user.id}`);
        const data = await res.json();
        if (res.ok) {
          const ended = data.filter(c => new Date(c.endTime) < new Date());
          setContests(ended);
        }
      } catch (error) {
        console.error('Error fetching ended contests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, [user.id, navigate]);

  return (
    <div className="min-h-screen bg-black text-white p-8 selection:bg-blue-500/30">
      <nav className="flex justify-between items-center mb-12 backdrop-blur-md sticky top-0 z-50 py-4 bg-black/50 border-b border-white/5">
        <div className="flex items-center gap-6">
          <Link to="/faculty/dashboard" className="text-white/40 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold flex items-center gap-2">
            <span>←</span> Dashboard
          </Link>
          <div className="h-4 w-px bg-white/10"></div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">Ended archives</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-[10px] font-bold uppercase">
              {user.name?.charAt(0)}
            </div>
            <span className="text-xs font-bold text-white/80">{user.name}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Battle History</h2>
            <p className="text-white/30 text-[10px] uppercase tracking-[0.4em] font-bold">Past missions and student performance archives</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-white/10">{contests.length}</p>
            <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Ended Missions</p>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-white/10 text-xs uppercase tracking-widest animate-pulse">Decrypting archives...</div>
        ) : contests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contests.map(contest => (
              <div key={contest._id} className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-8 hover:border-blue-500/30 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] font-bold text-white/40 uppercase tracking-widest">
                    {new Date(contest.endTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{contest.title}</h3>
                <p className="text-xs text-white/40 line-clamp-2 mb-8 leading-relaxed">{contest.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 text-center">
                    <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold mb-1">Participants</p>
                    <p className="text-sm font-black">{contest.participants?.length || 0}</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 text-center">
                    <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold mb-1">Submissions</p>
                    <p className="text-sm font-black text-purple-400">Review</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => navigate(`/faculty/contest/${contest._id}/monitor?tab=submissions`)}
                    className="flex-1 py-3 bg-white/5 border border-white/5 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    Review Student Code
                  </button>
                  <button 
                    onClick={() => navigate(`/faculty/contest/${contest._id}/monitor?tab=participants`)}
                    className="flex-1 py-3 bg-blue-600/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-900/10"
                  >
                    View Results
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[40px] text-center">
            <p className="text-white/20 text-xs uppercase tracking-widest font-bold">No completed missions in the archives</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndedContestsFaculty;
