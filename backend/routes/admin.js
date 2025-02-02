const express = require('express');
const router = express.Router();
const User = require('../models/Users'); // นำเข้าโมเดล Users


// API สำหรับดึงข้อมูลสถิติ
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ status: 'active' });
        const totalSavings = await User.aggregate([
            { $group: { _id: null, total: { $sum: "$savings" } } }
        ]);

        res.json({
            totalUsers,
            activeUsers,
            totalSavings: totalSavings[0]?.total || 0,
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching stats' });
    }
});

// API สำหรับดึงข้อมูลกิจกรรมล่าสุด
router.get('/activity', async (req, res) => {
    try {
        const activities = await User.find({}, { name: 1, lastActivity: 1, _id: 0 })
            .sort({ lastActivity: -1 })
            .limit(10);

        res.json(activities.map(activity => ({
            user: activity.name,
            action: 'Logged in',
            date: activity.lastActivity,
        })));
    } catch (error) {
        res.status(500).json({ error: 'Error fetching recent activity' });
    }
});

// API สำหรับดึงข้อมูลผู้ใช้ทั้งหมด
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, { name: 1, email: 1, permission: 1, _id: 1 }); // ดึงข้อมูลเฉพาะ field ที่ต้องการ
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error fetching users' });
    }
});

// Add user
router.post('/users', async (req, res) => {
    try {
        const { name, email, password, address, phone, birthday, permission } = req.body;

        // ตรวจสอบว่าข้อมูลครบถ้วน
        if (!name || !email || !password || !address || !phone || !birthday || !permission) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // สร้างผู้ใช้ใหม่
        const newUser = new User({ name, email, password, address, phone, birthday, permission });
        await newUser.save(); // บันทึกข้อมูลผู้ใช้

        res.status(201).json(newUser); // ส่งข้อมูลผู้ใช้ที่เพิ่มใหม่กลับไป
    } catch (err) {
        console.error('Error adding user:', err); // แสดงข้อผิดพลาดใน console
        res.status(500).json({ message: 'Failed to add user', error: err.message });
    }
});


// Delete User by ID
router.delete('/users/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found' });
        res.json(deletedUser); // ส่งข้อมูลผู้ใช้ที่ถูกลบกลับไป
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Edit User by ID
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // ส่งข้อมูลผู้ใช้ทั้งหมดกลับไป
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            password: user.password,
            address: user.address,
            phone: user.phone,
            birthday: user.birthday,
            permission: user.permission,
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user', error: err.message });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id; // ดึงค่า ID จาก URL
        const updatedData = req.body; // ดึงข้อมูลที่ส่งมาจาก Client

        // ค้นหาและอัปเดตข้อมูลในฐานข้อมูล
        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
            new: true, // ให้คืนค่าข้อมูลที่ถูกอัปเดตกลับมา
            runValidators: true, // ตรวจสอบ validation ของ schema
        });

        // หากไม่พบผู้ใช้ ให้ส่ง error กลับ
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // ส่งข้อมูลใหม่กลับไปยัง Client
        res.json(updatedUser);
    } catch (error) {
        console.error('Failed to update user:', error.message);
        res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
});


module.exports = router;