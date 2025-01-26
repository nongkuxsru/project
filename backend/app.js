const express = require('express');
const mongoose = require('mongoose');
const { readdirSync, read } = require('fs');
const syncSavings = require('./routes/saving'); // Import Middleware ที่สร้าง
const path = require('path');

const app = express();
const PORT = 3012;

// Middleware เพื่อ parse JSON body
app.use(express.json());

// Serve static files จากโฟลเดอร์ frontend/public
app.use(express.static(path.join(__dirname, '../frontend/public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// เชื่อมต่อกับ MongoDB
mongoose
  .connect('mongodb://127.0.0.1:27017/project', {
  })
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });

// Dynamically load routes
readdirSync('./routes').forEach((routeFile) => {
  app.use('/api', require(`./routes/${routeFile}`));
});

// สร้าง route สำหรับการ render หน้า index
readdirSync('./routes').forEach((routeFile) => {
  app.use(require(`./routes/${routeFile}`));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

