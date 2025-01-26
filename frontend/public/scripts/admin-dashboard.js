// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้
const fetchUserInfo = async () => {
    try {
        const response = await fetch('/api/admin/users'); // เรียก API เพื่อดึงข้อมูลผู้ใช้
        const data = await response.json();

        // อัปเดตข้อมูลผู้ใช้ในหน้าเว็บ
        document.getElementById('userName').textContent = data.name;
        document.getElementById('userEmail').textContent = data.email;
        document.getElementById('userPermission').textContent = data.permission;
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
};

// ฟังก์ชันสำหรับดึงข้อมูลสถิติ
const fetchStats = async () => {
    try {
        const response = await fetch('/api/admin/stats'); // เรียก API เพื่อดึงข้อมูลสถิติ
        const data = await response.json();

        // อัปเดตข้อมูลสถิติในหน้าเว็บ
        document.getElementById('totalUsers').textContent = data.totalUsers;
        document.getElementById('activeUsers').textContent = data.activeUsers;
        document.getElementById('totalSavings').textContent = data.totalSavings;
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
};

// ฟังก์ชันสำหรับ Logout
const logout = async () => {
    try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (response.ok) {
            window.location.href = '/'; // Redirect ไปยังหน้า Login หลังจาก Logout สำเร็จ
        } else {
            alert('Logout failed. Please try again.');
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
};

// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
window.onload = () => {
    fetchUserInfo(); // ดึงข้อมูลผู้ใช้
    fetchStats(); // ดึงข้อมูลสถิติ

    // เพิ่ม Event Listener สำหรับปุ่ม Logout
    document.getElementById('logoutButton').addEventListener('click', logout);
};

// ฟังก์ชันสำหรับ Toggle Sidebar
const toggleSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('collapsed');
};

// เพิ่ม Event Listener สำหรับปุ่ม Toggle Sidebar
document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);