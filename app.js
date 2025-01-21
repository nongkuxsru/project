const express = require('express');
const mongoose = require('mongoose');
const { readdirSync } = require('fs');

const app = express();
const PORT = 3011;

// Middleware เพื่อ parse JSON body
app.use(express.json());

// เชื่อมต่อฐานข้อมูล MongoDB
mongoose
  .connect('mongodb://127.0.0.1:27017/project')
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1); // หยุดแอปพลิเคชันถ้าการเชื่อมต่อล้มเหลว
  });

// Dynamically load routes
readdirSync('./routes').forEach((routeFile) => {
  app.use('/api', require(`./routes/${routeFile}`));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
