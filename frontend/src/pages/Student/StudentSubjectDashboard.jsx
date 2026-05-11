import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const StudentSubjectDashboard = () => {
  const { id } = useParams();
  const [subject, setSubject] = useState(null);
  const [contests, setContests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.id || user.role !== 'student') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
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

    fetchData();
  }, [id, user.id, navigate]);

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

  if (loading || !subject) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Classroom...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 selection:bg-purple-500/30">
      <nav className="flex justify-between items-center mb-12 backdrop-blur-md sticky top-0 z-50 py-4 bg-black/50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link to="/student/dashboard" className="text-white/40 hover:text-white transition-colors">← Back to Classrooms</Link>
          <div className="h-4 w-px bg-white/10"></div>
          <h1 className="text-2xl font-bold tracking-tighter">{subject.name}</h1>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold uppercase">
              {user.name?.charAt(0) || 'S'}
            </div>
            <span className="text-xs font-bold text-white/80">{user.name}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-12">
          {/* Contests Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold tracking-tight">Active Arenas</h2>
            </div>

            {ongoingContests.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {ongoingContests.map(contest => (
                  <div key={contest._id} className="group bg-[#0d0d0d] border border-white/5 rounded-2xl p-8 hover:border-purple-500/30 transition-all flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[8px] text-purple-400 font-bold uppercase tracking-widest">Ongoing</span>
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

          {/* Assignments Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold tracking-tight">Assignments</h2>
            </div>
            {assignments.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {assignments.map(assignment => (
                  <div key={assignment._id} className="group bg-[#0d0d0d] border border-white/5 rounded-2xl p-8 hover:border-purple-500/30 transition-all flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[8px] text-purple-400 font-bold uppercase tracking-widest">DUE {new Date(assignment.dueDate).toLocaleString()}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">{assignment.title}</h3>
                      <p className="text-xs text-white/40 max-w-lg line-clamp-2">{assignment.description}</p>
                    </div>
                    <button className="px-8 py-3 bg-white/5 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-purple-500 transition-all active:scale-95 border border-white/10">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center">
                <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold">No Pending Assignments</p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
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
                <p className="text-[8px] text-white/10 uppercase tracking-widest font-bold text-center py-8">No Upcoming Arenas</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentSubjectDashboard;
