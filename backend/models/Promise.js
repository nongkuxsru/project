const mongoose = require('mongoose');
const User = require('./Users'); // เรียกใช้งานโมเดล User
const Saving = require('./Saving'); // เรียกใช้งานโมเดล Saving

const promiseSchema = new mongoose.Schema({
    id_saving: { // อ้างอิงไปยัง Saving
        type: String,  // เปลี่ยนจาก ObjectId เป็น String
        required: true
    },
    Datepromise: { // วันที่ทำสัญญา
        type: Date,
        required: true,
        default: Date.now
    },
    amount: { // จำนวนเงินที่ทำสัญญา
        type: Number,
        required: true,
        min: 0
    },
    interestRate: { // อัตราดอกเบี้ย
        type: Number,
        required: true,
        min: 0,
        max: 25
    },
    DueDate: { // วันที่ครบกำหนด
        type: Date,
        required: true
    },
    payments: [{
        paymentDate: Date,
        amount: Number,
        status: String,
        remainingBalance: Number
    }],
    totalPaid: { type: Number, default: 0 },
    remainingBalance: Number,
    status: { // กำหนดให้มีค่าเป็น pending, approved, rejected
        type: String,
        required: true,
        default: 'pending'
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectionReason: String
});


// Middleware สำหรับตั้งค่า DueDate ให้เป็น Datepromise + 1 เดือน
promiseSchema.pre('validate', function (next) {
    if (!this.DueDate) {
        const datePromise = this.Datepromise || new Date(); // ถ้าไม่มีค่า Datepromise ใช้วันที่ปัจจุบัน
        const dueDate = new Date(datePromise);
        dueDate.setMonth(dueDate.getMonth() + 1); // เพิ่ม 1 เดือน
        this.DueDate = dueDate; // กำหนดค่า DueDate
    }
    next();
});


const Promise = mongoose.model('Promise', promiseSchema);

module.exports = Promise;
