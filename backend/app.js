const express = require('express');
const mongoose = require('mongoose');
const { readdirSync, read } = require('fs');
const syncSavings = require('./routes/saving'); // Import Middleware ที่สร้าง
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

//Dynamically load routes
// readdirSync('./routes').forEach((routeFile) => {
//   app.use('/api', require(`./routes/${routeFile}`));
// });

// สร้าง route สำหรับการ render หน้า index
// readdirSync('./routes').forEach((routeFile) => {
//   app.use(require(`./routes/${routeFile}`));
// });

// Serve static files จากโฟลเดอร์ frontend/public
app.use(express.static(path.join(__dirname, '../frontend/public')));

// ใช้ authRouter
app.use('/api/auth', authRouter); // ใช้ authRouter


// ใช้ savingRouter สำหรับเส้นทาง /api
app.use('/api', savingRouter);

app.use('/api/admin', require('./routes/admin'));

// สร้าง route สำหรับการ render หน้า index
app.get('/', (req, res) => {
  res.render('index');
});

// Route สำหรับ serve ไฟล์ HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/admin-dashboard.html'));
});

app.get('/staff-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/staff-dashboard.html'));
});

app.get('/user-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/user-dashboard.html'));
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

