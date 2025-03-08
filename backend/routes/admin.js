const express = require('express');
const router = express.Router();
const User = require('../models/Users'); // นำเข้าโมเดล Users
const Saving = require('../models/Saving'); // นำเข้าโมเดลบัญชีการออม
const Promise = require('../models/Promise'); // นำเข้าโมเดล Promise
const Transaction = require('../models/Transaction'); // นำเข้าโมเดล Transaction


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

// API สำหรับตั้ง PIN สำหรับผู้ดูแล
router.put('/users/:userId/pin', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { pin } = req.body;

        // ตรวจสอบรูปแบบ PIN
        if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
            return res.status(400).json({ 
                message: 'PIN ไม่ถูกต้อง กรุณาระบุตัวเลข 4 หลัก' 
            });
        }

        // ค้นหาผู้ใช้และตรวจสอบว่าเป็นผู้ดูแลหรือไม่
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
        }

        if (user.permission !== 'admin') {
            return res.status(400).json({ 
                message: 'สามารถตั้ง PIN ได้เฉพาะผู้ดูแลระบบเท่านั้น' 
            });
        }

        // อัปเดต PIN
        user.pin = pin;
        await user.save();

        res.json({ message: 'ตั้ง PIN สำเร็จ' });
    } catch (error) {
        console.error('Error setting PIN:', error);
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาดในการตั้ง PIN', 
            error: error.message 
        });
    }
});

// API สำหรับตรวจสอบ PIN ของ admin
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

        // ค้นหา admin ที่มี PIN ตรงกับที่ส่งมา
        const admin = await User.findOne({ 
            permission: 'admin',
            pin: pin
        });

        if (!admin) {
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
            return res.status(400).json({ message: 'กรุณาระบุ ID ของผู้ดูแลระบบ' });
        }

        // ตรวจสอบว่าผู้ดูแลระบบมีอยู่จริงหรือไม่
        const admin = await User.findById(adminId);
        if (!admin || admin.permission !== 'admin') {
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
        if (!admin || admin.permission !== 'admin') {
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
        // 1. ดึงข้อมูลเงินฝากรายเดือน
        const monthlySavings = await Saving.aggregate([
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

        // 2. ดึงข้อมูลประเภทธุรกรรม
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);

        const lastMonthStart = new Date(currentMonthStart);
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

        const currentMonthSavings = await Saving.aggregate([
            {
                $match: {
                    createdAt: { $gte: currentMonthStart }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$balance" }
                }
            }
        ]);

        const lastMonthSavings = await Saving.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: lastMonthStart,
                        $lt: currentMonthStart
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$balance" }
                }
            }
        ]);

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

        // 3. คำนวณข้อมูลสรุปทางการเงิน
        const currentTotal = currentMonthSavings[0]?.total || 0;
        const lastTotal = lastMonthSavings[0]?.total || 0;
        const percentChange = lastTotal === 0 ? 100 : 
            ((currentTotal - lastTotal) / lastTotal) * 100;

        // 2. ดึงข้อมูลประเภทธุรกรรม
        const transactionTypes = await Transaction.aggregate([
            {
                $facet: {
                    // ธุรกรรมในเดือนนี้
                    currentMonth: [
                        {
                            $match: {
                                date: { $gte: currentMonthStart }
                            }
                        },
                        {
                            $group: {
                                _id: "$type",
                                count: { $sum: 1 },
                                total: { $sum: "$amount" }
                            }
                        }
                    ],
                    // ธุรกรรมในเดือนที่แล้ว
                    lastMonth: [
                        {
                            $match: {
                                date: {
                                    $gte: lastMonthStart,
                                    $lt: currentMonthStart
                                }
                            }
                        },
                        {
                            $group: {
                                _id: "$type",
                                count: { $sum: 1 },
                                total: { $sum: "$amount" }
                            }
                        }
                    ]
                }
            }
        ]);

        // แปลงชื่อประเภทธุรกรรมและคำนวณการเปลี่ยนแปลง
        const getTransactionInfo = (type) => {
            const types = {
                'deposit': {
                    name: 'เงินฝาก',
                    color: '#1B8F4C', // สีเขียว
                    bgColor: '#E3F5E9',
                    icon: 'fa-arrow-circle-down'
                },
                'withdraw': {
                    name: 'ถอนเงิน',
                    color: '#DC2626', // สีแดง
                    bgColor: '#FEE2E2',
                    icon: 'fa-arrow-circle-up'
                },
                'transfer': {
                    name: 'โอนเงิน',
                    color: '#2563EB', // สีน้ำเงิน
                    bgColor: '#EFF6FF',
                    icon: 'fa-exchange-alt'
                },
                'loan_payment': {
                    name: 'ชำระเงินกู้',
                    color: '#7C3AED', // สีม่วง
                    bgColor: '#F5F3FF',
                    icon: 'fa-hand-holding-usd'
                },
                'interest': {
                    name: 'ดอกเบี้ย',
                    color: '#F59E0B', // สีส้ม
                    bgColor: '#FEF3C7',
                    icon: 'fa-percentage'
                }
            };
            return types[type] || {
                name: type,
                color: '#6B7280', // สีเทาสำหรับประเภทที่ไม่ได้กำหนด
                bgColor: '#F3F4F6',
                icon: 'fa-circle'
            };
        };

        const currentMonthData = transactionTypes[0].currentMonth.reduce((acc, curr) => {
            acc[curr._id] = curr;
            return acc;
        }, {});

        const lastMonthData = transactionTypes[0].lastMonth.reduce((acc, curr) => {
            acc[curr._id] = curr;
            return acc;
        }, {});

        // รวมประเภทธุรกรรมทั้งหมดที่มี
        const allTypes = [...new Set([
            ...transactionTypes[0].currentMonth.map(t => t._id),
            ...transactionTypes[0].lastMonth.map(t => t._id)
        ])];

        const formattedTransactionTypes = allTypes.map(type => {
            const current = currentMonthData[type] || { count: 0, total: 0 };
            const last = lastMonthData[type] || { count: 0, total: 0 };
            const info = getTransactionInfo(type);
            
            // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
            const countChange = last.count === 0 ? 100 :
                ((current.count - last.count) / last.count) * 100;
            
            const amountChange = last.total === 0 ? 100 :
                ((current.total - last.total) / last.total) * 100;

            return {
                type: info.name,
                count: current.count,
                amount: current.total,
                countChange: parseFloat(countChange.toFixed(2)),
                amountChange: parseFloat(amountChange.toFixed(2)),
                color: info.color,
                bgColor: info.bgColor,
                icon: info.icon,
                chartColor: info.color // เพิ่มสีสำหรับกราฟ
            };
        });

        // จัดกลุ่มข้อมูลสำหรับกราฟวงกลม
        const chartData = {
            labels: formattedTransactionTypes.map(t => t.type),
            datasets: [{
                data: formattedTransactionTypes.map(t => t.count),
                backgroundColor: formattedTransactionTypes.map(t => t.color),
                borderColor: formattedTransactionTypes.map(t => t.color),
                borderWidth: 1
            }]
        };

        // เพิ่มข้อมูลธุรกรรมในส่วนสรุป
        const totalTransactions = formattedTransactionTypes.reduce((acc, curr) => acc + curr.count, 0);
        const totalAmount = formattedTransactionTypes.reduce((acc, curr) => acc + curr.amount, 0);
        
        // อัปเดต summary array
        const summary = [
            {
                name: 'เงินฝากรวมเดือนนี้',
                amount: currentTotal,
                change: parseFloat(percentChange.toFixed(2)),
                icon: 'fa-piggy-bank'
            },
            {
                name: 'มูลค่าธุรกรรมรวม',
                amount: totalAmount,
                change: formattedTransactionTypes.reduce((acc, curr) => acc + curr.amountChange, 0) / formattedTransactionTypes.length,
                icon: 'fa-money-bill-wave'
            },
            {
                name: 'จำนวนธุรกรรมทั้งหมด',
                amount: totalTransactions,
                change: formattedTransactionTypes.reduce((acc, curr) => acc + curr.countChange, 0) / formattedTransactionTypes.length,
                icon: 'fa-exchange-alt'
            }
        ];

        res.json({
            monthlySavings: formattedMonthlySavings,
            transactionTypes: formattedTransactionTypes,
            chartData, // ส่งข้อมูลกราฟแยกออกมา
            summary
        });

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
    

module.exports = router;