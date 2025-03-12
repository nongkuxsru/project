const express = require('express');
const mongoose = require('mongoose');
const { readdirSync, read } = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 4000;

// Middleware เพื่อ parse JSON body
app.use(cors());
app.use(express.json());
app.use(require('morgan')('dev'));

// Serve static files from frontend/public
app.use(express.static(path.join(__dirname, '../frontend/public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// เชื่อมต่อกับ MongoDB
mongoose
.connect('mongodb+srv://admin:admin@cluster0.fg8y9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {})
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });

app.use('/api/auth', require('./routes/auth')); // ใช้ authRouter
app.use('/api/saving', require('./routes/saving'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/user', require('./routes/user'));
app.use("/api/news", require("./routes/news"));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/poster.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/admin/admin-dashboard.html'));
});

app.get('/staff', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/staff/staff-dashboard.html'));
});

app.get('/member', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/member/member-dashboard.html'));
});

app.get('/director', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/director/director-dashboard.html'));
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

