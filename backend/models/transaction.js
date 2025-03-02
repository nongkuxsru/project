const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: { // อ้างอิงไปยัง Saving
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Saving',
        required: true
    },
    userName: { // เพิ่มฟิลด์เก็บชื่อผู้ใช้
        type: String,
        required: true
    },
    date: { 
        type: Date, 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['Deposit', 'Withdraw'], 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Completed', 'Pending', 'Failed'], 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
