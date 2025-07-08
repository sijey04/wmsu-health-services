require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

// Import routes
const patientsRoute = require('./routes/patients');
const appointmentsRoute = require('./routes/appointments');
const staffRoute = require('./routes/staff');
const authRoute = require('./routes/auth');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/patients', patientsRoute);
app.use('/api/appointments', appointmentsRoute);
app.use('/api/staff', staffRoute);
app.use('/api/auth', authRoute);

// Root route
app.get('/', (req, res) => {
  res.send('WMSU Health Services API is running');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
