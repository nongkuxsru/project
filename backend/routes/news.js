const express = require("express");
const router = express.Router();
const News = require("../models/News");

// ดึงข่าวทั้งหมด
router.get("/", async (req, res) => {
    try {
        const news = await News.find().sort({ createdAt: -1 });
        res.json(news);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// เพิ่มข่าวใหม่
router.post("/", async (req, res) => {
    const { title, content } = req.body;
    const newNews = new News({ title, content });

    try {
        const savedNews = await newNews.save();
        res.status(201).json(savedNews);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ลบข่าว
router.delete("/:id", async (req, res) => {
    try {
        await News.findByIdAndDelete(req.params.id);
        res.json({ message: "News deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
