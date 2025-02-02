const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    user: { type: String, required: true },
    type: { type: String, enum: ['Deposit', 'Withdrawal', 'Transfer'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Completed', 'Pending', 'Failed'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
