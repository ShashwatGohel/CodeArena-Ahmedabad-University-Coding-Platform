const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const { exec, spawn } = require('child_process');
const dotenv = require('dotenv');
const Submission = require('./models/Submission');
const Problem = require('./models/Problem');
const { connection } = require('./queue');

dotenv.config();

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Worker connected to MongoDB'))
  .catch(err => console.error('Worker MongoDB error:', err));

const JUDGE_CONTAINER = 'judge0-ce-worker-1';

const LANG_CONFIG = {
  c:      { ext: 'c',    compile: 'gcc *.c -o bin -lm',  run: './bin' },
  cpp:    { ext: 'cpp',  compile: 'g++ *.cpp -o bin',    run: './bin' },
  java:   { ext: 'java', compile: 'javac *.java',        run: 'java Main' },
  python: { ext: 'py',   compile: null,                  run: 'python3 /tmp/__code.py' },
  bash:   { ext: 'sh',   compile: null,                  run: 'bash /tmp/__code.sh' },
  shell:  { ext: 'sh',   compile: null,                  run: 'bash /tmp/__code.sh' },
};

const fs = require('fs');
const path = require('path');

const runDockerExec = (cmd) => new Promise((resolve) => {
  exec(cmd, { timeout: 15000 }, (err, stdout, stderr) => {
    if (err && !cmd.includes('rm')) {
      console.error(`Command failed: ${cmd}`);
      console.error(`Stderr: ${stderr}`);
    }
    resolve({ stdout: stdout || '', stderr: stderr || '', exitCode: err ? (err.code || 1) : 0 });
  });
});

// Helper to write data to container via stdin pipe
const writeToContainer = (data, containerPath) => new Promise((resolve, reject) => {
  if (data === undefined) {
    console.warn(`Warning: undefined data passed to writeToContainer for ${containerPath}`);
  }
  
  const content = (data === undefined || data === null) ? '' : String(data);
  
  console.log(`Writing ${content.length} bytes to ${containerPath}`);

  const child = spawn('docker', ['exec', '-i', JUDGE_CONTAINER, 'bash', '-c', `cat > ${containerPath}`]);
  
  child.stdin.write(content);
  child.stdin.end();

  child.on('close', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`Failed to write to container at ${containerPath} (exit code ${code})`));
  });
  
  child.on('error', (err) => {
    reject(err);
  });
});

const executeJudge0 = async (files, input, language, jobId, command = null, mainFile = null) => {
  const cfg = LANG_CONFIG[language] || LANG_CONFIG['python'];
  const workDir = `/tmp/${jobId}`;
  const startTime = Date.now();
  
  try {
    // 0. Create work directory
    await runDockerExec(`docker exec ${JUDGE_CONTAINER} mkdir -p ${workDir}`);

    // 1. Write all files to work directory
    for (const file of files) {
      await writeToContainer(file.content, `${workDir}/${file.name}`);
    }
    
    // 2. Write stdin if provided
    await writeToContainer(input || '', `${workDir}/stdin.txt`);

    // 3. Compile if needed
    const entryFile = mainFile || files[0].name;
    const entryFileNameOnly = entryFile.split('.')[0];

    if (cfg.compile) {
      const compileCmd = cfg.compile
        .replace(/\/tmp\/__code/g, `${workDir}/${entryFileNameOnly}`)
        .replace(/\/tmp\/__code_bin/g, `${workDir}/bin`);
      
      await runDockerExec(`docker exec ${JUDGE_CONTAINER} bash -c "cd ${workDir} && ${compileCmd} 2>compile_err.txt; echo $? > compile_exit.txt"`);
      const compileExitResult = await runDockerExec(`docker exec ${JUDGE_CONTAINER} cat ${workDir}/compile_exit.txt`);
      const compileExitCode = parseInt(compileExitResult.stdout.trim()) || 0;
      
      if (compileExitCode !== 0) {
        const compileErr = await runDockerExec(`docker exec ${JUDGE_CONTAINER} cat ${workDir}/compile_err.txt`);
        return {
          stdout: '', stderr: compileErr.stdout, compile_output: compileErr.stdout,
          status: 'Compilation Error', statusId: 6,
          executionTime: Date.now() - startTime, memoryUsed: 0,
        };
      }
    }

    // 4. Run code
    let runCmd = command;
    if (!runCmd) {
      runCmd = cfg.run
        .replace(/\/tmp\/__code/g, `${workDir}/${entryFileNameOnly}`)
        .replace(/\/tmp\/__code_bin/g, `${workDir}/bin`);
      
      if (language === 'java') {
        const className = entryFileNameOnly || 'Solution';
        runCmd = `java -cp . ${className}`; 
      }
    }

    await runDockerExec(
      `docker exec ${JUDGE_CONTAINER} bash -c "cd ${workDir} && timeout 10 ${runCmd} < stdin.txt > stdout.txt 2>stderr.txt; echo $? > exit.txt"`
    );

    // 5. Collect results
    const [stdoutResult, stderrResult, exitResult] = await Promise.all([
      runDockerExec(`docker exec ${JUDGE_CONTAINER} cat ${workDir}/stdout.txt`),
      runDockerExec(`docker exec ${JUDGE_CONTAINER} cat ${workDir}/stderr.txt`),
      runDockerExec(`docker exec ${JUDGE_CONTAINER} cat ${workDir}/exit.txt`),
    ]);

    // 6. Cleanup (Container)
    runDockerExec(`docker exec ${JUDGE_CONTAINER} rm -rf ${workDir}`);
    
    // 7. Cleanup (Local - no longer needed but keeping for safety if used elsewhere)
    try {
      const localPrefix = path.join(__dirname, 'tmp', `${jobId}_`);
      if (fs.existsSync(`${localPrefix}code.${cfg.ext}`)) fs.unlinkSync(`${localPrefix}code.${cfg.ext}`);
      if (fs.existsSync(`${localPrefix}stdin.txt`)) fs.unlinkSync(`${localPrefix}stdin.txt`);
    } catch (e) {}

    const stdout = stdoutResult.stdout || '';
    const stderr = stderrResult.stdout || '';
    const exitCodeStr = exitResult.stdout.trim();
    const exitCode = exitCodeStr !== '' ? parseInt(exitCodeStr) : -1;
    const elapsed = Date.now() - startTime;

    let status = 'Accepted';
    let statusId = 3;
    if (exitCode === -1) { status = 'Judge Error'; statusId = 13; }
    else if (exitCode === 124) { status = 'Time Limit Exceeded'; statusId = 5; }
    else if (exitCode !== 0) { status = 'Runtime Error'; statusId = 11; }

    return { stdout, stderr, compile_output: '', status, statusId, executionTime: elapsed, memoryUsed: 0 };
  } catch (err) {
    console.error('JUDGE EXECUTION ERROR:', err);
    return { status: 'Judge Error', stderr: err.message, stdout: '', compile_output: '', executionTime: 0, statusId: 13 };
  }
};

const worker = new Worker('submission-queue', async (job) => {
  const { submissionId, problemId, files, code, mainFile, language, customInput, type, command } = job.data;
  
  // Backwards compatibility for single 'code' field
  const normalizedFiles = files || [{ name: `solution.${LANG_CONFIG[language]?.ext || 'txt'}`, content: code }];

  const jobId = job.id;
  
  console.log(`Processing ${type} for job ${jobId}`);

  try {
    const problem = await Problem.findById(problemId);
    if (!problem) throw new Error('Problem not found');

    if (type === 'run' || type === 'terminal') {
        const result = await executeJudge0(normalizedFiles, customInput || '', language, jobId, command, mainFile);
        
        if (type === 'terminal') return { results: result };

        const sampleCases = problem.testCases.filter(tc => tc.isSample);
        const sampleResults = await Promise.all(sampleCases.map(async (tc, idx) => {
          const run = await executeJudge0(normalizedFiles, tc.input, language, `${jobId}_s${idx}`, null, mainFile);
          const passed = run.statusId === 3 && (run.stdout || '').trim() === (tc.output || '').trim();
          return { 
            input: tc.input, 
            expectedOutput: tc.output, 
            actualOutput: run.stdout,
            passed,
            status: run.status
          };
        }));

        const firstFailedSample = sampleResults.find(r => !r.passed);
        let finalStatus = result.status;
        if (result.statusId === 3 && firstFailedSample) {
            finalStatus = 'Rejected';
        } else if (result.statusId !== 3 && result.statusId !== 6) {
            finalStatus = 'Rejected';
        }

        const totalPassed = sampleResults.filter(r => r.passed).length;
        const totalTestCases = sampleCases.length;
        const earnedPoints = totalTestCases > 0 ? (totalPassed / totalTestCases) * (problem.points || 100) : 0;

        return { 
            results: { 
                sampleCases: sampleResults, 
                status: finalStatus, 
                points: earnedPoints,
                totalPassed,
                totalTestCases,
                ...result 
            } 
        };
    } else {
        // Full submission
        const mainResult = await executeJudge0(normalizedFiles, "", language, jobId, null, mainFile);
        
        const sampleCases = problem.testCases.filter(tc => tc.isSample);
        const sampleResults = await Promise.all(sampleCases.map(async (tc, idx) => {
          const run = await executeJudge0(normalizedFiles, tc.input, language, `${jobId}_s${idx}`, null, mainFile);
          const passed = run.statusId === 3 && run.stdout.trim() === tc.output.trim();
          return { 
            input: tc.input, 
            expectedOutput: tc.output, 
            actualOutput: run.stdout,
            passed: passed,
            status: run.status
          };
        }));
 
        const hiddenCases = problem.testCases.filter(tc => !tc.isSample);
        const hiddenResults = await Promise.all(hiddenCases.map(async (tc, i) => {
          const run = await executeJudge0(normalizedFiles, tc.input, language, `${jobId}_h${i}`, null, mainFile);
          const passed = run.statusId === 3 && run.stdout.trim() === tc.output.trim();
          return { passed, status: run.status };
        }));
        const hiddenPassed = hiddenResults.filter(r => r.passed).length;

        // Determine final status
        let status = 'Accepted';
        if (mainResult.statusId !== 3) {
            status = mainResult.status === 'Compilation Error' ? 'Compilation Error' : 'Rejected';
        } else {
            const firstFailedSample = sampleResults.find(r => !r.passed);
            if (firstFailedSample) {
                status = 'Rejected';
            } else {
                const firstFailedHidden = hiddenResults.find(r => !r.passed);
                if (firstFailedHidden) {
                    status = 'Rejected';
                }
            }
        }
        
        const totalPassed = sampleResults.filter(r => r.passed).length + hiddenPassed;
        const totalTestCases = problem.testCases.length;
        const earnedPoints = totalTestCases > 0 ? (totalPassed / totalTestCases) * (problem.points || 100) : 0;
        
        const detailedResults = { 
            sampleCases: sampleResults, 
            hidden: { passed: hiddenPassed, total: hiddenCases.length, results: hiddenResults }, 
            status, 
            points: earnedPoints,
            totalTestCases,
            totalPassed,
            ...mainResult 
        };

        await Submission.findByIdAndUpdate(submissionId, {
            status,
            results: detailedResults,
            points: earnedPoints,
            files: normalizedFiles,
            executionTime: mainResult.executionTime,
            memoryUsed: mainResult.memoryUsed
        });

        return { submissionId, results: detailedResults };
    }
  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error);
    if (submissionId) {
        await Submission.findByIdAndUpdate(submissionId, { status: 'Judge Error' });
    }
    throw error;
  }
}, { connection });

worker.on('completed', job => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

console.log('Worker is running...');
