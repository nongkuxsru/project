const express = require('express');
const mongoose = require('mongoose');
const { readdirSync } = require('fs');
const syncSavings = require('./routes/saving'); // Import Middleware ที่สร้าง

const app = express();
const PORT = 3011;

// Middleware เพื่อ parse JSON body
app.use(express.json());

// เชื่อมต่อกับ MongoDB
mongoose
  .connect('mongodb://localhost:27017/project', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('MongoDB connected');
    
    // เรียกใช้ syncSavings
    await syncSavings();
  })
  .catch((err) => console.error('Database connection error:', err));

// Dynamically load routes
readdirSync('./routes').forEach((routeFile) => {
  app.use('/api', require(`./routes/${routeFile}`));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
