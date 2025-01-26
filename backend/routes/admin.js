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

module.exports = router;