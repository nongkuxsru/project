const express = require('express');
const mongoose = require('mongoose');
const { readdirSync, read } = require('fs');
const path = require('path');
const savingRouter = require('./routes/saving'); // นำเข้า savingRouter
const authRouter = require('./routes/auth'); // นำเข้า authRouter

const app = express();
const PORT = 5000;

// Middleware เพื่อ parse JSON body
app.use(express.json());
app.use(require('morgan')('dev'));

// Serve static files จากโฟลเดอร์ frontend/public
app.use(express.static(path.join(__dirname, '../frontend/public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// เชื่อมต่อกับ MongoDB
mongoose
.connect('mongodb://127.0.0.1:27017/project', {})
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

// สร้าง route สำหรับการ render หน้า index
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/admin/admin-dashboard.html'));
});

app.get('/staff', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/staff/staff-dashboard.html'));
});

app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/user/user-dashboard.html'));
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

