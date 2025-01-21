const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    address: {
        type: String,
        default: '' // กำหนดค่าเริ่มต้นเป็นค่าว่าง
    },
    phone: {
        type: String,
        default: '' // กำหนดค่าเริ่มต้นเป็นค่าว่าง
    },
    birthday: {
        type: Date,
        default: null // ค่าเริ่มต้นเป็น null
    },
    permission: {
        type: String,
        enum: ['user', 'admin', 'staff'], // กำหนดค่าที่เป็นไปได้
        default: 'user' // ค่าเริ่มต้นเป็น 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
