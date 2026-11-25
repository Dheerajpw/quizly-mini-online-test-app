const router = require('express').Router();
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const { protect } = require('../middleware');
const TEST_MINUTES = 10;
const publicAttempt = a => ({ id: a._id, questions: a.questions.map((q, i) => ({ id: String(q.question || i), text: q.text, options: q.options, subject: q.subject })), answers: Object.fromEntries(a.answers || []), startedAt: a.startedAt, endsAt: a.endsAt, status: a.status });
function grade(attempt, answers) {
  let score = 0;
  const review = attempt.questions.map((q, i) => {
    const picked = answers[String(q.question)];
    const isCorrect = Number(picked) === q.correctAnswer;
    if (isCorrect) score++;
    return { number: i + 1, question: q.text, options: q.options, selectedAnswer: picked === undefined ? null : Number(picked), correctAnswer: q.correctAnswer, isCorrect, subject: q.subject };
  });
  return { score, total: attempt.questions.length, review };
}
async function submitAttempt(attempt, answers) {
  if (attempt.status !== 'submitted') {
    const graded = grade(attempt, answers);
    attempt.answers = answers;
    attempt.score = graded.score;
    attempt.submittedAt = new Date();
    attempt.status = 'submitted';
    await attempt.save();
  }
  return grade(attempt, Object.fromEntries(attempt.answers || []));
}
router.post('/start', protect, async (req, res) => {
  try {
    const existing = await Attempt.findOne({ student: req.user._id, status: 'in-progress' });
    if (existing && existing.endsAt > new Date()) return res.json({ attempt: publicAttempt(existing) });
    if (existing) await submitAttempt(existing, Object.fromEntries(existing.answers || []));
    const questions = await Question.aggregate([{ $sample: { size: 10 } }]);
    if (questions.length < 10) return res.status(503).json({ message: 'Test questions are not ready. Please ask the administrator to seed at least 10 questions.' });
    const now = new Date();
    const attempt = await Attempt.create({ student: req.user._id, questions: questions.map(q => ({ question: q._id, text: q.text, options: q.options, correctAnswer: q.correctAnswer, subject: q.subject })), total: 10, startedAt: now, endsAt: new Date(now.getTime() + TEST_MINUTES * 60000) });
    res.status(201).json({ attempt: publicAttempt(attempt) });
  } catch (e) { res.status(500).json({ message: 'Could not start the test.' }); }
});
router.put('/:id/answer', protect, async (req, res) => {
  try {
    const { questionId, selectedAnswer } = req.body;
    const attempt = await Attempt.findOne({ _id: req.params.id, student: req.user._id });
    if (!attempt) return res.status(404).json({ message: 'Test attempt not found.' });
    if (attempt.status !== 'in-progress' || new Date() >= attempt.endsAt) return res.status(409).json({ message: 'The test deadline has passed.' });
    const question = attempt.questions.find(q => String(q.question) === String(questionId));
    if (!question || !Number.isInteger(Number(selectedAnswer)) || Number(selectedAnswer) < 0 || Number(selectedAnswer) > 3) return res.status(400).json({ message: 'Invalid answer.' });
    attempt.answers.set(String(questionId), Number(selectedAnswer));
    await attempt.save();
    res.json({ saved: true });
  } catch { res.status(500).json({ message: 'Could not save answer.' }); }
});
router.get('/history/list', protect, async (req, res) => {
  try {
    const attempts = await Attempt.find({ student: req.user._id, status: 'submitted' }).sort({ submittedAt: -1 }).select('score total startedAt submittedAt createdAt');
    res.json({ attempts });
  } catch { res.status(500).json({ message: 'Could not load history.' }); }
});
router.get('/:id', protect, async (req, res) => {
  try {
    const attempt = await Attempt.findOne({ _id: req.params.id, student: req.user._id });
    if (!attempt) return res.status(404).json({ message: 'Test attempt not found.' });
    if (attempt.status === 'in-progress' && attempt.endsAt <= new Date()) await submitAttempt(attempt, Object.fromEntries(attempt.answers || []));
    if (attempt.status === 'submitted') return res.json({ attempt: publicAttempt(attempt), result: grade(attempt, Object.fromEntries(attempt.answers || [])) });
    res.json({ attempt: publicAttempt(attempt) });
  } catch { res.status(500).json({ message: 'Could not load test.' }); }
});
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const attempt = await Attempt.findOne({ _id: req.params.id, student: req.user._id });
    if (!attempt) return res.status(404).json({ message: 'Test attempt not found.' });
    if (attempt.status === 'submitted') return res.json({ attempt: publicAttempt(attempt), result: grade(attempt, Object.fromEntries(attempt.answers || [])) });
    const submitted = {};
    const incoming = req.body.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
    const allowed = new Set(attempt.questions.map(q => String(q.question)));
    for (const [questionId, value] of Object.entries(incoming)) {
      if (allowed.has(questionId) && Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 3) submitted[questionId] = Number(value);
    }
    // The server clock is authoritative. If the deadline passed, submit the saved answers.
    const answers = new Date() > attempt.endsAt ? Object.fromEntries(attempt.answers || []) : submitted;
    const result = await submitAttempt(attempt, answers);
    res.json({ attempt: publicAttempt(attempt), result, timeExpired: new Date() > attempt.endsAt });
  } catch { res.status(500).json({ message: 'Could not submit test.' }); }
});
module.exports = router;
