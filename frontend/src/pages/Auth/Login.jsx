  import React, { useState } from 'react';
  import { useNavigate, Link } from 'react-router-dom';

  const Login = () => {
    const [role, setRole] = useState('student');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          if (data.user.role === 'student') {
            navigate('/student/dashboard');
          } else {
            navigate('/faculty/dashboard');
          }
        } else {
          alert(data.message || 'Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
      }
    };

    return (
      <div className="min-h-screen w-full bg-black text-white flex flex-col justify-center items-center p-4 selection:bg-purple-500/30">
        {/* Background Glow */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/5 blur-[100px] rounded-full"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Logo/Title */}
          <div className="text-center mb-10">
            <Link to="/" className="text-4xl font-bold tracking-tighter bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              CodeArena
            </Link>
            <p className="text-slate-500 text-xs uppercase tracking-[0.3em] mt-2 font-medium">Welcome Back</p>
          </div>

          {/* Card */}
          <div className="bg-[#0d0d0d]/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-8 shadow-2xl">
            {/* Role Toggle */}
            <div className="flex bg-white/5 p-1 rounded-xl mb-8">
              <button
                onClick={() => setRole('student')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                  role === 'student' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
                }`}
              >
                Student
              </button>
              <button
                onClick={() => setRole('faculty')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                  role === 'faculty' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
                }`}
              >
                Faculty
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-white/10"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Password</label>
                  <Link to="/forgot-password" data-id="forgot-password-link" className="text-[10px] uppercase tracking-widest text-purple-400/60 hover:text-purple-400 font-bold transition-colors">Forgot?</Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-white/10"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-slate-200 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                Login as {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-white/30 text-xs font-medium">
                Don't have an account?{' '}
                <Link to="/signup" className="text-white hover:underline underline-offset-4 decoration-purple-500/50">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default Login;
