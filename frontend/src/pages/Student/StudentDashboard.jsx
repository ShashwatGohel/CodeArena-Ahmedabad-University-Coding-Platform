import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [contests, setContests] = useState([]);
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
        // Fetch Contests
        const contestRes = await fetch(`http://localhost:5000/api/contests/student/${user.id}`);
        const contestData = await contestRes.json();
        if (contestRes.ok) setContests(contestData);

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

  const now = new Date();
  
  const ongoingContests = contests.filter(c => {
    const start = new Date(c.startTime);
    const end = new Date(c.endTime);
    return now >= start && now <= end;
  });
  
  const futureContests = contests.filter(c => {
    const start = new Date(c.startTime);
    return now < start;
  });
  
  const endedContestsCount = contests.filter(c => {
    const end = new Date(c.endTime);
    return now > end;
  }).length;

  const getGoogleCalendarLink = (contest) => {
    const formatTime = (dateStr) => new Date(dateStr).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const startTime = formatTime(contest.startTime);
    const endTime = formatTime(contest.endTime);
    const details = encodeURIComponent(`${contest.description}\n\nOrganized by: ${contest.createdBy?.name || 'CodeArena'}`);
    const title = encodeURIComponent(`CodeArena: ${contest.title}`);
    
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}`;
  };

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
              {endedContestsCount > 0 && (
                <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-[7px]">
                  {endedContestsCount}
                </span>
              )}
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

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-12">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold tracking-tight">Active Arenas</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Live Sync</span>
              </div>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center text-white/20 uppercase tracking-widest text-xs animate-pulse">
                Synchronizing Arena...
              </div>
            ) : ongoingContests.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {ongoingContests.map(contest => (
                  <div key={contest._id} className="group bg-[#0d0d0d] border border-white/5 rounded-2xl p-8 hover:border-purple-500/30 transition-all flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[8px] text-purple-400 font-bold uppercase tracking-widest">Ongoing</span>
                        <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">By {contest.createdBy?.name || 'Faculty'}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">{contest.title}</h3>
                      <p className="text-xs text-white/40 max-w-lg line-clamp-2">{contest.description}</p>
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/student/contest/${contest._id}/arena`)}
                      className="px-8 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-purple-500 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95"
                    >
                      Enter Arena
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center">
                <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold">No Active Arenas</p>
              </div>
            )}
          </section>

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
        </div>

        {/* Tactical Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-6">
            <h2 className="text-[10px] uppercase tracking-widest font-bold text-white/20 mb-6">Upcoming Contests</h2>
            <div className="space-y-4">
              {futureContests.length > 0 ? (
                futureContests.map(contest => (
                  <div key={contest._id} className="p-4 bg-white/5 rounded-xl border border-white/5 group">
                    <div className="flex gap-4 items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-white/5 rounded-lg flex flex-col items-center justify-center border border-white/5">
                        <span className="text-[7px] font-bold text-white/40 uppercase">{new Date(contest.startTime).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-sm font-black">{new Date(contest.startTime).getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[10px] font-bold truncate text-white/90 mb-0.5 uppercase">{contest.title}</h4>
                        <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest">{new Date(contest.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[8px] text-white/10 uppercase tracking-widest font-bold text-center py-8">Awaiting Future Orders</p>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;