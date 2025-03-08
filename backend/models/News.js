const mongoose = require("mongoose");

const NewsSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    image: { 
        type: String,
        default: '/images/default-news.jpg'
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
}, {
    timestamps: true // เพิ่ม createdAt และ updatedAt โดยอัตโนมัติ
});

module.exports = mongoose.model("News", NewsSchema);
