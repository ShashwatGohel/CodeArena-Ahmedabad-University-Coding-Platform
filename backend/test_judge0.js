const { exec } = require('child_process');

const JUDGE_CONTAINER = 'judge0-ce-worker-1';

const LANG_CONFIG = {
  c:      { ext: 'c',    compile: 'gcc /tmp/__code.c -o /tmp/__code_bin -lm',  run: '/tmp/__code_bin' },
  cpp:    { ext: 'cpp',  compile: 'g++ /tmp/__code.cpp -o /tmp/__code_bin',    run: '/tmp/__code_bin' },
  java:   { ext: 'java', compile: 'cp /tmp/__code.java /tmp/Main.java && javac /tmp/Main.java -d /tmp', run: 'java -cp /tmp Main' },
  python: { ext: 'py',   compile: null,                                         run: 'python3 /tmp/__code.py' },
  bash:   { ext: 'sh',   compile: null,                                         run: 'bash /tmp/__code.sh' },
  shell:  { ext: 'sh',   compile: null,                                         run: 'bash /tmp/__code.sh' },
};

const runDockerExec = (cmd) => new Promise((resolve) => {
  exec(cmd, { timeout: 15000 }, (err, stdout, stderr) => {
    resolve({ stdout: stdout || '', stderr: stderr || '', exitCode: err ? (err.code || 1) : 0 });
  });
});

const executeJudge0 = async (code, input, language) => {
  const cfg = LANG_CONFIG[language] || LANG_CONFIG['python'];
  const startTime = Date.now();
  try {
    const codeB64 = Buffer.from(code).toString('base64');
    await runDockerExec(`docker exec ${JUDGE_CONTAINER} bash -c "echo ${codeB64} | base64 -d > /tmp/__code.${cfg.ext}"`);

    const stdinB64 = Buffer.from(input || '').toString('base64');
    await runDockerExec(`docker exec ${JUDGE_CONTAINER} bash -c "echo ${stdinB64} | base64 -d > /tmp/__stdin.txt"`);

    if (cfg.compile) {
      const compileResult = await runDockerExec(`docker exec ${JUDGE_CONTAINER} bash -c "${cfg.compile} 2>/tmp/__compile_err.txt; echo $? > /tmp/__compile_exit.txt"`);
      const compileExitResult = await runDockerExec(`docker exec ${JUDGE_CONTAINER} cat /tmp/__compile_exit.txt`);
      const compileExitCode = parseInt(compileExitResult.stdout.trim()) || 0;
      if (compileExitCode !== 0) {
        const compileErr = await runDockerExec(`docker exec ${JUDGE_CONTAINER} cat /tmp/__compile_err.txt`);
        return {
          stdout: '', stderr: compileErr.stdout, compile_output: compileErr.stdout,
          status: 'Compilation Error', statusId: 6,
          executionTime: Date.now() - startTime, memoryUsed: 0,
        };
      }
    }

    await runDockerExec(
      `docker exec ${JUDGE_CONTAINER} bash -c "timeout 10 ${cfg.run} < /tmp/__stdin.txt > /tmp/__stdout.txt 2>/tmp/__stderr.txt; echo $? > /tmp/__exit.txt"`
    );

    const [stdoutResult, stderrResult, exitResult] = await Promise.all([
      runDockerExec(`docker exec ${JUDGE_CONTAINER} cat /tmp/__stdout.txt`),
      runDockerExec(`docker exec ${JUDGE_CONTAINER} cat /tmp/__stderr.txt`),
      runDockerExec(`docker exec ${JUDGE_CONTAINER} cat /tmp/__exit.txt`),
    ]);

    const stdout = stdoutResult.stdout || '';
    const stderr = stderrResult.stdout || '';
    const exitCode = parseInt(exitResult.stdout.trim()) || 0;
    const elapsed = Date.now() - startTime;

    let status = 'Accepted';
    let statusId = 3;
    if (exitCode === 124) { status = 'Time Limit Exceeded'; statusId = 5; }
    else if (exitCode !== 0) { status = 'Runtime Error'; statusId = 11; }

    return { stdout, stderr, compile_output: '', status, statusId, executionTime: elapsed, memoryUsed: 0 };
  } catch (err) {
    console.error('DOCKER EXEC ERROR:', err.message);
    return { status: 'Judge Error', stderr: err.message, stdout: '', compile_output: '', executionTime: 0, statusId: 13 };
  }
};

(async () => {
    console.log("Testing C code:");
    const res = await executeJudge0('#include <stdio.h>\nint main(){ printf("Hello World!"); return 0; }', '', 'c');
    console.log(res);
})();
