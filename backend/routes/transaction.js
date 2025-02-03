const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction'); // นำเข้าโมเดลธุรกรรม
const Saving = require('../models/Saving'); // นำเข้าโมเดลบัญชีการออม


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
