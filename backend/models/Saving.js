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

const Saving = mongoose.model('Saving', savingSchema);

module.exports = Saving;
