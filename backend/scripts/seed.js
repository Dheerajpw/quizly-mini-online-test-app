require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../models/Question');
const questions = [
  { text: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Mercury'], correctAnswer: 1, subject: 'Science' },
  { text: 'What is the capital of India?', options: ['Mumbai', 'Kolkata', 'New Delhi', 'Chennai'], correctAnswer: 2, subject: 'Geography' },
  { text: 'Which language is primarily used to style web pages?', options: ['HTML', 'CSS', 'SQL', 'Python'], correctAnswer: 1, subject: 'Technology' },
  { text: 'How many sides does a hexagon have?', options: ['Five', 'Six', 'Seven', 'Eight'], correctAnswer: 1, subject: 'Mathematics' },
  { text: 'Which gas do plants absorb during photosynthesis?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], correctAnswer: 2, subject: 'Science' },
  { text: 'Who wrote the national anthem of India?', options: ['Bankim Chandra Chatterjee', 'Rabindranath Tagore', 'Sarojini Naidu', 'Subhas Chandra Bose'], correctAnswer: 1, subject: 'General Knowledge' },
  { text: 'What is 12 × 8?', options: ['86', '92', '96', '108'], correctAnswer: 2, subject: 'Mathematics' },
  { text: 'Which ocean is the largest?', options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'], correctAnswer: 3, subject: 'Geography' },
  { text: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Control Processing User'], correctAnswer: 0, subject: 'Technology' },
  { text: 'Which of these is a mammal?', options: ['Crocodile', 'Dolphin', 'Eagle', 'Frog'], correctAnswer: 1, subject: 'Science' },
  { text: 'Which number is a prime number?', options: ['21', '27', '29', '33'], correctAnswer: 2, subject: 'Mathematics' },
  { text: 'The Taj Mahal is located in which city?', options: ['Jaipur', 'Agra', 'Lucknow', 'Delhi'], correctAnswer: 1, subject: 'History' }
];
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Question.deleteMany({});
  await Question.insertMany(questions);
  console.log(`Seeded ${questions.length} questions.`);
  await mongoose.disconnect();
})().catch(err => { console.error(err); process.exit(1); });
