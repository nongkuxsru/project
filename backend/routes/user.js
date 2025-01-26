const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/Users');


// Get all Users with 'admin' permission
router.get('/admin', async (req, res, next) => {
    try {
        const adminUsers = await User.find({ permission: 'admin' }); // กรองเฉพาะ permission ที่เป็น 'admin'
        res.json(adminUsers);
    } catch (err) {
        next(err);
    }
});

// Get all Users with 'admin' permission
router.get('/test', async (req, res, next) => {
    res.json({ message: 'Hello admin' });
});

// Get User by ID with 'admin' permission
router.get('/admin/:id', async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.params.id, permission: 'admin' }); // ค้นหาผู้ใช้ที่มี ID และ permission เป็น 'staff'
        if (!user) {
            return res.status(404).json({ message: 'User not found or user is not a admin' });
        }
        res.json(user);
    } catch (err) {
        next(err);
    }
});


// Get all Users with 'staff' permission
router.get('/staff', async (req, res, next) => {
    try {
        const staffUsers = await User.find({ permission: 'staff' }); // กรองเฉพาะ permission ที่เป็น 'staff'
        res.json(staffUsers);
    } catch (err) {
        next(err);
    }
});

// Get User by ID with 'staff' permission
router.get('/staff/:id', async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.params.id, permission: 'staff' }); // ค้นหาผู้ใช้ที่มี ID และ permission เป็น 'staff'
        if (!user) {
            return res.status(404).json({ message: 'User not found or user is not a staff member' });
        }
        res.json(user);
    } catch (err) {
        next(err);
    }
});

// Get all Users
router.get('/users', async (req, res, next) => {
    try {
        const Users = await User.find();
        res.json(Users);
    } catch (err) {
        next(err);
    }
});

// Get User by ID
router.get('/users/:id', async (req, res, next) => {
    try {
        const Users = await User.findById(req.params.id);
        if (!Users) return res.status(404).json({ message: 'User not found' });
        res.json(Users);
    } catch (err) {
        next(err);
    }
});

// Create a new User
router.post('/users', async (req, res, next) => {
    try {
        const newUser = await User.create(req.body);
        res.status(201).json(newUser);
    } catch (err) {
        next(err);
    }
});

// Update User by ID
router.put('/users/:id', async (req, res, next) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json(updatedUser);
    } catch (err) {
        next(err);
    }
});

// Delete User by ID
router.delete('/users/:id', async (req, res, next) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found' });
        res.json(deletedUser);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
