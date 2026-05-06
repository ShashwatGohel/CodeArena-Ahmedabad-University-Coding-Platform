import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const StudentAnalyticsFaculty = () => {
  const [systemStats, setSystemStats] = useState({ totalContests: 0, totalAppeared: 0, totalSubmissions: 0 });
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.id || user.role !== 'faculty') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const sysRes = await fetch('http://localhost:5000/api/system/intelligence');
        const sysData = await sysRes.json();
        if (sysRes.ok) setSystemStats(sysData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id, navigate]);

  return (
    <div className="min-h-screen bg-black text-white p-8 selection:bg-blue-500/30">
      {/* Navigation Header */}
      <nav className="flex justify-between items-center mb-12 backdrop-blur-md sticky top-0 z-50 py-4 bg-black/50 border-b border-white/5">
        <div className="flex items-center gap-6">
          <Link to="/faculty/dashboard" className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors">
            ← Dashboard
          </Link>
          <div className="h-4 w-px bg-white/10"></div>
          <h1 className="text-xl font-bold tracking-tighter">System Intelligence</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-[10px] font-bold uppercase">
              {user.name?.charAt(0)}
            </div>
            <span className="text-xs font-bold text-white/80">{user.name}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto space-y-12">
        <section>
          <div className="mb-10">
            <h2 className="text-3xl font-black tracking-tight mb-2">Platform Performance</h2>
            <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-bold">Real-time system metrics and engagement data</p>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center bg-[#0d0d0d] border border-white/5 rounded-2xl">
              <div className="w-8 h-8 border-2 border-white/5 border-t-white/40 rounded-full animate-spin mb-4"></div>
              <p className="text-white/20 uppercase tracking-widest text-[9px] font-bold">Synchronizing Data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Total Contests', value: systemStats.totalContests, color: 'text-blue-400', desc: 'Arenas deployed' },
                { label: 'Unique Students', value: systemStats.totalAppeared, color: 'text-emerald-400', desc: 'Active participants' },
                { label: 'Total Submissions', value: systemStats.totalSubmissions, color: 'text-purple-400', desc: 'Logic artifacts' }
              ].map((stat, i) => (
                <div key={i} className="group bg-[#0d0d0d] border border-white/5 rounded-2xl p-10 hover:border-white/10 transition-all">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-6">{stat.label}</p>
                  <p className={`text-6xl font-black ${stat.color} mb-4 tracking-tighter`}>{stat.value}</p>
                  <p className="text-[9px] text-white/10 font-bold uppercase tracking-widest">{stat.desc}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-10 max-w-2xl">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/20 mb-8">Engine Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Judge Engine</span>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold uppercase tracking-widest rounded-full">Operational</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Database Sync</span>
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[8px] font-bold uppercase tracking-widest rounded-full">Active</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Security Layer</span>
              <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-[8px] font-bold uppercase tracking-widest rounded-full">Verified</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentAnalyticsFaculty;
