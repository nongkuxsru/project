const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Import authController

// Route สำหรับการเข้าสู่ระบบ
router.post('/login', authController.loginUser);

// API สำหรับ Logout
router.post('/logout', (req, res) => {
    try {
        // ตัวอย่าง: ลบ session หรือ token
        res.clearCookie('token'); // ลบ cookie (หากใช้ token)
        res.status(200).json({ message: 'Logout successful!' });
    } catch (error) {
        res.status(500).json({ error: 'Error during logout' });
    }
});
module.exports = router; // ส่งออก router object