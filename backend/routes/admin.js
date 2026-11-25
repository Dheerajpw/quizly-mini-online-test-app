const router = require('express').Router();
const Question = require('../models/Question');
const { protect, adminOnly } = require('../middleware');
router.use(protect, adminOnly);
router.post('/questions', async (req, res) => {
  try {
    const { text, options, correctAnswer, subject } = req.body;
    if (!text?.trim() || !Array.isArray(options) || options.length !== 4 || options.some(o => !String(o).trim()) || !Number.isInteger(Number(correctAnswer)) || Number(correctAnswer) < 0 || Number(correctAnswer) > 3) return res.status(400).json({ message: 'Provide a question, four options and correctAnswer index (0-3).' });
    const question = await Question.create({ text: text.trim(), options: options.map(String), correctAnswer: Number(correctAnswer), subject: subject || 'General Knowledge' });
    res.status(201).json({ question: { id: question._id, text: question.text, options: question.options, subject: question.subject } });
  } catch { res.status(500).json({ message: 'Could not add question.' }); }
});
router.get('/questions', async (req, res) => {
  const questions = await Question.find().select('-correctAnswer').sort({ createdAt: -1 });
  res.json({ questions });
});
module.exports = router;
