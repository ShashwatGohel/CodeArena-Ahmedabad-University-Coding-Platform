const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const Contest = require('./models/Contest');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- HELPER: Code Executor ---
const runCode = (code, language, input) => {
  return new Promise((resolve) => {
    const filename = `temp_${Date.now()}.${language === 'python' ? 'py' : 'js'}`;
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, code);

    const command = language === 'python' ? `python ${filepath}` : `node ${filepath}`;
    
    // In a real production env, we'd use a Docker container here for isolation
    const process = exec(command, (error, stdout, stderr) => {
      fs.unlinkSync(filepath); // Clean up
      if (error) {
        resolve({ success: false, error: stderr || error.message });
      } else {
        resolve({ success: true, output: stdout.trim() });
      }
    });

    if (input) {
      process.stdin.write(input);
      process.stdin.end();
    }
  });
};

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    let { username, email, course, password } = req.body;
    const isAdminCourse = ['ta', 'faculty'].includes(course.toLowerCase().trim());
    const role = isAdminCourse ? 'faculty' : 'student';

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(400).json({ message: 'Username or Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ role, username, email, course, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, role: user.role, username: user.username, email: user.email, course: user.course } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Contest Routes
app.post('/api/admin/contests', async (req, res) => {
  try {
    const { name, date, duration, totalMarks, password, description } = req.body;
    const hashedSecret = await bcrypt.hash(password, 5);
    const newContest = new Contest({ name, date, duration, totalMarks, password: hashedSecret, description });
    await newContest.save();
    res.status(201).json(newContest);
  } catch (err) {
    res.status(500).json({ message: 'Error creating contest' });
  }
});

app.get('/api/contests', async (req, res) => {
  try {
    const contests = await Contest.find().sort({ date: -1 });
    res.json(contests);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching contests' });
  }
});

app.get('/api/admin/contests/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    res.json(contest);
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// Student Interaction Routes
app.post('/api/contests/:id/submit', async (req, res) => {
  try {
    const { userId, problemId, code, language } = req.body;
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: 'Contest not found' });

    const problem = contest.problems.id(problemId);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    
    // Auto-grading logic
    let score = 0;
    if (problem.gradingType === 'auto' && problem.testCases) {
      const result = await runCode(code, language, problem.testCases.split('|')[0]);
      if (result.success && result.output === problem.sampleOutput) {
        score = problem.points;
      }
    }

    const participant = contest.participants.find(p => p.userId.toString() === userId);
    if (!participant) {
      return res.status(403).json({ message: 'User is not a participant in this contest' });
    }

    participant.submissionCode = code;
    participant.autoScore = score;
    participant.status = 'Completed';
    participant.completedAt = new Date();
    
    await contest.save();
    res.json({ success: true, score, message: score > 0 ? "Correct Answer!" : "Wrong Answer / Simulation Failed" });
  } catch (err) {
    console.error('Submission Error:', err);
    res.status(500).json({ message: 'Submission Error', error: err.message });
  }
});

// Broadcast & Control
app.post('/api/admin/contests/:id/broadcast', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    contest.announcements.push({ message: req.body.message });
    await contest.save();
    res.json(contest);
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

app.patch('/api/admin/contests/:id/control', async (req, res) => {
  try {
    const contest = await Contest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(contest);
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

app.post('/api/admin/contests/:id/evaluate/:participantId', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    const participant = contest.participants.id(req.params.participantId);
    participant.manualScore = req.body.manualScore;
    participant.feedback = req.body.feedback;
    await contest.save();
    res.json(contest);
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

app.post('/api/contests/:id/join', async (req, res) => {
  try {
    const { userId, username, password } = req.body;
    const contest = await Contest.findById(req.params.id);
    const isMatch = await bcrypt.compare(password, contest.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect Secret Key' });
    if (!contest.participants.find(p => p.userId.toString() === userId)) {
      contest.participants.push({ userId, username, status: 'Joined' });
      await contest.save();
    }
    res.json({ message: 'Joined successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

app.post('/api/contests/:id/verify-password', async (req, res) => {
  try {
    const { password } = req.body;
    const contest = await Contest.findById(req.params.id);
    const isMatch = await bcrypt.compare(password, contest.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect Secret Key' });
    res.json({ message: 'Verified' });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// Problem Management
app.post('/api/admin/contests/:id/problems', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    contest.problems.push(req.body);
    await contest.save();
    res.status(201).json(contest);
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

app.delete('/api/admin/contests/:id/problems/:problemId', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    contest.problems = contest.problems.filter(p => p._id.toString() !== req.params.problemId);
    await contest.save();
    res.json({ message: 'Problem deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting problem' });
  }
});

app.get('/', (req, res) => res.send('CodeArena API Online.'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[CORE ERROR]:', err.stack);
  res.status(500).json({ message: 'Critical System Error Detected' });
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
