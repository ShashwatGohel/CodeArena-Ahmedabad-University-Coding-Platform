const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  tags: [String],
  testCases: [{
    input: String,
    output: String,
    isSample: {
      type: Boolean,
      default: false
    }
  }],
  points: {
    type: Number,
    default: 100
  },
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest'
  },
  gradingType: {
    type: String,
    enum: ['automatic', 'manual'],
    default: 'automatic'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Problem', problemSchema);
