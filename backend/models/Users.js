const mongoose = require('mongoose');
const Saving = require('./Saving'); // Import โมเดล Saving

const UserSchema = new mongoose.Schema({
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
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    birthday: {
        type: Date,
        required: true
    },
    permission: {
        type: String,
        required: true,
        enum: ['admin', 'director', 'staff', 'member'], // จำกัดค่า permission
        default: 'member'
    },
    pin: {
        type: String,
        validate: {
            validator: function(v) {
                if (this.permission === 'admin') {
                    return v && v.length === 4 && /^\d+$/.test(v);
                }
                return true;
            },
            message: 'PIN ต้องเป็นตัวเลข 4 หลักสำหรับผู้ดูแลระบบ'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
