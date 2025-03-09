const express = require('express');
const router = express.Router();
const User = require('../models/Users'); // นำเข้าโมเดล Users
const Saving = require('../models/Saving'); // นำเข้าโมเดลบัญชีการออม
const Promise = require('../models/Promise'); // นำเข้าโมเดล Promise
const Transaction = require('../models/Transaction'); // นำเข้าโมเดล Transaction
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


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

// API สำหรับตั้ง PIN สำหรับผู้อำนวยการ
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

        // ค้นหาผู้ใช้และตรวจสอบว่าเป็นผู้อำนวยการหรือไม่
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
        }

        if (user.permission !== 'director') {
            return res.status(400).json({ 
                message: 'สามารถตั้ง PIN ได้เฉพาะผู้อำนวยการเท่านั้น' 
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

// API สำหรับตรวจสอบ PIN ของผู้อำนวยการ
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

        // ค้นหาผู้อำนวยการที่มี PIN ตรงกับที่ส่งมา
        const director = await User.findOne({ 
            permission: 'director',
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
        const { directorId } = req.body;

        // ตรวจสอบว่ามี directorId หรือไม่
        if (!directorId) {
            return res.status(400).json({ message: 'กรุณาระบุ ID ของผู้อำนวยการ' });
        }

        // ตรวจสอบว่าผู้อำนวยการมีอยู่จริงหรือไม่
        const director = await User.findById(directorId);
        if (!director || director.permission !== 'director') {
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
        promise.approvedBy = directorId;
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
        const { directorId, reason } = req.body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!directorId) {
            return res.status(400).json({ message: 'กรุณาระบุ ID ของผู้อำนวยการ' });
        }
        if (!reason) {
            return res.status(400).json({ message: 'กรุณาระบุเหตุผลในการปฏิเสธ' });
        }

        // ตรวจสอบว่าผู้อำนวยการมีอยู่จริงหรือไม่
        const director = await User.findById(directorId);
        if (!director || director.permission !== 'director') {
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
        promise.rejectedBy = directorId;
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

// API สำหรับรายงานทางการเงิน
router.get('/financial-reports', async (req, res) => {
    try {
        // ดึงข้อมูลทั้งหมด
        const transactions = await Transaction.aggregate([
            {
                $group: {
                    _id: {
                        type: '$type',
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' }
                }
            }
        ]);

        // คำนวณข้อมูลสรุป
        const summary = calculateSummary(transactions);
        
        // จัดเตรียมข้อมูลกราฟ
        const monthlySavings = prepareMonthlySavingsData(transactions);
        const transactionTypes = prepareTransactionTypesData(transactions);

        res.json({
            summary,
            monthlySavings,
            transactionTypes
        });

    } catch (error) {
        console.error('Error fetching total financial reports:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงานรวม' });
    }
});

/**
 * @route GET /api/admin/financial-reports/:period/:year/:month?
 * @desc ดึงข้อมูลรายงานทางการเงินตามช่วงเวลา
 * @access Private (Admin only)
 */
router.get('/financial-reports/:period/:year/:month?', async (req, res) => {
    try {
        const { period, year } = req.params;
        const month = req.params.month ? parseInt(req.params.month) : null;
        
        // ตรวจสอบความถูกต้องของข้อมูล
        if (!['monthly', 'yearly'].includes(period)) {
            return res.status(400).json({ message: 'รูปแบบช่วงเวลาไม่ถูกต้อง' });
        }

        const currentYear = new Date().getFullYear();
        if (year < currentYear - 5 || year > currentYear) {
            return res.status(400).json({ message: 'ปีที่ระบุไม่อยู่ในช่วงที่กำหนด' });
        }

        if (month && (month < 1 || month > 12)) {
            return res.status(400).json({ message: 'เดือนที่ระบุไม่ถูกต้อง' });
        }

        // สร้าง query conditions
        let matchConditions = {
            createdAt: {
                $gte: new Date(year, period === 'monthly' && month ? month - 1 : 0, 1),
                $lt: new Date(year, period === 'monthly' && month ? month : 12, 31)
            }
        };

        // ดึงข้อมูลธุรกรรมจาก MongoDB
        const transactions = await Transaction.aggregate([
            { $match: matchConditions },
            {
                $group: {
                    _id: {
                        type: '$type',
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' }
                }
            }
        ]);

        // คำนวณข้อมูลสรุป
        const summary = calculateSummary(transactions);
        
        // จัดเตรียมข้อมูลกราฟ
        const monthlySavings = prepareMonthlySavingsData(transactions);
        const transactionTypes = prepareTransactionTypesData(transactions);

        res.json({
            summary,
            monthlySavings,
            transactionTypes
        });

    } catch (error) {
        console.error('Error fetching financial reports:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน' });
    }
});

/**
 * @route GET /api/admin/reports/export/pdf/:period/:year/:month?
 * @desc ส่งออกรายงานในรูปแบบ PDF
 * @access Private (Admin only)
 */
router.get('/reports/export/pdf/:period/:year/:month?', async (req, res) => {
    try {
        const { period, year } = req.params;
        const month = req.params.month ? parseInt(req.params.month) : null;

        // ดึงข้อมูลรายงาน
        const reportData = await generateReportData(period, year, month);

        // สร้าง PDF ด้วย PDFKit
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: `รายงานการเงิน ${period === 'monthly' ? 'รายเดือน' : 'รายปี'}`,
                Author: 'สหกรณ์ออมทรัพย์'
            }
        });

        // ตั้งค่าการตอบกลับ
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=financial_report_${period}_${year}${month ? '_' + month : ''}.pdf`);

        // Pipe PDF ไปยัง response
        doc.pipe(res);

        // สร้าง PDF content
        await generatePDFContent(doc, reportData);

        // จบการสร้าง PDF
        doc.end();

    } catch (error) {
        console.error('Error exporting PDF:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งออกไฟล์ PDF' });
    }
});

/**
 * @route GET /api/admin/reports/export/excel/:period/:year/:month?
 * @desc ส่งออกรายงานในรูปแบบ Excel
 * @access Private (Admin only)
 */
router.get('/reports/export/excel/:period/:year/:month?', async (req, res) => {
    try {
        const { period, year } = req.params;
        const month = req.params.month ? parseInt(req.params.month) : null;

        // ดึงข้อมูลรายงาน
        const reportData = await generateReportData(period, year, month);

        // สร้าง workbook และ worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('รายงานการเงิน');

        // จัดรูปแบบ worksheet
        await formatExcelWorksheet(worksheet, reportData);

        // ตั้งค่าการตอบกลับ
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=financial_report_${period}_${year}${month ? '_' + month : ''}.xlsx`);

        // ส่ง workbook
        await workbook.xlsx.write(res);

    } catch (error) {
        console.error('Error exporting Excel:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel' });
    }
});



// ฟังก์ชันช่วยเหลือ
const calculateSummary = (transactions) => {
    try {
        const summary = {
            totalTransactions: 0,
            totalAmount: 0,
            averageAmount: 0,
            growthRate: 0
        };

        if (!Array.isArray(transactions) || transactions.length === 0) {
            return summary;
        }

        // คำนวณข้อมูลสรุป
        transactions.forEach(t => {
            summary.totalTransactions += t.count || 0;
            summary.totalAmount += t.amount || 0;
        });

        summary.averageAmount = summary.totalTransactions > 0 ? 
            summary.totalAmount / summary.totalTransactions : 0;

        // คำนวณอัตราการเติบโต
        const sortedTransactions = transactions
            .sort((a, b) => {
                const dateA = new Date(a._id.year, a._id.month - 1);
                const dateB = new Date(b._id.year, b._id.month - 1);
                return dateA - dateB;
            });

        if (sortedTransactions.length >= 2) {
            const lastMonth = sortedTransactions[sortedTransactions.length - 1];
            const previousMonth = sortedTransactions[sortedTransactions.length - 2];
            if (previousMonth.amount !== 0) {
                summary.growthRate = ((lastMonth.amount - previousMonth.amount) / previousMonth.amount) * 100;
            }
        }

        return summary;
    } catch (error) {
        console.error('Error calculating summary:', error);
        return {
            totalTransactions: 0,
            totalAmount: 0,
            averageAmount: 0,
            growthRate: 0
        };
    }
};

const prepareMonthlySavingsData = (transactions) => {
    try {
        if (!Array.isArray(transactions)) {
            return [];
        }

        // จัดกลุ่มข้อมูลตามเดือนและปี
        const monthlyData = transactions.reduce((acc, t) => {
            if (t._id.type === 'deposit') {
                const key = `${t._id.year}-${t._id.month}`;
                acc[key] = (acc[key] || 0) + (t.amount || 0);
            }
            return acc;
        }, {});

        // เรียงข้อมูลตามวันที่
        const sortedData = Object.entries(monthlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-12); // แสดงเฉพาะ 12 เดือนล่าสุด

        return sortedData.map(([date, amount]) => {
            const [year, month] = date.split('-');
            return {
                month: new Date(year, month - 1, 1).toLocaleString('th-TH', { month: 'long', year: 'numeric' }),
                amount: amount || 0
            };
        });
    } catch (error) {
        console.error('Error preparing monthly savings data:', error);
        return [];
    }
};

const prepareTransactionTypesData = (transactions) => {
    try {
        if (!Array.isArray(transactions)) {
            return [];
        }

        // จัดกลุ่มข้อมูลตามประเภทธุรกรรม
        const typeData = transactions.reduce((acc, t) => {
            const type = t._id.type;
            if (!acc[type]) {
                acc[type] = { count: 0, amount: 0 };
            }
            acc[type].count += t.count || 0;
            acc[type].amount += t.amount || 0;
            return acc;
        }, {});

        const getTransactionInfo = (type) => {
            const types = {
                'deposit': {
                    name: 'เงินฝาก',
                    color: '#1B8F4C',
                    bgColor: '#E3F5E9',
                    icon: 'fa-arrow-circle-down'
                },
                'withdraw': {
                    name: 'ถอนเงิน',
                    color: '#DC2626',
                    bgColor: '#FEE2E2',
                    icon: 'fa-arrow-circle-up'
                },
                'transfer': {
                    name: 'โอนเงิน',
                    color: '#2563EB',
                    bgColor: '#EFF6FF',
                    icon: 'fa-exchange-alt'
                },
                'loan_payment': {
                    name: 'ชำระเงินกู้',
                    color: '#7C3AED',
                    bgColor: '#F5F3FF',
                    icon: 'fa-hand-holding-usd'
                },
                'interest': {
                    name: 'ดอกเบี้ย',
                    color: '#F59E0B',
                    bgColor: '#FEF3C7',
                    icon: 'fa-percentage'
                }
            };
            return types[type] || {
                name: type,
                color: '#6B7280',
                bgColor: '#F3F4F6',
                icon: 'fa-circle'
            };
        };

        return Object.entries(typeData).map(([type, data]) => {
            const info = getTransactionInfo(type);
            return {
                type: info.name,
                count: data.count,
                amount: data.amount,
                color: info.color,
                bgColor: info.bgColor,
                icon: info.icon
            };
        });
    } catch (error) {
        console.error('Error preparing transaction types data:', error);
        return [];
    }
};

const generateReportData = async (period, year, month) => {
    // ดึงข้อมูลจาก MongoDB และจัดรูปแบบสำหรับรายงาน
    // Implementation here...
    return {};
};

const generatePDFContent = async (doc, data) => {
    // สร้างเนื้อหา PDF
    // Implementation here...
};

const formatExcelWorksheet = async (worksheet, data) => {
    // จัดรูปแบบ Excel worksheet
    // Implementation here...
};

module.exports = router;