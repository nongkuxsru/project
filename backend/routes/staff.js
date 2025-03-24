const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction'); // นำเข้าโมเดลธุรกรรม
const Saving = require('../models/Saving'); // นำเข้าโมเดลบัญชีการออม
const Promise = require('../models/Promise'); // นำเข้าโมเดลสัญญากู้ยืม
const Dividend = require('../models/Dividend');
const Users = require('../models/Users'); // เพิ่ม import Users model

// กำหนดเส้นทาง API สำหรับดึงข้อมูลธุรกรรมจาก MongoDB
router.get('/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 }); // ดึงข้อมูลทั้งหมดและเรียงลำดับตามวันที่ล่าสุด
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// อัพเดทชื่อผู้ใช้ในตาราง transactions
router.put('/transactions/update-username', async (req, res) => {
    try {
        const { oldUsername, newUsername } = req.body;
        
        // Debug logs
        console.log('Request to update transactions:', { oldUsername, newUsername });

        // Validation
        if (!oldUsername || !newUsername) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาระบุชื่อผู้ใช้เดิมและชื่อใหม่'
            });
        }

        // ค้นหาธุรกรรมก่อนอัพเดท โดยใช้ userName แทน username
        const existingTransactions = await Transaction.find({ userName: oldUsername });
        console.log(`Found ${existingTransactions.length} transactions for ${oldUsername}`);

        if (existingTransactions.length === 0) {
            return res.status(404).json({
                success: false,
                message: `ไม่พบธุรกรรมของผู้ใช้ ${oldUsername}`
            });
        }

        // ทำการอัพเดท โดยใช้ userName แทน username
        const updateResult = await Transaction.updateMany(
            { userName: oldUsername },
            { $set: { userName: newUsername } }
        );

        console.log('Update result:', updateResult);

        // ตรวจสอบผลการอัพเดท
        if (updateResult.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบรายการที่ต้องอัพเดท'
            });
        }

        return res.json({
            success: true,
            message: `อัพเดทชื่อผู้ใช้ในธุรกรรมสำเร็จ ${updateResult.modifiedCount} รายการ`,
            modifiedCount: updateResult.modifiedCount,
            matchedCount: updateResult.matchedCount
        });

    } catch (error) {
        console.error('Error in updateTransactions:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอัพเดทธุรกรรม',
            error: error.message
        });
    }
});

// กำหนดเส้นทาง API สำหรับเพิ่มข้อมูลธุรกรรม
router.post('/transactions', async (req, res) => {
    try {
        const transaction = new Transaction(req.body);
        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// กำหนดเส้นทาง API สำหรับแก้ไขข้อมูลธุรกรรม
router.put('/transactions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const transaction = await Transaction.findByIdAndUpdate(id, req.body, { new: true });
        res.json(transaction);
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// API สำหรับดึงข้อมูลบัญชีการออมทั้งหมด
router.get('/saving', async (req, res) => {
    try {
        const savings = await Saving.find({}, { __v: 0 }); // ดึงข้อมูลบัญชีการออมทั้งหมดและไม่รวม __v
        res.json(savings);
    } catch (error) {
        console.error('Error fetching savings:', error);
        res.status(500).json({ error: 'Error fetching savings' });
    }
});

// API ดึงข้อมูลบัญชีตาม userId
router.get('/saving/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const saving = await Saving.findOne({ id_member: userId });
        res.json(saving);
    } catch (error) {
        console.error('Error fetching saving:', error);
        res.status(500).json({ error: 'Error fetching saving' });
    }
});

// API ดึงข้อมูลบัญชีตาม id_account
router.get('/saving/account/:accountId', async (req, res) => {
    const { accountId } = req.params;
    try {
        const saving = await Saving.findOne({ id_account: accountId });
        if (!saving) {
            return res.status(404).json({ error: 'Saving account not found' });
        }
        res.json(saving);
    } catch (error) {
        console.error('Error fetching saving by account ID:', error);
        res.status(500).json({ error: 'Error fetching saving account' });
    }
});


// API อัปเดตข้อมูลบัญชีการออม
router.put('/saving/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const saving = await Saving.findOneAndUpdate({ id_member: userId }, req.body, { new: true });
        res.json(saving);
    } catch (error) {
        console.error('Error updating saving:', error);
        res.status(500).json({ error: 'Error updating saving' });
    }
});

// API สำหรับการทำธุรกรรมฝาก-ถอนเงิน
router.put('/saving/transaction/:userId', async (req, res) => {
    const { userId } = req.params;
    const { amount, type } = req.body;
    
    try {
        // ค้นหาบัญชีออมทรัพย์
        const saving = await Saving.findOne({ id_member: userId });
        
        if (!saving) {
            return res.status(404).json({ error: 'ไม่พบบัญชีออมทรัพย์' });
        }

        console.log('ข้อมูลก่อนทำธุรกรรม:', {
            balance: saving.balance,
            shares: saving.shares,
            amount: amount,
            type: type
        });

        // คำนวณยอดเงินใหม่ (ไม่รวมการคำนวณหุ้น)
        if (type === 'deposit') {
            saving.balance += amount;
        } else if (type === 'withdraw') {
            // ตรวจสอบว่ามีเงินเพียงพอสำหรับการถอน
            if (saving.balance < amount) {
                return res.status(400).json({ error: 'ยอดเงินในบัญชีไม่เพียงพอ' });
            }
            saving.balance -= amount;
        } else if (type === 'buyShares') {
            // กรณีซื้อหุ้น
            const sharesToBuy = parseInt(req.body.shares) || 0;
            const sharePrice = 100; // ราคาหุ้นละ 100 บาท
            const totalPrice = sharesToBuy * sharePrice;
            
            // ตรวจสอบว่าจำนวนหุ้นที่ซื้อไม่เกิน 5 หุ้น
            if (sharesToBuy > 5) {
                return res.status(400).json({ error: 'สามารถซื้อหุ้นได้ไม่เกิน 5 หุ้นต่อครั้ง' });
            }
            
            // อัปเดตจำนวนหุ้น
            saving.shares = (saving.shares || 0) + sharesToBuy;
        } else {
            return res.status(400).json({ error: 'ประเภทธุรกรรมไม่ถูกต้อง' });
        }

        console.log('ข้อมูลก่อนบันทึก:', {
            balance: saving.balance,
            shares: saving.shares
        });

        // บันทึกข้อมูล
        const savedSaving = await saving.save();
        
        console.log('ข้อมูลหลังบันทึก:', {
            balance: savedSaving.balance,
            shares: savedSaving.shares
        });

        // สร้างประวัติธุรกรรม
        let transactionType = 'Unknown';
        if (type === 'deposit') transactionType = 'Deposit';
        else if (type === 'withdraw') transactionType = 'Withdraw';
        else if (type === 'buyShares') transactionType = 'BuyShares';

        const transaction = new Transaction({
            userName: req.body.userName || 'ไม่ระบุชื่อ',
            type: transactionType,
            amount: amount,
            date: new Date(),
            status: 'Completed',
            shares_added: type === 'buyShares' ? parseInt(req.body.shares) || 0 : 0
        });
        await transaction.save();

        // ดึงข้อมูลล่าสุดเพื่อความแน่ใจ
        const finalSaving = await Saving.findOne({ id_member: userId });
        
        console.log('ข้อมูลสุดท้าย:', {
            balance: finalSaving.balance,
            shares: finalSaving.shares
        });

        res.json({
            saving: finalSaving,
            transaction: transaction
        });
    } catch (error) {
        console.error('Error processing transaction:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการทำธุรกรรม' });
    }
});

// API สำหรับเพิ่มข้อมูลบัญชีการออม
router.post('/saving', async (req, res) => {
    try {
        const saving = new Saving(req.body);
        await saving.save();
        res.status(201).json(saving);
    } catch (error) {
        console.error('Error creating saving:', error);
        res.status(500).json({ error: 'Error creating saving' });
    }
    
});

// API สำหรับตรวจสอบข้อมูลซ้ำของผู้ใช้ในตาราง Saving
router.get('/saving/check/:id_member', async (req, res) => {
    const { id_member } = req.params;
    try {
        // ค้นหาผู้ใช้งานในตาราง Saving โดยใช้ id_member
        const existingSaving = await Saving.findOne({ id_member });

        if (existingSaving) {
            // ถ้ามีข้อมูลบัญชีการออมที่ตรงกับ id_member
            return res.json({ exists: true });
        }
        // ถ้าไม่มีข้อมูลบัญชีการออมสำหรับ id_member
        return res.json({ exists: false });
    } catch (error) {
        console.error('Error checking duplicate user in Saving table:', error);
        res.status(500).json({ error: 'Error checking duplicate user in Saving table' });
    }
});

// API สำหรับลบข้อมูลบัญชีการออม
router.delete('/saving/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const saving = await Saving.findOneAndDelete({ id_member: userId });
        res.json(saving);
    } catch (error) {
        console.error('Error deleting saving:', error);
        res.status(500).json({ error: 'Error deleting saving' });
    }
});

// API สำหรับดึงข้อมูลสัญญากู้ยืมทั้งหมด
router.get('/promise', async (req, res) => {
    try {
        const promises = await Promise.find().sort({ Datepromise: -1 }); // ดึงข้อมูลสัญญาทั้งหมดและเรียงลำดับตามวันที่
        res.json(promises);
    } catch (error) {
        console.error('Error fetching promises:', error);
        res.status(500).json({ error: 'Error fetching promises' });
    }
});

// API สำหรับเพิ่มข้อมูลสัญญากู้ยืม
router.post('/promise', async (req, res) => {
    try {
        const promise = new Promise(req.body);
        await promise.save();
        res.status(201).json(promise);
    } catch (error) {
        console.error('Error creating promise:', error);
        res.status(500).json({ error: 'Error creating promise' });
    }
});

// API สำหรับตรวจสอบข้อมูลซ้ำของผู้ใช้ในตาราง Promise
router.get('/promise/check/:id_member', async (req, res) => {
    const { id_member } = req.params;
    try {
        // ค้นหาผู้ใช้งานในตาราง Promise โดยใช้ id_member
        const existingPromise = await Promise.findOne({ id_member });

        if (existingPromise) {
            // ถ้ามีข้อมูลสัญญาที่ตรงกับ id_member
            return res.json({ exists: true });
        }
        // ถ้าไม่มีข้อมูลสัญญาสำหรับ id_member
        return res.json({ exists: false });
    } catch (error) {
        console.error('Error checking duplicate user in Promise table:', error);
        res.status(500).json({ error: 'Error checking duplicate user in Promise table' });
    }
});

// API สำหรับดึงข้อมูลสัญญากู้ยืมตาม id_saving
router.get('/promise/:id_saving', async (req, res) => {
    const { id_saving } = req.params;
    try {
        const promise = await Promise.findOne({ id_saving });
        res.json(promise);
    } catch (error) {
        console.error('Error fetching promise:', error);
        res.status(500).json({ error: 'Error fetching promise' });
    }
});

// API สำหรับการชำระเงินสัญญา
router.post('/promise/:id/payment', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, paymentDate } = req.body;

        const promise = await Promise.findById(id);
        if (!promise) {
            return res.status(404).json({ error: 'ไม่พบสัญญาเงินกู้' });
        }

        // คำนวณดอกเบี้ยและยอดรวม
        const totalAmount = promise.amount + (promise.amount * promise.interestRate / 100);
        const newPayment = {
            paymentDate: paymentDate || new Date(),
            amount: amount,
            status: 'completed',
            remainingBalance: totalAmount - (promise.totalPaid + amount)
        };

        // เพิ่มประวัติการชำระเงิน
        promise.payments.push(newPayment);
        promise.totalPaid += amount;
        promise.remainingBalance = newPayment.remainingBalance;

        // อัพเดตสถานะสัญญา
        if (promise.remainingBalance <= 0) {
            promise.status = 'completed';
        }

        await promise.save();

        res.json({
            message: 'บันทึกการชำระเงินสำเร็จ',
            payment: newPayment,
            promise: promise
        });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน' });
    }
});

// API สำหรับคำนวณเงินปันผลประจำปี
router.post('/dividend/calculate', async (req, res) => {
    try {
        const { year } = req.body;
        
        // 1. หาดอกเบี้ยรวมจากการกู้ยืมในปีที่ระบุ
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        
        const promises = await Promise.find({
            status: 'completed',
            DueDate: { $gte: startDate, $lte: endDate }
        });

        let totalInterest = 0;
        promises.forEach(promise => {
            const interest = (promise.amount * promise.interestRate) / 100;
            totalInterest += interest;
        });

        // 2. หาจำนวนหุ้นทั้งหมดในระบบ
        const savings = await Saving.find();
        const totalShares = savings.reduce((sum, saving) => sum + (saving.shares || 0), 0);

        // 3. สร้างรายการปันผล
        const dividend = new Dividend({
            year,
            totalInterest,
            totalShares,
            distributions: savings.map(saving => ({
                saving_id: saving.id_account,
                shares: saving.shares || 0,
                amount: 0 // จะคำนวณในขั้นตอนถัดไป
            }))
        });

        // 4. คำนวณเงินปันผลต่อหุ้น
        const dividendPerShare = dividend.calculateDividendPerShare();

        // 5. คำนวณเงินปันผลสำหรับแต่ละบัญชี
        dividend.distributions = dividend.distributions.map(dist => ({
            ...dist,
            amount: dist.shares * dividendPerShare
        }));

        await dividend.save();

        res.json({
            success: true,
            dividend: {
                year,
                totalInterest,
                totalShares,
                dividendPerShare,
                distributions: dividend.distributions
            }
        });

    } catch (error) {
        console.error('Error calculating dividend:', error);
        res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาดในการคำนวณเงินปันผล',
            error: error.message 
        });
    }
});

// API สำหรับจ่ายเงินปันผล
router.post('/dividend/distribute/:id', async (req, res) => {
    try {
        const dividend = await Dividend.findById(req.params.id);
        if (!dividend) {
            return res.status(404).json({ 
                success: false, 
                message: 'ไม่พบข้อมูลการปันผล' 
            });
        }

        // ตรวจสอบสถานะ
        if (dividend.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'การปันผลนี้ถูกดำเนินการไปแล้วหรือถูกยกเลิก' 
            });
        }

        // ดำเนินการจ่ายเงินปันผล
        for (const dist of dividend.distributions) {
            const saving = await Saving.findOne({ id_account: dist.saving_id });
            if (saving) {
                saving.balance += dist.amount;
                await saving.save();
            }
        }

        // อัพเดทสถานะการปันผล
        dividend.status = 'distributed';
        await dividend.save();

        res.json({
            success: true,
            message: 'จ่ายเงินปันผลเรียบร้อยแล้ว',
            dividend
        });

    } catch (error) {
        console.error('Error distributing dividend:', error);
        res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาดในการจ่ายเงินปันผล',
            error: error.message 
        });
    }
});

// API สำหรับดูประวัติการปันผล
router.get('/dividend/history', async (req, res) => {
    try {
        const dividends = await Dividend.find().sort({ year: -1 });
        res.json({
            success: true,
            dividends
        });
    } catch (error) {
        console.error('Error fetching dividend history:', error);
        res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการปันผล',
            error: error.message 
        });
    }
});

// API สำหรับดูรายละเอียดการปันผล
router.get('/dividend/:id', async (req, res) => {
    try {
        console.log('Fetching dividend with ID:', req.params.id);
        
        const dividend = await Dividend.findById(req.params.id);
        console.log('Found dividend:', dividend);
        
        if (!dividend) {
            return res.status(404).json({ 
                success: false, 
                message: 'ไม่พบข้อมูลการปันผล' 
            });
        }

        // แปลง dividend เป็น plain object
        const dividendObj = dividend.toObject();
        console.log('Processing distributions:', dividendObj.distributions);
        
        // ดึงข้อมูลบัญชีเงินฝากและข้อมูลผู้ใช้แบบ sequential
        const detailedDistributions = [];
        for (const dist of dividendObj.distributions) {
            console.log('Processing distribution for saving_id:', dist.saving_id);
            
            const saving = await Saving.findOne({ id_account: dist.saving_id });
            console.log('Found saving account:', saving);
            
            // ดึงข้อมูลผู้ใช้จาก id_member
            let memberName = 'ไม่ระบุชื่อ';
            if (saving && saving.id_member) {
                const user = await Users.findById(saving.id_member);
                if (user) {
                    memberName = user.name;
                }
            }
            
            detailedDistributions.push({
                saving_id: dist.saving_id,
                shares: dist.shares,
                amount: dist.amount,
                distributed_at: dist.distributed_at,
                member_name: memberName
            });
        }

        console.log('All detailed distributions:', detailedDistributions);

        const detailedDividend = {
            ...dividendObj,
            distributions: detailedDistributions
        };

        console.log('Final detailed dividend:', detailedDividend);

        res.json({
            success: true,
            dividend: detailedDividend
        });
    } catch (error) {
        console.error('Error in /dividend/:id:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียดการปันผล',
            error: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;
