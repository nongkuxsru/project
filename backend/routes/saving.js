const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Saving = require('../models/Saving'); // ใช้โมเดล Saving
const User = require('../models/Users'); // ใช้โมเดล User เพื่ออ้างอิง id_member และ id_staff

async function syncSavings() {
    try {
        // ดึงข้อมูลผู้ใช้ทั้งหมดจาก User collection
        const users = await User.find();

        for (const user of users) {
            // ตรวจสอบว่าผู้ใช้นั้นมีบัญชี Saving อยู่แล้วหรือไม่
            const existingSaving = await Saving.findOne({ id_member: user._id });

            if (!existingSaving) {
                // หากไม่มีบัญชี Saving ให้สร้างบัญชีใหม่
                if (user.permission === 'user') {
                    await Saving.create({
                        id_member: user._id,
                        balance: 0,
                        id_staff: null // กำหนดค่าเป็น null หรือ ID staff ที่ต้องการ
                    });
                    console.log(`Saving account created for user: ${user.name}`);
                }
            } else {
                // หากมีบัญชีอยู่แล้ว ให้แสดงข้อความ (สามารถอัปเดตข้อมูลในบัญชีได้ตามต้องการ)
                console.log(`Saving account already exists for user: ${user.name}`);
            }
        }
        console.log('Saving accounts synchronized successfully!');
    } catch (error) {
        console.error('Error syncing savings:', error);
    }
}

// ฟังก์ชันสำหรับดึงชื่อผู้ใช้จากฐานข้อมูล
const getUserName = async (userId) => {
    const user = await Saving.findOne({ userId }); // ค้นหาผู้ใช้จาก userId
    return user ? user.name : null;
};

// ฟังก์ชันสำหรับบันทึกข้อมูลการออมทรัพย์
const saveSavings = async (req, res) => {
    try {
        const { userId, amount } = req.body;

        // ดึงชื่อผู้ใช้จากฐานข้อมูล
        const name = await getUserName(userId);
        if (!name) {
            return res.status(404).json({ error: 'User not found!' });
        }

        // สร้างข้อมูลใหม่
        const newSaving = new Saving({ name, userId, amount });
        await newSaving.save(); // บันทึกลง MongoDB

        res.status(201).json({ message: 'Data saved successfully!', data: newSaving });
    } catch (error) {
        res.status(500).json({ error: 'Error saving data!', details: error.message });
    }
};

// Route สำหรับบันทึกข้อมูลการออมทรัพย์
router.post('/savings', saveSavings);

// Get all Savings
router.get('/savings', async (req, res, next) => {
    try {
        const savings = await Saving.find().populate('id_member').populate('id_staff'); // ใช้ populate เพื่อดึงข้อมูล id_member และ id_staff
        res.json(savings);
    } catch (err) {
        next(err);
    }
});

// Get Saving by ID
router.get('/savings/:id', async (req, res, next) => {
    try {
        const saving = await Saving.findById(req.params.id).populate('id_member').populate('id_staff');
        if (!saving) return res.status(404).json({ message: 'Saving not found' });
        res.json(saving);
    } catch (err) {
        next(err);
    }
});

// Create a new Saving
router.post('/savings', async (req, res, next) => {
    try {
        // ตรวจสอบว่า id_member และ id_staff เป็น user จริงหรือไม่
        const member = await User.findById(req.body.id_member);
        const staff = await User.findById(req.body.id_staff);

        if (!member) return res.status(404).json({ message: 'id_member not found' });
        if (!staff || staff.permission !== 'staff') {
            return res.status(400).json({ message: 'แกไม่มีสิทธิ์ !!' });
        }

        const newSaving = await Saving.create(req.body);
        res.status(201).json(newSaving);
    } catch (err) {
        next(err);
    }
});

// Update Saving by ID
router.put('/savings/:id', async (req, res, next) => {
    try {
        const updatedSaving = await Saving.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('id_member').populate('id_staff');
        if (!updatedSaving) return res.status(404).json({ message: 'Saving not found' });
        res.json(updatedSaving);
    } catch (err) {
        next(err);
    }
});

// Delete Saving by ID
router.delete('/savings/:id', async (req, res, next) => {
    try {
        const deletedSaving = await Saving.findByIdAndDelete(req.params.id);
        if (!deletedSaving) return res.status(404).json({ message: 'Saving not found' });
        res.json(deletedSaving);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
