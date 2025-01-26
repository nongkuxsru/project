const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Import authController

// Route สำหรับการเข้าสู่ระบบ
router.post('/login', authController.loginUser);

// API สำหรับดึงข้อมูลผู้ใช้
router.get('/user', async (req, res) => {
    try {
        // ตัวอย่าง: ดึงข้อมูลผู้ใช้จาก session หรือ token
        const user = await User.findOne({ email: req.user.email }); // ใช้ข้อมูลจาก session หรือ token
        if (!user) {
            return res.status(404).json({ error: 'User not found!' });
        }

        res.json({
            name: user.name,
            email: user.email,
            permission: user.permission,
        });
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ error: 'Error fetching user info' });
    }
});

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