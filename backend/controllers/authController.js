const User = require('../models/Users');

// ฟังก์ชันสำหรับตรวจสอบการเข้าสู่ระบบ
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ค้นหาผู้ใช้จาก email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found!' });
        }

        // ตรวจสอบรหัสผ่าน (ตัวอย่างง่ายๆ ไม่แนะนำให้ใช้ใน production)
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid password!' });
        }

        // ส่งข้อมูลผู้ใช้กลับไปยัง Front-end พร้อมสิทธิ์
        res.status(200).json({ 
            message: 'Login successful!', 
            user: {
                //ดึงข้อมูลทั้งหมดของผู้ใช้
                _id: user._id,
                name: user.name,
                email: user.email,
                password: user.password,
                address: user.address,
                phone: user.phone,
                birthday: user.birthday,
                permission: user.permission,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in!', details: error.message });
    }
};

module.exports = {
    loginUser, // ส่งออกฟังก์ชัน
};