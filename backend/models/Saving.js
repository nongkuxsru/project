const mongoose = require('mongoose');
const User = require('./Users'); // เรียกใช้งานโมเดล User

const savingSchema = new mongoose.Schema({
    id_account:{
        type: String,
        required: true
    },
    id_member: { // อ้างอิงไปยัง User
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: { // ยอดเงินคงเหลือ
        type: Number,
        required: true
    },
    shares: { // จำนวนหุ้น
        type: Number,
        default: 0
    },
    id_staff: { // อ้างอิงไปยัง User
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: { // วันที่สร้างข้อมูล
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        default: 'active'
    }
});

// Middleware สำหรับคำนวณหุ้นก่อนบันทึก
savingSchema.pre('save', function(next) {
    // คำนวณหุ้นจากยอดเงิน (100 บาท = 1 หุ้น)
    this.shares = Math.floor(this.balance / 100);
    next();
});

// Middleware สำหรับคำนวณหุ้นเมื่อใช้ findOneAndUpdate
savingSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.balance) {
        update.$set.shares = Math.floor(update.$set.balance / 100);
    }
    next();
});

const Saving = mongoose.model('Saving', savingSchema);

module.exports = Saving;
