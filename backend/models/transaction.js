const mongoose = require('mongoose');
const User = require('./Users'); // เรียกใช้งานโมเดล User

const transactionSchema = new mongoose.Schema({
    user: { // อ้างอิงไปยัง User
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
    },
    date: { type: Date, required: true },
    type: { type: String, enum: ['Deposit', 'Withdraw'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Completed', 'Pending', 'Failed'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
