import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({ 
    rank: '--', 
    rating: '--', 
    solved: '--', 
    winRate: '--', 
    contestsGiven: '--', 
    bestRank: '--', 
    lastContestPerf: '--',
    reminders: [] 
  });
  const [loading, setLoading] = useState(true);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch Subjects
        const subjectRes = await fetch(`http://localhost:5000/api/subjects/student/${user.id}`);
        const subjectData = await subjectRes.json();
        if (subjectRes.ok) setSubjects(subjectData);

        // Fetch Stats
        const statsRes = await fetch(`http://localhost:5000/api/students/stats/${user.id}`);
        const statsData = await statsRes.json();
        if (statsRes.ok) setStats(statsData);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id, navigate]);

  return (
    <div className="min-h-screen bg-black text-white p-8 selection:bg-purple-500/30">
      {/* Navigation Header */}
      <nav className="flex justify-between items-center mb-12 backdrop-blur-md sticky top-0 z-50 py-4 bg-black/50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tighter">CodeArena</h1>
          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[8px] font-bold uppercase tracking-widest rounded border border-purple-500/20">Student Dashboard</span>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex gap-6 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">
            <Link to="/student/ended-contests" className="hover:text-white transition-colors flex items-center gap-2">
              Archives
            </Link>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold uppercase">
              {user.name?.charAt(0) || 'S'}
            </div>
            <span className="text-xs font-bold text-white/80">{user.name || 'Student'}</span>
          </div>
          <button 
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-500/60 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Performance Architecture */}
        <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-8">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/20 mb-8">Performance Intel</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Best Rank', value: stats.bestRank, color: 'text-emerald-400' },
              { label: 'Contests', value: stats.contestsGiven, color: 'text-purple-400' },
              { label: 'Batch Perf', value: stats.lastContestPerf, color: 'text-blue-400' },
              { label: 'Solved', value: stats.solved, color: 'text-white' }
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-[8px] uppercase tracking-widest font-bold text-white/30 mb-2">{stat.label}</p>
                <p className={`text-2xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Main Content Area */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold tracking-tight">My Classrooms</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Live Sync</span>
            </div>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-white/20 uppercase tracking-widest text-xs animate-pulse">
              Loading Classrooms...
            </div>
          ) : subjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map(subject => (
                <div key={subject._id} onClick={() => navigate(`/student/subject/${subject._id}`)} className="group bg-[#0d0d0d] border border-white/5 rounded-2xl p-8 hover:border-purple-500/30 transition-all flex flex-col justify-between shadow-xl cursor-pointer">
                  <div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">{subject.name}</h3>
                    <p className="text-xs text-white/40 max-w-lg line-clamp-2">{subject.description}</p>
                  </div>
                  <div className="mt-6 flex items-center gap-2">
                    <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">By {subject.createdBy?.name || 'Faculty'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center">
              <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold">No Classrooms Found</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;