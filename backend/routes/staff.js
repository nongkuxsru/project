const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction'); // นำเข้าโมเดลธุรกรรม
const User = require('../models/Saving'); // นำเข้าโมเดลบัญชี

// กำหนดเส้นทาง API สำหรับดึงข้อมูลธุรกรรมจาก MongoDB
router.get('/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 }); // ดึงข้อมูลทั้งหมดและเรียงลำดับตามวันที่ล่าสุด
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// API สำหรับดึงข้อมูลผู้ใช้ทั้งหมด
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, { __v: 0 }); // ดึงข้อมูลทั้งหมดและไม่รวม __v
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error fetching users' });
    }
});

// API สำหรับเพิ่มข้อมูลผู้ใช้
router.post('/users', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
});

module.exports = router;
