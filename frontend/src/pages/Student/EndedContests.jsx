import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const EndedContests = () => {
  const [contests, setContests] = useState([]);
  const [selectedContest, setSelectedContest] = useState(null);
  const [contestData, setContestData] = useState({ problems: [], submissions: [] });
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [viewingCode, setViewingCode] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }

    const fetchContests = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/contests/student/${user.id}/participated/ended`);
        const data = await res.json();
        if (res.ok) {
          setContests(data);
        }
      } catch (error) {
        console.error('Error fetching contests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, [user.id, navigate]);

  const handleViewContest = async (contest) => {
    setSelectedContest(contest);
    setDetailsLoading(true);
    setViewingCode(null);
    try {
      // Fetch problems
      const probRes = await fetch(`http://localhost:5000/api/problems/contest/${contest._id}`);
      const problems = await probRes.json();

      // Fetch submissions
      const subRes = await fetch(`http://localhost:5000/api/submissions/student/${user.id}/contest/${contest._id}`);
      const submissions = await subRes.json();

      setContestData({ problems, submissions });
    } catch (error) {
      console.error('Error fetching contest details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 selection:bg-purple-500/30">
      {/* Focused Navigation */}
      <nav className="flex justify-between items-center mb-12 backdrop-blur-md sticky top-0 z-50 py-4 bg-black/50 border-b border-white/5">
        <div className="flex items-center gap-6">
          <Link to="/student/dashboard" className="text-white/40 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold flex items-center gap-2">
            <span>←</span> Dashboard
          </Link>
          <div className="h-4 w-px bg-white/10"></div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">Ended Archives</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Contests List */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/20 mb-6 px-2">Battle History</h2>
          {loading ? (
            <div className="p-12 text-center text-white/10 text-xs uppercase tracking-widest animate-pulse">Decrypting archives...</div>
          ) : contests.length > 0 ? (
            contests.map(contest => (
              <div 
                key={contest._id}
                onClick={() => handleViewContest(contest)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer group ${
                  selectedContest?._id === contest._id 
                  ? 'bg-white/5 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]' 
                  : 'bg-[#0d0d0d] border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="px-2 py-1 bg-white/5 rounded text-[8px] font-bold uppercase tracking-widest text-white/40">
                    {new Date(contest.endTime).toLocaleDateString()}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-white/10 group-hover:bg-purple-500 transition-colors"></div>
                </div>
                <h3 className="font-bold text-sm mb-1 group-hover:text-purple-400 transition-colors">{contest.title}</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">By {contest.createdBy?.name || 'Faculty'}</p>
              </div>
            ))
          ) : (
            <div className="p-12 border border-dashed border-white/5 rounded-2xl text-center">
              <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold">No completed missions</p>
            </div>
          )}
        </div>

        {/* Right: Detailed View */}
        <div className="lg:col-span-8">
          {selectedContest ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Contest Header */}
              <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-3xl p-8">
                <h2 className="text-2xl font-black mb-2">{selectedContest.title}</h2>
                <p className="text-xs text-white/40 leading-relaxed mb-6">{selectedContest.description}</p>
                <div className="flex gap-4">
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[8px] uppercase tracking-widest font-bold text-white/20 mb-1">Status</p>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Completed</p>
                  </div>
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[8px] uppercase tracking-widest font-bold text-white/20 mb-1">Duration</p>
                    <p className="text-[10px] font-bold text-white uppercase tracking-widest">
                      {Math.round((new Date(selectedContest.endTime) - new Date(selectedContest.startTime)) / 60000)} MIN
                    </p>
                  </div>
                </div>
              </div>

              {/* Problems & Submissions */}
              <div className="space-y-6">
                <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/20 px-2">Mission Debrief</h3>
                
                {detailsLoading ? (
                  <div className="p-20 flex justify-center items-center">
                    <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contestData.problems.map(problem => {
                      const problemSubmissions = contestData.submissions.filter(s => s.problem._id === problem._id);
                      const bestSubmission = problemSubmissions.find(s => s.status === 'Accepted') || problemSubmissions[0];

                      return (
                        <div key={problem._id} className="bg-[#0d0d0d] border border-white/5 rounded-2xl overflow-hidden">
                          <div className="p-6 flex justify-between items-center bg-white/[0.01]">
                            <div>
                              <h4 className="font-bold text-sm mb-1">{problem.title}</h4>
                              <div className="flex gap-3 items-center">
                                <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                                  problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' :
                                  problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                                  'bg-red-500/10 text-red-500'
                                }`}>
                                  {problem.difficulty}
                                </span>
                                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{problem.points} Points</span>
                              </div>
                            </div>
                            {bestSubmission ? (
                              <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                bestSubmission.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                              }`}>
                                {bestSubmission.status}
                              </div>
                            ) : (
                              <div className="text-[10px] font-bold text-white/10 uppercase tracking-widest">Unattempted</div>
                            )}
                          </div>
                          
                          {problemSubmissions.length > 0 && (
                            <div className="p-6 border-t border-white/5 space-y-4">
                              <p className="text-[8px] uppercase tracking-widest font-bold text-white/20">All Submissions</p>
                              <div className="space-y-2">
                                {problemSubmissions.map((sub, idx) => (
                                  <div key={sub._id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 group hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-6">
                                      <span className="text-[9px] font-bold text-white/30 w-4">#{problemSubmissions.length - idx}</span>
                                      <span className={`text-[9px] font-bold uppercase tracking-widest ${
                                        sub.status === 'Accepted' ? 'text-emerald-500' : 'text-red-500'
                                      }`}>
                                        {sub.status}
                                      </span>
                                      <span className="text-[9px] text-white/40 font-mono uppercase tracking-widest">{sub.language}</span>
                                      <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
                                        {new Date(sub.submittedAt).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    <button 
                                      onClick={() => setViewingCode(sub)}
                                      className="text-[9px] uppercase tracking-[0.2em] font-bold text-purple-400 opacity-0 group-hover:opacity-100 transition-all hover:text-purple-300"
                                    >
                                      View Artifacts
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[40px] text-center p-20">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <span className="text-white/10 text-2xl">📋</span>
              </div>
              <h3 className="text-white/20 text-xs uppercase tracking-[0.3em] font-bold mb-2">Select a Battle</h3>
              <p className="text-[9px] text-white/10 font-bold tracking-widest max-w-[200px]">Review your past performance and code archives from ended contests.</p>
            </div>
          )}
        </div>
      </div>

      {/* Code Viewer Modal */}
      {viewingCode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-4xl max-h-[80vh] bg-[#0d0d0d] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_100px_rgba(168,85,247,0.15)]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div>
                <h4 className="font-bold text-sm mb-1">{viewingCode.problem.title} Artifact</h4>
                <div className="flex gap-4 items-center">
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${viewingCode.status === 'Accepted' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {viewingCode.status}
                  </span>
                  <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                  <span className="text-[9px] text-white/40 font-mono uppercase tracking-widest">{viewingCode.language}</span>
                  <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                  <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
                    {new Date(viewingCode.submittedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setViewingCode(null)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-8 font-mono text-xs bg-black/40">
              <pre className="text-white/80 leading-relaxed">
                <code>{viewingCode.code}</code>
              </pre>
            </div>
            <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
              <div className="flex gap-8">
                <div>
                  <p className="text-[8px] uppercase tracking-widest font-bold text-white/20 mb-1">Execution</p>
                  <p className="text-[10px] font-bold text-white/80">{viewingCode.executionTime}ms</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-widest font-bold text-white/20 mb-1">Memory</p>
                  <p className="text-[10px] font-bold text-white/80">{viewingCode.memoryUsed}KB</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(viewingCode.code);
                  // Optional: add toast notification
                }}
                className="px-6 py-2 bg-purple-500/10 text-purple-400 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-purple-500 hover:text-white transition-all"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EndedContests;
