import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const TerminalBlock = () => {
  const commands = [
    'sudo rm -rf /social/life --no-preserve-root',
    'codearena init --mode full-stack-panic',
    'sandbox run --isolation-from-reality'
  ];

  const [visibleCommands, setVisibleCommands] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [commandIndex, setCommandIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (commandIndex < commands.length) {
      if (charIndex < commands[commandIndex].length) {
        const timeout = setTimeout(() => {
          setCurrentText(prev => prev + commands[commandIndex][charIndex]);
          setCharIndex(prev => prev + 1);
        }, 40);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setVisibleCommands(prev => [...prev, commands[commandIndex]]);
          setCurrentText('');
          setCharIndex(0);
          setCommandIndex(prev => prev + 1);
        }, 600);
        return () => clearTimeout(timeout);
      }
    }
  }, [charIndex, commandIndex, commands]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#0d0d0d]/90 backdrop-blur-3xl rounded-xl overflow-hidden shadow-[0_0_80px_-20px_rgba(168,85,247,0.15)] border border-white/5 font-mono">
      {/* Mac-style Title Bar */}
      <div className="bg-white/5 px-4 py-3 flex items-center gap-2 border-b border-white/5">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <div className="text-white/20 text-[10px] uppercase tracking-[0.4em] mx-auto pr-12 font-sans font-bold">zsh</div>
      </div>

      {/* Terminal Content */}
      <div className="p-10 space-y-4 text-left min-h-[260px]">
        <div className="flex gap-3 text-white/20 mb-6">
          <span>$</span>
          <span className="text-white/40 italic">whoami</span>
          <span className="text-emerald-500/60 font-bold animate-pulse">nobody</span>
        </div>

        {visibleCommands.map((cmd, index) => (
          <div key={index} className="flex gap-3 text-emerald-400/80 leading-tight">
            <span className="text-purple-500/40 font-bold">$</span>
            <span className="tracking-tight">{cmd}</span>
          </div>
        ))}

        {commandIndex < commands.length && (
          <div className="flex gap-3 text-emerald-400/80 leading-tight">
            <span className="text-purple-500/40 font-bold">$</span>
            <span className="tracking-tight">{currentText}</span>
            <span className="w-2 h-5 bg-purple-500/40 animate-pulse ml-[-2px]"></span>
          </div>
        )}

        {commandIndex === commands.length && (
          <div className="flex gap-3 text-emerald-400/80 pt-1">
            <span className="text-purple-500/40 font-bold">$</span>
            <span className="w-2 h-5 bg-purple-500/40 animate-pulse"></span>
          </div>
        )}
      </div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full bg-black text-white selection:bg-purple-500/30 overflow-hidden flex flex-col items-center">
      {/* Sleek Header */}
      <nav className="fixed top-0 w-full px-8 py-6 flex justify-between items-center z-50 backdrop-blur-sm">
        <div className="text-xl font-bold tracking-tighter">CodeArena</div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 hover:text-white transition-colors">Login</Link>
          <Link to="/signup" className="bg-white text-black px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-slate-200 transition-all active:scale-[0.98]">Get Started</Link>
        </div>
      </nav>

      {/* Deep Glow Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/5 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl px-4 text-center mt-20 flex-1 flex flex-col justify-center">
        {/* Main Section */}
        <div className="mb-20 space-y-8">
          <div className="space-y-2">
            <h1 className="font-heading text-8xl md:text-[9rem] font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              CodeArena
            </h1>
            <div className="flex items-center justify-center gap-4 opacity-50">
              <div className="h-px w-8 bg-white"></div>
              <span className="font-heading text-[10px] uppercase tracking-[0.4em] font-medium">Established 2026</span>
              <div className="h-px w-8 bg-white"></div>
            </div>
          </div>

          <p className="text-sm md:text-base text-slate-400 font-medium tracking-[0.3em] uppercase max-w-3xl mx-auto leading-relaxed">
            The ultimate <span className="text-white">proving ground</span> for University coders
          </p>
        </div>

        {/* Terminal Section */}
        <div className="group">
          <div className="relative transform transition-all duration-1000">
            {/* Subtle Glow */}
            <div className="absolute -inset-8 bg-purple-600/5 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            <TerminalBlock />
          </div>
        </div>
      </div>

      {/* Navigation Hint */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 opacity-20 hover:opacity-40 transition-opacity duration-500">
        <span className="text-[10px] uppercase tracking-[0.3em] font-medium cursor-pointer hover:text-white">Dashboard</span>
        <span className="text-[10px] uppercase tracking-[0.3em] font-medium cursor-pointer hover:text-white">Leaderboard</span>
        <span className="text-[10px] uppercase tracking-[0.3em] font-medium cursor-pointer hover:text-white">Problems</span>
      </div>
    </div>
  );
};

export default LandingPage;
