const mongoose = require('mongoose');

const dividendSchema = new mongoose.Schema({
    year: {
        type: Number,
        required: true
    },
    totalInterest: {
        type: Number,
        required: true,
        default: 0
    },
    totalShares: {
        type: Number,
        required: true,
        default: 0
    },
    dividendPerShare: {
        type: Number,
        required: true,
        default: 0
    },
    distributions: [{
        saving_id: {
            type: String,
            required: true
        },
        shares: {
            type: Number,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        distributed_at: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'distributed', 'cancelled'],
        default: 'pending'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// คำนวณเงินปันผลต่อหุ้น
dividendSchema.methods.calculateDividendPerShare = function() {
    if (this.totalShares === 0) return 0;
    this.dividendPerShare = this.totalInterest / this.totalShares;
    return this.dividendPerShare;
};

const Dividend = mongoose.model('Dividend', dividendSchema);
module.exports = Dividend; 