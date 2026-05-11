import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    idNumber: '' // Roll number or Faculty ID
  });
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role,
          idNumber: formData.idNumber
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Account created successfully! Please login.');
        navigate('/login');
      } else {
        alert(data.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('An error occurred during signup');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col justify-center items-center p-4 selection:bg-purple-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/5 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="text-4xl font-bold tracking-tighter bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            CodeArena
          </Link>
          <p className="text-slate-500 text-xs uppercase tracking-[0.3em] mt-2 font-medium">Join the Arena</p>
        </div>

        <div className="bg-[#0d0d0d]/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-8 shadow-2xl">
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

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Full Name</label>
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-white/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">
                {role === 'student' ? 'University Roll Number' : 'Faculty Employee ID'}
              </label>
              <input
                name="idNumber"
                type="text"
                required
                value={formData.idNumber}
                onChange={handleChange}
                placeholder={role === 'student' ? 'e.g. 202301001' : 'e.g. FAC-402'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-white/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">University Email</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-white/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-white/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Confirm</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-white/10"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-white text-black font-bold py-4 rounded-xl mt-4 hover:bg-slate-200 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Sign Up as {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/30 text-xs font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:underline underline-offset-4 decoration-purple-500/50">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
