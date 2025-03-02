const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'transactions'
});

module.exports = mongoose.model('Transaction', transactionSchema);
