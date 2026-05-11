const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true
  },
  type: {
    type: String,
    enum: [
      'TAB_SWITCH',
      'FULLSCREEN_EXIT',
      'ALT_TAB',
      'INSPECT_MODE',
      'DEVTOOLS_OPEN',
      'RIGHT_CLICK',
      'KEYBOARD_SHORTCUT',
      'FOCUS_LOSS',
      'AI_EXTENSION_DETECTED',
      'EARLY_EXIT'
    ],
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Violation', violationSchema);
