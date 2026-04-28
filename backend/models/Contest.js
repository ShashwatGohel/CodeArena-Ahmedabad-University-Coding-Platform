const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  gradingType: { type: String, enum: ['auto', 'manual'], default: 'auto' },
  sampleInput: { type: String },
  sampleOutput: { type: String },
  testCases: { type: String }, 
  points: { type: Number, default: 100 }
});

const participantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  status: { type: String, enum: ['Joined', 'In Progress', 'Completed'], default: 'Joined' },
  joinedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  submissionCode: { type: String },
  autoScore: { type: Number, default: 0 },
  manualScore: { type: Number, default: 0 },
  feedback: { type: String, default: '' }
});

const announcementSchema = new mongoose.Schema({
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const contestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true },
  totalMarks: { type: Number, default: 100 },
  password: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },
  showLeaderboard: { type: Boolean, default: true },
  problems: [problemSchema],
  participants: [participantSchema],
  announcements: [announcementSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Contest', contestSchema);
