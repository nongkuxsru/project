const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Saving = require('../models/Saving'); // ใช้โมเดล Saving
const User = require('../models/Users'); // ใช้โมเดล User เพื่ออ้างอิง id_member และ id_staff

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
