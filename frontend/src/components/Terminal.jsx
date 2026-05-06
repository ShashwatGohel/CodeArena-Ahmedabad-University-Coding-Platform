import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const Terminal = ({ onCommand, results }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const currentLineRef = useRef('');

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: '#050505',
        foreground: '#ffffff',
        cursor: '#a855f7',
        selectionBackground: 'rgba(168, 85, 247, 0.3)',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#bfbfbf',
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 13,
      lineHeight: 1.4,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('\x1b[1;35mCodeArena Interactive Linux Environment\x1b[0m');
    term.writeln('Type commands and press Enter to execute.');
    term.write('\r\n\x1b[1;32mstudent@codearena\x1b[0m:\x1b[1;34m~\x1b[0m$ ');

    term.onData((data) => {
      const code = data.charCodeAt(0);
      if (code === 13) { // Enter
        const cmd = currentLineRef.current.trim();
        term.write('\r\n');
        if (cmd) {
          onCommand(cmd);
        } else {
          term.write('\x1b[1;32mstudent@codearena\x1b[0m:\x1b[1;34m~\x1b[0m$ ');
        }
        currentLineRef.current = '';
      } else if (code === 127) { // Backspace
        if (currentLineRef.current.length > 0) {
          currentLineRef.current = currentLineRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (code < 32) {
        // Control characters
      } else {
        currentLineRef.current += data;
        term.write(data);
      }
    });

    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (results && xtermRef.current) {
      const term = xtermRef.current;
      if (results.stdout) {
        term.writeln(results.stdout);
      }
      if (results.stderr) {
        term.writeln('\x1b[31m' + results.stderr + '\x1b[0m');
      }
      if (results.compile_output) {
        term.writeln('\x1b[33m' + results.compile_output + '\x1b[0m');
      }
      if (results.error) {
        term.writeln('\x1b[31mError: ' + results.error + '\x1b[0m');
      }
      term.write('\x1b[1;32mstudent@codearena\x1b[0m:\x1b[1;34m~\x1b[0m$ ');
    }
  }, [results]);

  return (
    <div className="w-full h-full bg-[#050505] rounded-xl border border-white/5 overflow-hidden">
      <div ref={terminalRef} className="w-full h-full p-4" />
    </div>
  );
};

export default Terminal;
