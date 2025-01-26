const mongoose = require('mongoose');
const User = require('./Users'); // เรียกใช้งานโมเดล User

const savingSchema = new mongoose.Schema({
    id_member: { // อ้างอิงไปยัง User
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: { // ยอดเงินคงเหลือ
        type: Number,
        required: true
    },
    id_staff: { // อ้างอิงไปยัง User
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: { // วันที่สร้างข้อมูล
        type: Date,
        default: Date.now
    }
});

// Middleware สำหรับตรวจสอบ permission ของ id_staff
savingSchema.pre('save', async function (next) {
    try {
        // ค้นหา user ที่มี _id ตรงกับ id_staff
        const staffUser = await User.findById(this.id_staff);
        
        // ตรวจสอบว่า user มีสิทธิ์เป็น staff หรือไม่
        if (!staffUser || staffUser.permission !== 'staff') {
            const error = new Error('id_staff must have permission "staff".');
            return next(error);
        }
        
        // ถ้าตรงตามเงื่อนไข ให้ดำเนินการต่อ
        next();
    } catch (err) {
        next(err);
    }
});

const Saving = mongoose.model('Saving', savingSchema);

module.exports = Saving;
