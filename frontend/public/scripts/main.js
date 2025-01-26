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
        alert(result.message);

        // ตรวจสอบสิทธิ์และ redirect ไปยังหน้าที่เหมาะสม
        const { permission } = result.user;
        switch (permission) {
            case 'admin':
                window.location.href = '/admin-dashboard.html'; // หน้า Admin
                break;
            case 'staff':
                window.location.href = '/staff-dashboard.html'; // หน้า Staff
                break;
            default:
                window.location.href = '/user-dashboard.html'; // หน้า User
        }
    } else {
        alert(result.error);
    }
});