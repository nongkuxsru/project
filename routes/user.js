const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/Users');

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
        const User = await User.findById(req.params.id);
        if (!User) return res.status(404).json({ message: 'User not found' });
        res.json(User);
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
router.put('/:id', async (req, res, next) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json(updatedUser);
    } catch (err) {
        next(err);
    }
});

// Delete User by ID
router.delete('/:id', async (req, res, next) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found' });
        res.json(deletedUser);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
