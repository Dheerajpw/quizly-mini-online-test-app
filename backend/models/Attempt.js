const mongoose = require('mongoose');
const attemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  questions: [{ question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }, text: String, options: [String], correctAnswer: Number, subject: String }],
  answers: { type: Map, of: Number, default: {} },
  score: { type: Number, default: 0 },
  total: { type: Number, default: 10 },
  startedAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  submittedAt: { type: Date },
  status: { type: String, enum: ['in-progress', 'submitted'], default: 'in-progress' }
}, { timestamps: true });
module.exports = mongoose.model('Attempt', attemptSchema);
