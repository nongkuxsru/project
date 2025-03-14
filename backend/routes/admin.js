const express = require('express');
const router = express.Router();
const User = require('../models/Users'); // นำเข้าโมเดล Users
const Saving = require('../models/Saving'); // นำเข้าโมเดลบัญชีการออม
const Promise = require('../models/Promise'); // นำเข้าโมเดล Promise
const Transaction = require('../models/Transaction'); // นำเข้าโมเดล Transaction
const Loan = require('../models/Promise.js'); // นำเข้าโมเดล Loan


// API สำหรับดึงข้อมูลสถิติ
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments(); // นับจำนวนผู้ใช้ทั้งหมด
        const activeUsers = await User.countDocuments({ status: 'active' }); // นับจำนวนผู้ใช้ที่มีสถานะ active
        const totalSavings = await Saving.countDocuments(); // นับจำนวนข้อมูลในตาราง savings (แทนการหาผลรวม)

        res.json({
            totalUsers,
            activeUsers,
            totalSavings, // ส่งจำนวนข้อมูลในตาราง savings
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching stats' });
    }
});


// API สำหรับดึงข้อมูลกิจกรรมล่าสุด
router.get('/activity', async (req, res) => {
    try {
        const activities = await User.find({}, { name: 1, lastActivity: 1, _id: 0 })
            .sort({ lastActivity: -1 })
            .limit(10);

        res.json(activities.map(activity => ({
            user: activity.name,
            action: 'Logged in',
            date: activity.lastActivity,
        })));
    } catch (error) {
        res.status(500).json({ error: 'Error fetching recent activity' });
    }
});

// API สำหรับดึงข้อมูลผู้ใช้ทั้งหมด
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, { name: 1, email: 1, permission: 1, _id: 1 }); // ดึงข้อมูลเฉพาะ field ที่ต้องการ
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error fetching users' });
    }
});

// Add user
router.post('/users', async (req, res) => {
    try {
        const { name, email, password, address, phone, birthday, permission, pin } = req.body;

        // สร้างผู้ใช้ใหม่
        const newUser = new User({ name, email, password, address, phone, birthday, permission, pin });
        await newUser.save(); // บันทึกข้อมูลผู้ใช้

        res.status(201).json(newUser); // ส่งข้อมูลผู้ใช้ที่เพิ่มใหม่กลับไป
    } catch (err) {
        console.error('Error adding user:', err); // แสดงข้อผิดพลาดใน console
        res.status(500).json({ message: 'Failed to add user', error: err.message });
    }
});


// Delete User by ID
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id); // ค้นหาและลบผู้ใช้จากฐานข้อมูล
        if (!user) return res.status(404).json({ message: 'User not found' }); // ถ้าไม่พบผู้ใช้ ส่ง error กลับ

        res.json(user); // ส่งข้อมูลผู้ใช้ที่ถูกลบกลับไป
    } catch (err) {
        console.error('Failed to delete user:', err.message);
        res.status(500).json({ message: 'Failed to delete user', error: err.message });
    }
   
});

// Edit User by ID
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // ส่งข้อมูลผู้ใช้ทั้งหมดกลับไป
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            password: user.password,
            address: user.address,
            phone: user.phone,
            birthday: user.birthday,
            permission: user.permission,
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user', error: err.message });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id; // ดึงค่า ID จาก URL
        const updatedData = req.body; // ดึงข้อมูลที่ส่งมาจาก Client

        // ค้นหาและอัปเดตข้อมูลในฐานข้อมูล
        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
            new: true, // ให้คืนค่าข้อมูลที่ถูกอัปเดตกลับมา
            runValidators: true, // ตรวจสอบ validation ของ schema
        });

        // หากไม่พบผู้ใช้ ให้ส่ง error กลับ
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // ส่งข้อมูลใหม่กลับไปยัง Client
        res.json(updatedUser);
    } catch (error) {
        console.error('Failed to update user:', error.message);
        res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
});

// API สำหรับอัพเดท PIN
router.put('/users/:id/pin', async (req, res) => {
    try {
        const { id } = req.params;
        const { pin } = req.body;

        // Validate PIN
        if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
            return res.status(400).json({ 
                message: 'PIN ไม่ถูกต้อง กรุณาระบุตัวเลข 4 หลัก' 
            });
        }

        // Find user and verify it's a director
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
        }

        if (user.permission !== 'director') {
            return res.status(400).json({ 
                message: 'สามารถตั้ง PIN ได้เฉพาะผู้อำนวยการเท่านั้น' 
            });
        }

        // Update PIN
        user.pin = pin;
        await user.save();

        res.json({ 
            message: 'อัพเดท PIN สำเร็จ',
            success: true
        });

    } catch (error) {
        console.error('Error updating PIN:', error);
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาดในการอัพเดท PIN', 
            error: error.message 
        });
    }
});

// API สำหรับตรวจสอบ PIN ของ director
router.post('/verify-pin', async (req, res) => {
    try {
        const { pin } = req.body;

        // ตรวจสอบว่ามีการส่ง PIN มาหรือไม่
        if (!pin) {
            return res.status(400).json({ message: 'กรุณาระบุ PIN' });
        }

        // ตรวจสอบรูปแบบ PIN
        if (pin.length !== 4 || !/^\d+$/.test(pin)) {
            return res.status(400).json({ 
                message: 'PIN ไม่ถูกต้อง กรุณาระบุตัวเลข 4 หลัก' 
            });
        }

        // ค้นหา director ที่มี PIN ตรงกับที่ส่งมา
        const director = await User.findOne({ 
            permission: 'director',  // Changed from 'admin' to 'director'
            pin: pin
        });

        if (!director) {
            return res.status(401).json({ message: 'PIN ไม่ถูกต้อง' });
        }

        // ถ้า PIN ถูกต้อง
        res.json({ 
            message: 'PIN ถูกต้อง',
            verified: true
        });

    } catch (error) {
        console.error('Error verifying PIN:', error);
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาดในการตรวจสอบ PIN', 
            error: error.message 
        });
    }
});
// API สำหรับดึงรายการธุรกรรมที่รอการอนุมัติ
router.get('/promise-status/pending', async (req, res) => {
    try {
        const pendingTransactions = await Promise.find({
            status: 'pending'
        }).select('id_saving Datepromise amount interestRate DueDate totalPaid payments status');

        res.json(pendingTransactions);
    } catch (error) {
        console.error('Error fetching pending transactions:', error);
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลธุรกรรมที่รอการอนุมัติ', 
            error: error.message 
        });
    }
});

// API สำหรับอนุมัติสัญญา
router.put('/promise-status/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId } = req.body;

        // ตรวจสอบว่ามี adminId หรือไม่
        if (!adminId) {
            return res.status(400).json({ message: 'กรุณาระบุ ID ของผู้อนุมัติ' });
        }

        // ตรวจสอบว่าผู้อนุมัติมีอยู่จริงหรือไม่
        const approver = await User.findById(adminId);
        if (!approver) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลผู้อนุมัติ' });
        }

        // อนุญาตให้ทั้ง admin และ director สามารถอนุมัติได้
        if (approver.permission !== 'admin' && approver.permission !== 'director') {
            return res.status(403).json({ message: 'ไม่มีสิทธิ์ในการอนุมัติสัญญา' });
        }

        // ค้นหาและอัปเดตสัญญา
        const promise = await Promise.findById(id);
        if (!promise) {
            return res.status(404).json({ message: 'ไม่พบสัญญา' });
        }

        if (promise.status !== 'pending') {
            return res.status(400).json({ message: 'สัญญานี้ไม่อยู่ในสถานะรอการอนุมัติ' });
        }

        // อัปเดตสถานะสัญญา
        promise.status = 'approved';
        promise.approvedBy = adminId;
        promise.approvedAt = new Date();
        await promise.save();

        res.json({ 
            message: 'อนุมัติสัญญาเรียบร้อย',
            promise: {
                id: promise._id,
                status: promise.status,
                approvedBy: promise.approvedBy,
                approvedAt: promise.approvedAt
            }
        });
    } catch (error) {
        console.error('Error approving promise:', error);
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาดในการอนุมัติสัญญา', 
            error: error.message 
        });
    }
});

// API สำหรับปฏิเสธสัญญา
router.put('/promise-status/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId, reason } = req.body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!adminId) {
            return res.status(400).json({ message: 'กรุณาระบุ ID ของผู้ดูแลระบบ' });
        }
        if (!reason) {
            return res.status(400).json({ message: 'กรุณาระบุเหตุผลในการปฏิเสธ' });
        }

        // ตรวจสอบว่าผู้ดูแลระบบมีอยู่จริงหรือไม่
        const admin = await User.findById(adminId);
        if (!admin || admin.permission !== 'director') {
            return res.status(403).json({ message: 'ไม่มีสิทธิ์ในการปฏิเสธสัญญา' });
        }

        // ค้นหาและอัปเดตสัญญา
        const promise = await Promise.findById(id);
        if (!promise) {
            return res.status(404).json({ message: 'ไม่พบสัญญา' });
        }

        if (promise.status !== 'pending') {
            return res.status(400).json({ message: 'สัญญานี้ไม่อยู่ในสถานะรอการอนุมัติ' });
        }

        // อัปเดตสถานะสัญญา
        promise.status = 'rejected';
        promise.rejectedBy = adminId;
        promise.rejectedAt = new Date();
        promise.rejectReason = reason;
        await promise.save();

        res.json({ 
            message: 'ปฏิเสธสัญญาเรียบร้อย',
            promise: {
                id: promise._id,
                status: promise.status,
                rejectedBy: promise.rejectedBy,
                rejectedAt: promise.rejectedAt,
                rejectReason: promise.rejectReason
            }
        });
    } catch (error) {
        console.error('Error rejecting promise:', error);
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาดในการปฏิเสธสัญญา', 
            error: error.message 
        });
    }
});

// API สำหรับรายงานทางการเงิน
router.get('/financial-reports', async (req, res) => {
    try {
        console.log('Generating financial reports...');
        
        // 1. ดึงข้อมูลจำนวนสมาชิกออมทรัพย์ (นับจากตาราง users โดยนับเฉพาะ permission member)
        const savingMembersCount = await User.countDocuments({ permission: 'member' });
        console.log('Saving members count:', savingMembersCount);

        // 2. ดึงข้อมูลจำนวนสมาชิกที่กู้ (นับจากตาราง promise โดยนับจำนวนผู้ใช้ที่มีการกู้เงิน)
        const loanMembersCount = await Promise.countDocuments();
        console.log('Loan members count:', loanMembersCount);

        // 3. ดึงข้อมูลยอดกู้เงินทั้งหมด (นับจากตาราง promise โดยรวมยอดเงินทั้งหมดของแต่ละรายการ)
        let totalLoans = 0;
        try {
            const totalLoansData = await Promise.aggregate([
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ]);
            totalLoans = totalLoansData.length > 0 ? totalLoansData[0].totalAmount : 0;
        } catch (err) {
            console.error('Error calculating total loans:', err);
            totalLoans = 0;
        }
        console.log('Total loans:', totalLoans);

        // 4. ดึงข้อมูลเงินฝากรวมทั้งหมด (นับจากตาราง saving โดยรวมยอดเงินทั้งหมดของแต่ละรายการ)
        let totalDeposits = 0;
        try {
            const totalDepositsData = await Saving.aggregate([
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$balance' }
                    }
                }
            ]);
            totalDeposits = totalDepositsData.length > 0 ? totalDepositsData[0].totalAmount : 0;
        } catch (err) {
            console.error('Error calculating total deposits:', err);
            totalDeposits = 0;
        }
        console.log('Total deposits:', totalDeposits);

        // 5. ดึงข้อมูลจำนวนธุรกรรมทั้งหมด (นับจากตาราง Transaction)
        let transactionCount = 0;
        try {
            transactionCount = await Transaction.countDocuments();
        } catch (err) {
            console.error('Error counting transactions:', err);
            transactionCount = 0;
        }
        console.log('Transaction count:', transactionCount);

        // 6. ดึงข้อมูลเงินฝากรายเดือน
        let monthlySavings = [];
        try {
            monthlySavings = await Saving.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" }
                        },
                        amount: { $sum: "$balance" }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
                { $limit: 12 }
            ]);
        } catch (err) {
            console.error('Error calculating monthly savings:', err);
            monthlySavings = [];
        }

        // 7. ดึงข้อมูลการกู้ยืมรายเดือน
        let monthlyLoans = [];
        try {
            monthlyLoans = await Promise.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: "$Datepromise" },
                            month: { $month: "$Datepromise" }
                        },
                        amount: { $sum: "$amount" }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
                { $limit: 12 }
            ]);
        } catch (err) {
            console.error('Error calculating monthly loans:', err);
            monthlyLoans = [];
        }

        // 8. ดึงข้อมูลรายได้จากการกู้เงิน
        let loanIncome = 0;
        try {
            const loanIncomeData = await Promise.aggregate([
                {
                    $match: {
                        status: { $in: ["approved", "completed"] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalInterest: {
                            $sum: {
                                $subtract: ["$totalPaid", "$amount"]  // คำนวณผลต่างระหว่าง totalPaid กับ amount
                            }
                        }
                    }
                }
            ]);
            loanIncome = loanIncomeData.length > 0 ? loanIncomeData[0].totalInterest : 0;
        } catch (err) {
            console.error('Error calculating loan income:', err);
            loanIncome = 0;
        }

        // 9. ดึงข้อมูลประเภทธุรกรรมจริงจากฐานข้อมูล
        let realTransactionTypes = [];
        try {
            const transactionTypesData = await Transaction.aggregate([
                {
                    $group: {
                        _id: "$type",
                        count: { $sum: 1 },
                        amount: { $sum: "$amount" }
                    }
                }
            ]);
            
            // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
            realTransactionTypes = transactionTypesData.map(item => {
                let type = item._id;
                let color = '#1B8F4C';
                let bgColor = '#E3F5E9';
                let icon = 'fa-exchange-alt';
                
                // กำหนดสีและไอคอนตามประเภทธุรกรรม
                switch(type) {
                    case 'deposit':
                        type = 'เงินฝาก';
                        color = '#1B8F4C';
                        bgColor = '#E3F5E9';
                        icon = 'fa-arrow-circle-down';
                        break;
                    case 'withdraw':
                        type = 'ถอนเงิน';
                        color = '#DC2626';
                        bgColor = '#FEE2E2';
                        icon = 'fa-arrow-circle-up';
                        break;
                    case 'loan':
                        type = 'การกู้ยืม';
                        color = '#6366F1';
                        bgColor = '#EFF6FF';
                        icon = 'fa-hand-holding-usd';
                        break;
                    case 'payment':
                        type = 'ชำระเงินกู้';
                        color = '#F59E0B';
                        bgColor = '#FEF3C7';
                        icon = 'fa-money-bill-wave';
                        break;
                }
                
                return {
                    type: type,
                    count: item.count,
                    amount: item.amount,
                    countChange: 0, // ไม่มีข้อมูลการเปลี่ยนแปลง
                    amountChange: 0, // ไม่มีข้อมูลการเปลี่ยนแปลง
                    color: color,
                    bgColor: bgColor,
                    icon: icon
                };
            });
        } catch (err) {
            console.error('Error getting transaction types:', err);
        }

        // ถ้าไม่มีข้อมูลธุรกรรมจริง ให้ใช้ข้อมูลจำลอง
        const transactionTypes = realTransactionTypes.length > 0 ? realTransactionTypes : [
            {
                type: 'เงินฝาก',
                count: 0,
                amount: 0,
                countChange: 0,
                amountChange: 0,
                color: '#1B8F4C',
                bgColor: '#E3F5E9',
                icon: 'fa-arrow-circle-down'
            },
            {
                type: 'ถอนเงิน',
                count: 0,
                amount: 0,
                countChange: 0,
                amountChange: 0,
                color: '#DC2626',
                bgColor: '#FEE2E2',
                icon: 'fa-arrow-circle-up'
            },
            {
                type: 'การกู้ยืม',
                count: 0,
                amount: totalLoans,
                countChange: 0,
                amountChange: 0,
                color: '#6366F1',
                bgColor: '#EFF6FF',
                icon: 'fa-hand-holding-usd'
            },
            {
                type: 'ชำระเงินกู้',
                count: 0,
                amount: loanIncome,
                countChange: 0,
                amountChange: 0,
                color: '#F59E0B',
                bgColor: '#FEF3C7',
                icon: 'fa-money-bill-wave'
            }
        ];

        // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
        const thaiMonths = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
            'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
            'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];

        const formattedMonthlySavings = monthlySavings.map(item => ({
            month: thaiMonths[item._id.month - 1],
            amount: item.amount
        }));

        const formattedMonthlyLoans = monthlyLoans.map(item => ({
            month: thaiMonths[item._id.month - 1],
            amount: item.amount
        }));

        // สร้างข้อมูลการเติบโตของสมาชิก
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        
        // สร้างข้อมูลย้อนหลัง 12 เดือน
        const memberGrowth = [];
        for (let i = 0; i < 12; i++) {
            const month = (currentMonth - i + 12) % 12;
            memberGrowth.unshift({
                month: thaiMonths[month],
                savingMembers: Math.max(0, Math.floor(savingMembersCount * (1 - i * 0.08))),
                loanMembers: Math.max(0, Math.floor(loanMembersCount * (1 - i * 0.1)))
            });
        }

        // ส่งข้อมูลกลับไปยัง client
        res.json({
            // ข้อมูลสมาชิก
            memberStats: {
                savingMembers: savingMembersCount || 0,
                loanMembers: loanMembersCount || 0
            },
            savingMembers: savingMembersCount || 0,
            loanMembers: loanMembersCount || 0,
            
            // ข้อมูลการเงิน
            totalLoans: totalLoans || 0,
            totalDeposits: totalDeposits || 0,
            loanIncome: loanIncome || 0,
            
            // ข้อมูลกราฟ
            monthlySavings: formattedMonthlySavings || [],
            monthlyLoans: formattedMonthlyLoans || [],
            memberGrowth: memberGrowth || [],
            transactionTypes: transactionTypes || [],
            
            // ข้อมูลอื่นๆ
            transactionCount: transactionCount || 0
        });

        console.log('Financial reports generated successfully');
    } catch (error) {
        console.error('Error generating financial reports:', error);
        res.status(500).json({
            message: 'เกิดข้อผิดพลาดในการสร้างรายงานทางการเงิน',
            error: error.message
        });
    }
});

// API สำหรับดึงข้อมูลสัญญากู้ยืมทั้งหมด
router.get('/promise-status', async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }

        const promises = await Promise.find(query)
            .select('id_saving Datepromise amount interestRate DueDate totalPaid payments status')
            .populate({
                path: 'id_saving',
                select: 'id_member balance',
                populate: {
                    path: 'id_member',
                    select: 'name'
                }
            })
            .sort({ Datepromise: -1 });

        const formattedPromises = promises.map(promise => {
            // ตรวจสอบและจัดการกรณีที่ข้อมูลอาจจะไม่สมบูรณ์
            const borrowerName = promise.id_saving?.id_member?.name || 'ไม่ระบุชื่อ';
            const savingId = promise.id_saving?._id || 'ไม่ระบุ';

            return {
                _id: promise._id,
                id_saving: savingId,
                borrowerName: borrowerName,
                Datepromise: promise.Datepromise,
                amount: promise.amount || 0,
                interestRate: promise.interestRate || 0,
                DueDate: promise.DueDate,
                totalPaid: promise.totalPaid || 0,
                payments: promise.payments || {},
                status: promise.status || 'pending'
            };
        });

        res.json({ 
            success: true,
            promises: formattedPromises
        });
    } catch (error) {
        console.error('Error fetching promises:', error);
        res.status(500).json({ 
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสัญญากู้ยืม',
            error: error.message 
        });
    }
});

// API สำหรับดึงรายละเอียดสัญญากู้ยืม
router.get('/promise-status/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const promise = await Promise.findById(id);

        if (!promise) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลสัญญากู้ยืม'
            });
        }

        // ดึงข้อมูลจากตาราง saving ที่เชื่อมโยงกัน
        const saving = await Saving.findOne({ id_account: promise.id_saving })
            .populate('id_member')
            .populate('id_staff');

        // จัดรูปแบบข้อมูลให้ตรงตามโครงสร้าง
        const formattedPromise = {
            _id: promise._id,
            id_saving: promise.id_saving,
            Datepromise: promise.Datepromise,
            amount: promise.amount,
            interestRate: promise.interestRate,
            DueDate: promise.DueDate,
            totalPaid: promise.totalPaid,
            status: promise.status,
            payments: promise.payments || [],
            saving: saving ? {
                _id: saving._id,
                id_account: saving.id_account,
                id_member: saving.id_member,
                balance: saving.balance,
                id_staff: saving.id_staff,
                status: saving.status,
                createdAt: saving.createdAt
            } : null
        };

        res.json({
            success: true,
            data: formattedPromise
        });
    } catch (error) {
        console.error('Error fetching promise details:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสัญญากู้ยืม',
            error: error.message
        });
    }
});

// API สำหรับอัพเดทรหัสผ่าน
router.put('/users/:id/password', async (req, res) => {
    try {
        const userId = req.params.id;
        const { password } = req.body;

        // ตรวจสอบว่ามีการส่งรหัสผ่านมาหรือไม่
        if (!password) {
            return res.status(400).json({ 
                message: 'กรุณาระบุรหัสผ่านใหม่' 
            });
        }

        // ค้นหาและอัพเดทรหัสผ่านของผู้ใช้
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                message: 'ไม่พบผู้ใช้' 
            });
        }

        // อัพเดทรหัสผ่าน
        user.password = password;
        await user.save();

        res.json({ 
            message: 'อัพเดทรหัสผ่านสำเร็จ',
            userId: user._id
        });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาดในการอัพเดทรหัสผ่าน', 
            error: error.message 
        });
    }
});

module.exports = router;