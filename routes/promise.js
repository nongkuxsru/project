const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PromiseModel = require('../models/Promise'); // ใช้โมเดล Promise
const Saving = require('../models/Saving'); // ใช้โมเดล Saving
const User = require('../models/Users'); // ใช้โมเดล User

// Get all Promises
router.get('/promises', async (req, res, next) => {
    try {
        const promises = await PromiseModel.find()
            .populate('id_saving') // ดึงข้อมูล id_saving
            .populate({
                path: 'id_saving',
                populate: {
                    path: 'id_member id_staff', // ดึงข้อมูล id_member และ id_staff ที่อ้างอิงใน Saving
                    model: 'User'
                }
            });
        res.json(promises);
    } catch (err) {
        next(err);
    }
});

// Get Promise by ID
router.get('/promises/:id', async (req, res, next) => {
    try {
        const promise = await PromiseModel.findById(req.params.id)
            .populate('id_saving')
            .populate({
                path: 'id_saving',
                populate: {
                    path: 'id_member id_staff',
                    model: 'User'
                }
            });
        if (!promise) return res.status(404).json({ message: 'Promise not found' });
        res.json(promise);
    } catch (err) {
        next(err);
    }
});

// Create a new Promise
router.post('/promises', async (req, res, next) => {
    try {
        const saving = await Saving.findById(req.body.id_saving);
        if (!saving) return res.status(404).json({ message: 'Saving not found' });

        const newPromise = await PromiseModel.create(req.body);
        res.status(201).json(newPromise);
    } catch (err) {
        next(err);
    }
});

// Update Promise by ID
router.put('/promises/:id', async (req, res, next) => {
    try {
        const updatedPromise = await PromiseModel.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('id_saving')
            .populate({
                path: 'id_saving',
                populate: {
                    path: 'id_member id_staff',
                    model: 'User'
                }
            });
        if (!updatedPromise) return res.status(404).json({ message: 'Promise not found' });
        res.json(updatedPromise);
    } catch (err) {
        next(err);
    }
});

// Delete Promise by ID
router.delete('/promises/:id', async (req, res, next) => {
    try {
        const deletedPromise = await PromiseModel.findByIdAndDelete(req.params.id);
        if (!deletedPromise) return res.status(404).json({ message: 'Promise not found' });
        res.json(deletedPromise);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
