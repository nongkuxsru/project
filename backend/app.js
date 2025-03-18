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
app.use('/api/public', require('./routes/public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/poster.html'));
});

// Admin routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/admin/admin-dashboard.html'));
});

app.get('/admin/setting', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/admin/setting.html'));
});

app.get('/admin/manage-users', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/admin/manage-users.html'));
});

// Staff routes
app.get('/staff', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/staff/staff-dashboard.html'));
});

app.get('/staff/setting', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/staff/setting.html'));
});

app.get('/staff/manage-users', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/staff/manage-users.html'));
});

app.get('/staff/reports', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/staff/reports.html'));
});

app.get('/staff/saving', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/staff/saving.html'));
});

app.get('/staff/news', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/staff/news.html'));
});

app.get('/staff/dividend', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/staff/dividend.html'));
});

app.get('/staff/promise', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/staff/promise.html'));
});

// Member routes
app.get('/member', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/member/member-dashboard.html'));
});

app.get('/member/setting', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/member/setting.html'));
});

app.get('/member/saving', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/member/saving.html'));
});

app.get('/member/promise', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/member/promise.html'));
});

// Director routes
app.get('/director', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/director/director-dashboard.html'));
});

app.get('/director/setting', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/director/setting.html'));
});

app.get('/director/manage-users', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/director/manage-users.html'));
});

app.get('/director/loan-approval', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/director/loan-approval.html'));
});

app.get('/director/reports', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/director/reports.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

