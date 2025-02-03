const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction'); // นำเข้าโมเดลธุรกรรม
const Saving = require('../models/Saving'); // นำเข้าโมเดลบัญชีการออม
const Promise = require('../models/Promise'); // นำเข้าโมเดลสัญญากู้ยืม

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

// กำหนดเส้นทาง API สำหรับเพิ่มข้อมูลธุรกรรม
router.post('/transactions', async (req, res) => {
    try {
        const transaction = new Transaction(req.body);
        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// API สำหรับดึงข้อมูลบัญชีการออมทั้งหมด
router.get('/saving', async (req, res) => {
    try {
        const savings = await Saving.find({}, { __v: 0 }); // ดึงข้อมูลบัญชีการออมทั้งหมดและไม่รวม __v
        res.json(savings);
    } catch (error) {
        console.error('Error fetching savings:', error);
        res.status(500).json({ error: 'Error fetching savings' });
    }
});

// API ดึงข้อมูลบัญชีตาม userId
router.get('/saving/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const saving = await Saving.findOne({ id_member: userId });
        res.json(saving);
    } catch (error) {
        console.error('Error fetching saving:', error);
        res.status(500).json({ error: 'Error fetching saving' });
    }
});


// API อัปเดตข้อมูลบัญชีการออม
router.put('/saving/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const saving = await Saving.findOneAndUpdate({ id_member: userId }, req.body, { new: true });
        res.json(saving);
    } catch (error) {
        console.error('Error updating saving:', error);
        res.status(500).json({ error: 'Error updating saving' });
    }
});

// API สำหรับเพิ่มข้อมูลบัญชีการออม
router.post('/saving', async (req, res) => {
    try {
        const saving = new Saving(req.body);
        await saving.save();
        res.status(201).json(saving);
    } catch (error) {
        console.error('Error creating saving:', error);
        res.status(500).json({ error: 'Error creating saving' });
    }
});

// API สำหรับตรวจสอบข้อมูลซ้ำของผู้ใช้ในตาราง Saving
router.get('/saving/check/:id_member', async (req, res) => {
    const { id_member } = req.params;
    try {
        // ค้นหาผู้ใช้งานในตาราง Saving โดยใช้ id_member
        const existingSaving = await Saving.findOne({ id_member });

        if (existingSaving) {
            // ถ้ามีข้อมูลบัญชีการออมที่ตรงกับ id_member
            return res.json({ exists: true });
        }
        // ถ้าไม่มีข้อมูลบัญชีการออมสำหรับ id_member
        return res.json({ exists: false });
    } catch (error) {
        console.error('Error checking duplicate user in Saving table:', error);
        res.status(500).json({ error: 'Error checking duplicate user in Saving table' });
    }
});


// API สำหรับดึงข้อมูลสัญญากู้ยืมทั้งหมด
router.get('/promise', async (req, res) => {
    try {
        const promises = await Promise.find().sort({ Datepromise: -1 }); // ดึงข้อมูลสัญญาทั้งหมดและเรียงลำดับตามวันที่
        res.json(promises);
    } catch (error) {
        console.error('Error fetching promises:', error);
        res.status(500).json({ error: 'Error fetching promises' });
    }
});

// API สำหรับเพิ่มข้อมูลสัญญากู้ยืม
router.post('/promise', async (req, res) => {
    try {
        const promise = new Promise(req.body);
        await promise.save();
        res.status(201).json(promise);
    } catch (error) {
        console.error('Error creating promise:', error);
        res.status(500).json({ error: 'Error creating promise' });
    }
});

module.exports = router;
