document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // ดึงค่าจากฟอร์ม
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // ส่งข้อมูลไปยัง Back-end
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const result = await response.json();
    if (response.ok) {
        // ใช้ SweetAlert2 แสดงข้อความสำเร็จ
        await Swal.fire({
            icon: 'success',
            title: 'Login Successful!',
            text: result.message,
            timer: 2000, // ตั้งเวลาแสดง 2 วินาที
            showConfirmButton: false,  // ไม่แสดงปุ่ม "OK"
        });

        // ✅ บันทึกข้อมูลผู้ใช้ลง localStorage
        localStorage.setItem('currentUser', JSON.stringify(result.user));

        // ตรวจสอบสิทธิ์และ redirect ไปยังหน้าที่เหมาะสม
        const { permission } = result.user;
        if (permission === 'admin') {
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            window.location.href = '/admin'; // หน้า Admin
        } else if (permission === 'staff') {
            window.location.href = '/staff'; // หน้า Staff
        } else if (permission === 'director') {
            window.location.href = '/director';
        } else {
            window.location.href = '/member'; // เปลี่ยนจาก /user เป็น /member
        }
    } else {
        // ใช้ SweetAlert2 แสดงข้อความข้อผิดพลาด
        await Swal.fire({
            icon: 'error',
            title: 'Login Failed!',
            text: result.error,
        });
    }
});