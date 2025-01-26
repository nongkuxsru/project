const mongoose = require('mongoose');
const User = require('./Users'); // เรียกใช้งานโมเดล User
const Saving = require('./Saving'); // เรียกใช้งานโมเดล Saving

const promiseSchema = new mongoose.Schema({
    id_saving:{ // อ้างอิงไปยัง Saving
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Saving',
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
    DueDate: { // วันที่ครบกำหนด
        type: Date,
        required: true
    }
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
