require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : true }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'mini-online-test-api' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/admin', require('./routes/admin'));
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: 'Internal server error.' }); });
const PORT = process.env.PORT || 5000;
async function start() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) throw new Error('Set MONGO_URI and JWT_SECRET in .env');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
    const exists = await User.findOne({ email });
    if (!exists) await User.create({ name: 'Test Admin', email, password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), role: 'admin' });
  }
  app.listen(PORT, () => console.log(`API running on port ${PORT}`));
}
start().catch(err => { console.error('Server startup failed:', err.message); process.exit(1); });
