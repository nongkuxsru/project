const express = require('express');
const router = express.Router();
const User = require('../models/Users'); // นำเข้าโมเดล Users
const Saving = require('../models/Saving'); // นำเข้าโมเดลบัญชีการออม
const Promise = require('../models/Promise'); // นำเข้าโมเดล Promise


// API สำหรับดึงข้อมูลสถิติ
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments(); // นับจำนวนผู้ใช้ทั้งหมด
        const activeUsers = await User.countDocuments({ status: 'active' }); // นับจำนวนผู้ใช้ที่มีสถานะ active
        const totalSavings = await Saving.countDocuments(); // นับจำนวนข้อมูลในตาราง savings (แทนการหาผลรวม)

        res.json({
            totalUsers,
            activeUsers,
            totalSavings, // ส่งจำนวนข้อมูลในตาราง savings
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
        const { name, email, password, address, phone, birthday, permission, pin } = req.body;

        // สร้างผู้ใช้ใหม่
        const newUser = new User({ name, email, password, address, phone, birthday, permission, pin });
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
        const user = await User.findByIdAndDelete(req.params.id); // ค้นหาและลบผู้ใช้จากฐานข้อมูล
        if (!user) return res.status(404).json({ message: 'User not found' }); // ถ้าไม่พบผู้ใช้ ส่ง error กลับ

        res.json(user); // ส่งข้อมูลผู้ใช้ที่ถูกลบกลับไป
    } catch (err) {
        console.error('Failed to delete user:', err.message);
        res.status(500).json({ message: 'Failed to delete user', error: err.message });
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

// API สำหรับตั้ง PIN สำหรับผู้ดูแล
router.put('/users/:userId/pin', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { pin } = req.body;

        // ตรวจสอบรูปแบบ PIN
        if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
            return res.status(400).json({ 
                message: 'PIN ไม่ถูกต้อง กรุณาระบุตัวเลข 4 หลัก' 
            });
        }

        // ค้นหาผู้ใช้และตรวจสอบว่าเป็นผู้ดูแลหรือไม่
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
        }

        if (user.permission !== 'admin') {
            return res.status(400).json({ 
                message: 'สามารถตั้ง PIN ได้เฉพาะผู้ดูแลระบบเท่านั้น' 
            });
        }

        // อัปเดต PIN
        user.pin = pin;
        await user.save();

        res.json({ message: 'ตั้ง PIN สำเร็จ' });
    } catch (error) {
        console.error('Error setting PIN:', error);
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาดในการตั้ง PIN', 
            error: error.message 
        });
    }
});

// API สำหรับตรวจสอบ PIN ของ admin
router.post('/verify-pin', async (req, res) => {
    try {
        const { pin } = req.body;

        // ตรวจสอบว่ามีการส่ง PIN มาหรือไม่
        if (!pin) {
            return res.status(400).json({ message: 'กรุณาระบุ PIN' });
        }

        // ตรวจสอบรูปแบบ PIN
        if (pin.length !== 4 || !/^\d+$/.test(pin)) {
            return res.status(400).json({ 
                message: 'PIN ไม่ถูกต้อง กรุณาระบุตัวเลข 4 หลัก' 
            });
        }

        // ค้นหา admin ที่มี PIN ตรงกับที่ส่งมา
        const admin = await User.findOne({ 
            permission: 'admin',
            pin: pin
        });

        if (!admin) {
            return res.status(401).json({ message: 'PIN ไม่ถูกต้อง' });
        }

        // ถ้า PIN ถูกต้อง
        res.json({ 
            message: 'PIN ถูกต้อง',
            verified: true
        });

    } catch (error) {
        console.error('Error verifying PIN:', error);
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาดในการตรวจสอบ PIN', 
            error: error.message 
        });
    }
});

// API สำหรับดึงรายการธุรกรรมที่รอการอนุมัติ
router.get('/promise-status/pending', async (req, res) => {
    try {
        const pendingTransactions = await Promise.find({
            status: 'pending'
        }).select('id_saving Datepromise amount interestRate DueDate totalPaid payments status');

        res.json(pendingTransactions);
    } catch (error) {
        console.error('Error fetching pending transactions:', error);
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลธุรกรรมที่รอการอนุมัติ', 
            error: error.message 
        });
    }
});

// API สำหรับอนุมัติสัญญา
router.put('/promise-status/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId } = req.body;

        // ตรวจสอบว่ามี adminId หรือไม่
        if (!adminId) {
            return res.status(400).json({ message: 'กรุณาระบุ ID ของผู้ดูแลระบบ' });
        }

        // ตรวจสอบว่าผู้ดูแลระบบมีอยู่จริงหรือไม่
        const admin = await User.findById(adminId);
        if (!admin || admin.permission !== 'admin') {
            return res.status(403).json({ message: 'ไม่มีสิทธิ์ในการอนุมัติสัญญา' });
        }

        // ค้นหาและอัปเดตสัญญา
        const promise = await Promise.findById(id);
        if (!promise) {
            return res.status(404).json({ message: 'ไม่พบสัญญา' });
        }

        if (promise.status !== 'pending') {
            return res.status(400).json({ message: 'สัญญานี้ไม่อยู่ในสถานะรอการอนุมัติ' });
        }

        // อัปเดตสถานะสัญญา
        promise.status = 'approved';
        promise.approvedBy = adminId;
        promise.approvedAt = new Date();
        await promise.save();

        res.json({ 
            message: 'อนุมัติสัญญาเรียบร้อย',
            promise: {
                id: promise._id,
                status: promise.status,
                approvedBy: promise.approvedBy,
                approvedAt: promise.approvedAt
            }
        });
    } catch (error) {
        console.error('Error approving promise:', error);
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาดในการอนุมัติสัญญา', 
            error: error.message 
        });
    }
});

// API สำหรับปฏิเสธสัญญา
router.put('/promise-status/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId, reason } = req.body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!adminId) {
            return res.status(400).json({ message: 'กรุณาระบุ ID ของผู้ดูแลระบบ' });
        }
        if (!reason) {
            return res.status(400).json({ message: 'กรุณาระบุเหตุผลในการปฏิเสธ' });
        }

        // ตรวจสอบว่าผู้ดูแลระบบมีอยู่จริงหรือไม่
        const admin = await User.findById(adminId);
        if (!admin || admin.permission !== 'admin') {
            return res.status(403).json({ message: 'ไม่มีสิทธิ์ในการปฏิเสธสัญญา' });
        }

        // ค้นหาและอัปเดตสัญญา
        const promise = await Promise.findById(id);
        if (!promise) {
            return res.status(404).json({ message: 'ไม่พบสัญญา' });
        }

        if (promise.status !== 'pending') {
            return res.status(400).json({ message: 'สัญญานี้ไม่อยู่ในสถานะรอการอนุมัติ' });
        }

        // อัปเดตสถานะสัญญา
        promise.status = 'rejected';
        promise.rejectedBy = adminId;
        promise.rejectedAt = new Date();
        promise.rejectReason = reason;
        await promise.save();

        res.json({ 
            message: 'ปฏิเสธสัญญาเรียบร้อย',
            promise: {
                id: promise._id,
                status: promise.status,
                rejectedBy: promise.rejectedBy,
                rejectedAt: promise.rejectedAt,
                rejectReason: promise.rejectReason
            }
        });
    } catch (error) {
        console.error('Error rejecting promise:', error);
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาดในการปฏิเสธสัญญา', 
            error: error.message 
        });
    }
});






module.exports = router;