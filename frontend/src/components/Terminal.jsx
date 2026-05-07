import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const Terminal = ({ onCommand, results }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const currentLineRef = useRef('');

  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

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
    term.writeln('Type commands and press Enter to execute. Use UP/DOWN arrows for history.');
    term.write('\r\n\x1b[1;32mstudent@codearena\x1b[0m:\x1b[1;34m~\x1b[0m$ ');

    term.onData((data) => {
      const code = data.charCodeAt(0);
      if (code === 13) { // Enter
        const cmd = currentLineRef.current.trim();
        term.write('\r\n');
        
        if (cmd) {
          historyRef.current.push(cmd);
          historyIndexRef.current = -1;
        }

        if (cmd === 'clear') {
          term.clear();
          term.write('\x1b[1;32mstudent@codearena\x1b[0m:\x1b[1;34m~\x1b[0m$ ');
        } else if (cmd) {
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
      } else if (code === 27) { // Escape Sequences (Arrows)
        if (data === '\x1b[A') { // Up Arrow
          if (historyRef.current.length > 0) {
            if (historyIndexRef.current < historyRef.current.length - 1) {
              historyIndexRef.current++;
            }
            const cmd = historyRef.current[historyRef.current.length - 1 - historyIndexRef.current];
            term.write('\b \b'.repeat(currentLineRef.current.length)); // Clear current typed text
            currentLineRef.current = cmd;
            term.write(cmd);
          }
        } else if (data === '\x1b[B') { // Down Arrow
          if (historyIndexRef.current > 0) {
            historyIndexRef.current--;
            const cmd = historyRef.current[historyRef.current.length - 1 - historyIndexRef.current];
            term.write('\b \b'.repeat(currentLineRef.current.length));
            currentLineRef.current = cmd;
            term.write(cmd);
          } else if (historyIndexRef.current === 0) {
            historyIndexRef.current--;
            term.write('\b \b'.repeat(currentLineRef.current.length));
            currentLineRef.current = '';
          }
        }
      } else if (code < 32) {
        // Ignore other control characters
      } else {
        currentLineRef.current += data;
        term.write(data);
      }
    });

    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    // Initial fit needs a slight delay sometimes to get accurate dimensions
    setTimeout(() => fitAddon.fit(), 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (results && xtermRef.current) {
      const term = xtermRef.current;
      if (results.stdout) {
        // Replace \n with \r\n for xterm
        term.write(results.stdout.replace(/\n/g, '\r\n') + (results.stdout.endsWith('\n') ? '' : '\r\n'));
      }
      if (results.stderr) {
        term.write('\x1b[31m' + results.stderr.replace(/\n/g, '\r\n') + '\x1b[0m\r\n');
      }
      if (results.compile_output) {
        term.write('\x1b[33m' + results.compile_output.replace(/\n/g, '\r\n') + '\x1b[0m\r\n');
      }
      if (results.error) {
        term.writeln('\x1b[31mError: ' + results.error + '\x1b[0m');
      }
      term.write('\x1b[1;32mstudent@codearena\x1b[0m:\x1b[1;34m~\x1b[0m$ ');
    }
  }, [results]);

  return (
    <div className="w-full h-full bg-[#050505] relative">
      <div ref={terminalRef} className="absolute inset-0 p-4 overflow-hidden" />
    </div>
  );
};

export default Terminal;
