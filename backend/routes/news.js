const express = require("express");
const router = express.Router();
const News = require("../models/News");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// กำหนดการจัดเก็บไฟล์
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // ใช้ path.join เพื่อสร้าง path ที่ถูกต้องตาม OS
        const uploadPath = path.join(__dirname, '../../frontend/public/images/news');
        console.log('Upload path:', uploadPath); // เพิ่ม log เพื่อตรวจสอบ path

        // สร้างโฟลเดอร์ถ้ายังไม่มี
        if (!fs.existsSync(uploadPath)) {
            try {
                fs.mkdirSync(uploadPath, { recursive: true });
                console.log('Created directory:', uploadPath);
            } catch (error) {
                console.error('Error creating directory:', error);
                return cb(error);
            }
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'news-' + uniqueSuffix + path.extname(file.originalname);
        console.log('Generated filename:', filename); // เพิ่ม log เพื่อตรวจสอบชื่อไฟล์
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // จำกัดขนาด 2MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (jpg, jpeg, png) เท่านั้น'));
    }
}).single('image');

// Middleware จัดการ error จาก multer
const handleUpload = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // กรณี error จาก multer
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            // กรณี error อื่นๆ
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

// ดึงข่าวทั้งหมด
router.get("/", async (req, res) => {
    try {
        const news = await News.find().sort({ createdAt: -1 });
        res.json(news);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ดึงข่าวตาม ID
router.get("/:id", async (req, res) => {
    try {
        const news = await News.findById(req.params.id);
        if (!news) {
            return res.status(404).json({ message: "ไม่พบข่าวที่ต้องการ" });
        }
        res.json(news);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// เพิ่มข่าวใหม่
router.post("/", handleUpload, async (req, res) => {
    try {
        const { title, content } = req.body;
        let imageUrl;

        if (req.file) {
            // สร้าง URL สำหรับเข้าถึงรูปภาพ
            imageUrl = `/images/news/${req.file.filename}`;
            console.log('Image URL:', imageUrl); // เพิ่ม log เพื่อตรวจสอบ URL
        }

        const newNews = new News({ 
            title, 
            content,
            image: imageUrl
        });

        const savedNews = await newNews.save();
        res.status(201).json(savedNews);
    } catch (error) {
        console.error('Error saving news:', error);
        if (req.file) {
            // ลบไฟล์ถ้าเกิด error
            const filePath = req.file.path;
            fs.unlink(filePath, (unlinkError) => {
                if (unlinkError) {
                    console.error('Error deleting file:', unlinkError);
                }
            });
        }
        res.status(400).json({ message: error.message });
    }
});

// แก้ไขข่าว
router.put("/:id", handleUpload, async (req, res) => {
    try {
        const { title, content } = req.body;
        const newsId = req.params.id;
        
        const existingNews = await News.findById(newsId);
        if (!existingNews) {
            return res.status(404).json({ message: "ไม่พบข่าวที่ต้องการแก้ไข" });
        }

        let imageUrl = existingNews.image;

        if (req.file) {
            // ลบรูปเก่าถ้ามี
            if (existingNews.image) {
                const oldImagePath = path.join(__dirname, '../../frontend/public', existingNews.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            // อัพเดท URL รูปใหม่
            imageUrl = `/images/news/${req.file.filename}`;
        }

        const updatedNews = await News.findByIdAndUpdate(
            newsId,
            {
                title,
                content,
                image: imageUrl
            },
            { new: true }
        );

        res.json(updatedNews);
    } catch (error) {
        console.error('Error updating news:', error);
        if (req.file) {
            fs.unlink(req.file.path, (unlinkError) => {
                if (unlinkError) {
                    console.error('Error deleting file:', unlinkError);
                }
            });
        }
        res.status(400).json({ message: error.message });
    }
});

// ลบข่าว
router.delete("/:id", async (req, res) => {
    try {
        const news = await News.findById(req.params.id);
        if (!news) {
            return res.status(404).json({ message: "ไม่พบข่าวที่ต้องการลบ" });
        }

        // ลบไฟล์รูปภาพ
        if (news.image) {
            const imagePath = path.join('frontend/public', news.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await news.deleteOne();
        res.json({ message: "ลบข่าวสำเร็จ" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
