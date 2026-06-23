const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const balitaRoutes = require('./routes/balitaRoutes');
const pemeriksaanRoutes = require('./routes/pemeriksaanRoutes');
const settingRoutes = require('./routes/settingRoutes');
const naiveBayesRoutes = require('./routes/naiveBayesRoutes');
const dummyDataRoutes = require('./routes/dummyDataRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/balita', balitaRoutes);
app.use('/api/pemeriksaan', pemeriksaanRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/naive-bayes', naiveBayesRoutes);
app.use('/api/dummy-data', dummyDataRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SPK Status Gizi Balita API' });
});

module.exports = app;
