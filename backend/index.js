const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Contest = require('./models/Contest');
const Submission = require('./models/Submission');
const Problem = require('./models/Problem');
const nodemailer = require('nodemailer');
const axios = require('axios');
const Violation = require('./models/Violation');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

const { submissionQueue, submissionEvents } = require('./queue');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role, idNumber } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { idNumber }] });
    if (existingUser) return res.status(400).json({ message: 'User exists' });
    const user = new User({ name, email, password, role, idNumber });
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, idNumber: user.idNumber } });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email, role });
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, idNumber: user.idNumber } });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Contest Routes
app.post('/api/contests', async (req, res) => {
  try {
    const contest = new Contest({ ...req.body, status: 'upcoming' });
    await contest.save();
    res.status(201).json(contest);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/contests/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id).populate('participants', 'name idNumber email rating');
    res.json(contest);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/contests/faculty/:facultyId', async (req, res) => {
  try {
    const contests = await Contest.find({ createdBy: req.params.facultyId }).populate('participants', 'name idNumber');
    res.json(contests);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/contests/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const contests = await Contest.find({ participants: studentId }).populate('createdBy', 'name');
    res.json(contests);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/contests/:id/invite-bulk', async (req, res) => {
  try {
    const { id } = req.params;
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) return res.status(400).json({ message: 'Invalid emails array' });
    const cleanEmails = emails.map(e => e.trim().toLowerCase());
    const students = await User.find({ email: { $in: cleanEmails }, role: 'student' });
    const studentIds = students.map(s => s._id);
    const missingEmails = cleanEmails.filter(e => !students.map(s => s.email).includes(e));
    const contest = await Contest.findByIdAndUpdate(id, { $addToSet: { participants: { $each: studentIds } } }, { new: true }).populate('participants', 'name idNumber email rating');
    res.json({ message: 'Success', count: studentIds.length, missingCount: missingEmails.length, missingEmails, contest });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/contests/:id/participants/:studentId', async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const contest = await Contest.findByIdAndUpdate(id, { $pull: { participants: studentId } }, { new: true }).populate('participants', 'name idNumber email rating');
    res.json({ message: 'Student removed', contest });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/contests/:id', async (req, res) => {
  try {
    await Contest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Problem Routes
app.post('/api/problems', async (req, res) => {
  try {
    const { contestId, ...problemData } = req.body;
    const problem = new Problem({ ...problemData, contest: contestId });
    await problem.save();
    res.status(201).json(problem);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/problems/contest/:contestId', async (req, res) => {
  try {
    const problems = await Problem.find({ contest: req.params.contestId });
    res.json(problems);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    res.json(problem);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.put('/api/problems/:id', async (req, res) => {
  try {
    const updated = await Problem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete('/api/problems/:id', async (req, res) => {
  try {
    await Problem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Submission Routes
app.post('/api/submissions', async (req, res) => {
  try {
    const { studentId, problemId, contestId, code, language, customInput } = req.body;
    
    // Server-side security check: is student locked out?
    if (contestId) {
      const contest = await Contest.findById(contestId).select('lockedStudents');
      if (contest && contest.lockedStudents?.some(s => s.toString() === studentId)) {
        return res.status(403).json({ message: 'Access denied. Your session is locked due to proctoring violations.' });
      }
    }

    // Create pending submission
    const submission = new Submission({
      student: studentId,
      problem: problemId,
      contest: contestId || null,
      code: code || (req.body.files && req.body.files[0]?.content) || '',
      files: req.body.files || [],
      mainFile: req.body.mainFile,
      language,
      status: 'Pending'
    });
    await submission.save();

    // Push to queue
    const job = await submissionQueue.add('submission', {
      submissionId: submission._id,
      problemId,
      code,
      files: req.body.files,
      mainFile: req.body.mainFile,
      language,
      customInput,
      type: 'submit'
    });

    res.status(202).json({ 
        message: 'Submission queued', 
        submissionId: submission._id, 
        jobId: job.id 
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/submissions/run', async (req, res) => {
  try {
    const { problemId, code, language, customInput, contestId, studentId } = req.body;
    
    // Server-side security check
    if (contestId && studentId) {
      const contest = await Contest.findById(contestId).select('lockedStudents');
      if (contest && contest.lockedStudents?.some(s => s.toString() === studentId)) {
        return res.status(403).json({ message: 'Access denied. Your session is locked.' });
      }
    }

    // Push to queue for "Run" (no submission record in DB)
    const job = await submissionQueue.add('run', {
      problemId,
      code,
      files: req.body.files,
      mainFile: req.body.mainFile,
      language,
      customInput,
      type: req.body.type || 'run',
      command: req.body.command
    });

    res.status(202).json({ 
        message: 'Execution queued', 
        jobId: job.id 
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/submissions/status/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await submissionQueue.getJob(jobId);
        
        if (!job) {
            // Check if submission exists in DB (it might be finished and cleaned up from queue)
            // But for BullMQ, jobs stay for a while.
            return res.status(404).json({ message: 'Job not found' });
        }

        const state = await job.getState();
        const result = job.returnvalue;

        res.json({ state, result });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/contests/student/:studentId/participated/ended', async (req, res) => {
  try {
    const { studentId } = req.params;
    const now = new Date();
    const contests = await Contest.find({
      participants: studentId,
      $or: [
        { status: 'ended' },
        { endTime: { $lt: now } }
      ]
    }).populate('createdBy', 'name');
    res.json(contests);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/submissions/student/:studentId/contest/:contestId', async (req, res) => {
  try {
    const { studentId, contestId } = req.params;
    const submissions = await Submission.find({
      student: studentId,
      contest: contestId
    }).populate('problem', 'title').sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/submissions/:id', async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('student', 'name idNumber')
            .populate('problem', 'title');
        res.json(submission);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/submissions/contest/:contestId', async (req, res) => {
  try {
    const submissions = await Submission.find({ contest: req.params.contestId }).populate('student', 'name idNumber').populate('problem', 'title').sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/submissions/student/:studentId/problem/:problemId', async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.params.studentId, problem: req.params.problemId }).sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ rating: -1 });
    res.json(students);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/students/stats/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const user = await User.findById(studentId);
    if (!user) return res.status(404).json({ message: 'Student not found' });

    // 1. Solved Problems (Unique Accepted)
    const solvedSubmissions = await Submission.find({ 
      student: studentId, 
      status: 'Accepted' 
    }).distinct('problem');
    const solvedCount = solvedSubmissions.length;

    // 2. Contests Given
    const participantContests = await Submission.find({ 
      student: studentId,
      contest: { $ne: null }
    }).distinct('contest');
    const contestsGiven = participantContests.length;

    // 3. Best Rank & Last Contest Perf
    let bestRank = '--';
    let lastContestPerf = '--';

    if (contestsGiven > 0) {
      // Get all contests the student participated in, sorted by end time descending
      const contests = await Contest.find({ _id: { $in: participantContests } }).sort({ endTime: -1 });
      
      let ranks = [];

      for (const contest of contests) {
        // Aggregation to get leaderboard for this contest
        const results = await Submission.aggregate([
          { $match: { contest: contest._id } },
          { $group: {
            _id: { student: "$student", problem: "$problem" },
            maxPoints: { $max: "$points" }
          }},
          { $group: {
            _id: "$_id.student",
            totalPoints: { $sum: "$maxPoints" },
            lastSubmission: { $max: "$submittedAt" } 
          }},
          { $sort: { totalPoints: -1, lastSubmission: 1 } }
        ]);

        const studentRankIndex = results.findIndex(r => r._id.toString() === studentId);
        if (studentRankIndex !== -1) {
          const rank = studentRankIndex + 1;
          ranks.push(rank);
          // Set last contest perf if it's the most recently ended contest the student was in
          if (contest._id.toString() === contests[0]._id.toString()) {
            lastContestPerf = `#${rank}`;
          }
        }
      }

      if (ranks.length > 0) {
        bestRank = `#${Math.min(...ranks)}`;
      }
    }

    res.json({
      rank: user.rating || 1200,
      rating: user.rating || 1200,
      solved: solvedCount,
      winRate: '--',
      contestsGiven: contestsGiven,
      bestRank: bestRank,
      lastContestPerf: lastContestPerf,
      reminders: user.reminders || []
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/system/intelligence', async (req, res) => {
  try {
    const totalContests = await Contest.countDocuments();
    const appearedStudents = await Submission.distinct('student');
    const totalSubmissions = await Submission.countDocuments();
    res.json({ totalContests, totalAppeared: appearedStudents.length, totalSubmissions });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/submissions/:id/rerun', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    // Queue the job
    const job = await submissionQueue.add('rerun', {
      submissionId: submission._id,
      problemId: submission.problem,
      code: submission.code,
      language: submission.language,
      type: 'submit' // Use 'submit' type to run all test cases
    });

    // Wait for the result
    const result = await job.waitUntilFinished(submissionEvents);
    res.json(result);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// =============================================
// PROCTORING & SECURITY ROUTES
// =============================================

// Log a violation from the student's browser
app.post('/api/contests/:id/violations', async (req, res) => {
  try {
    const { studentId, type, details } = req.body;
    const { id } = req.params;

    // Save the violation log
    const violation = new Violation({ student: studentId, contest: id, type, details });
    await violation.save();

    // Lock the student from this contest
    await Contest.findByIdAndUpdate(id, {
      $addToSet: { lockedStudents: studentId }
    });

    res.status(201).json({ message: 'Violation logged. Student locked.', violation });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Get all violations for a contest (faculty)
app.get('/api/contests/:id/violations', async (req, res) => {
  try {
    const violations = await Violation.find({ contest: req.params.id })
      .populate('student', 'name idNumber')
      .sort({ timestamp: -1 });
    res.json(violations);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Check if the current student is locked out (student polls this)
app.get('/api/contests/:id/lockstatus/:studentId', async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const contest = await Contest.findById(id).select('lockedStudents isProctored');
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    const isLocked = contest.lockedStudents?.some(s => s.toString() === studentId);
    res.json({ isLocked, isProctored: contest.isProctored });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Unlock a specific student (faculty action)
app.post('/api/contests/:id/unlock/:studentId', async (req, res) => {
  try {
    const { id, studentId } = req.params;
    await Contest.findByIdAndUpdate(id, {
      $pull: { lockedStudents: studentId }
    });
    res.json({ message: 'Student unlocked successfully.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Toggle proctored mode for a contest (faculty action)
app.put('/api/contests/:id/proctored', async (req, res) => {
  try {
    const { isProctored } = req.body;
    const contest = await Contest.findByIdAndUpdate(
      req.params.id,
      { isProctored },
      { new: true }
    );
    res.json({ message: `Proctored mode ${isProctored ? 'enabled' : 'disabled'}.`, contest });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.listen(PORT, '127.0.0.1', () => console.log(`Server running on http://127.0.0.1:${PORT}`));
