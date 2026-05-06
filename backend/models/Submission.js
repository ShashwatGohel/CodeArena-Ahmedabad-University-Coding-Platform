const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest'
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  files: [{
    name: { type: String, required: true },
    content: { type: String, required: true }
  }],
  mainFile: {
    type: String
  },
  customInput: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Accepted', 'Rejected', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Judge Error', 'Pending', 'Running'],
    default: 'Pending'
  },
  results: {
    type: Object,
    default: {}
  },
  executionTime: Number,
  memoryUsed: Number,
  isFinal: {
    type: Boolean,
    default: false
  },
  points: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Submission', submissionSchema);
