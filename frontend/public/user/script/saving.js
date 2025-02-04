const getUserIdFromLocalStorage = () => {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        console.error('User data not found in localStorage.');
        return null;
    }

    try {
        const user = JSON.parse(userData);
        return user?._id || null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};

// ฟังก์ชันดึงข้อมูลบัญชีเฉพาะของผู้ใช้ที่ล็อกอิน
const fetchUserAccount = async () => {
    const userId = getUserIdFromLocalStorage();
    if (!userId) {
        document.getElementById('accountContainer').innerHTML = '<p class="error">User not found. Please login again.</p>';
        return;
    }

    try {
        const response = await fetch(`/api/staff/saving/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch account data');

        const account = await response.json();
        console.log(account); // ดูข้อมูลที่ได้จาก API

        if (account && account.balance != null && account.createdAt) {
            // อัปเดตข้อมูลบัญชีใน UI
            document.getElementById('accountBalance').textContent = account.balance.toFixed(2);
            document.getElementById('accountCreatedAt').textContent = new Date(account.createdAt).toLocaleDateString();
            document.getElementById('accountStaffName').textContent = await fetchUserName(account.id_staff);
        } else {
            document.getElementById('accountContainer').innerHTML = '<p class="error">Account data is incomplete.</p>';
        }
    } catch (error) {
        console.error('Error fetching user account:', error);
        document.getElementById('accountContainer').innerHTML = '<p class="error">Failed to load account data.</p>';
    }
};

// ฟังก์ชันสำหรับ Logout
const logout = async () => {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            localStorage.removeItem("currentUser");
            localStorage.removeItem("selectedTheme");

            alert("Logout successful! Redirecting to login page...");
            window.location.href = "/"; // เปลี่ยนเส้นทางไปหน้า Login
        } else {
            alert("Logout failed. Please try again.");
        }
    } catch (error) {
        console.error("Error during logout:", error);
        alert("An error occurred while logging out.");
    }
};

// ฟังก์ชันสำหรับ Toggle Sidebar
const toggleSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('collapsed');
};

// ฟังก์ชันดึงชื่อผู้ใช้จาก API
const fetchUserName = async (userId) => {
    try {
        const response = await fetch(`/api/admin/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user data');
        const userData = await response.json();
        return userData.name || 'Unknown';
    } catch (error) {
        console.error('Error fetching user name:', error);
        return 'Unknown';
    }
};

// ฟังก์ชันเรียกใช้เมื่อต้องการโหลดข้อมูลบัญชี
document.addEventListener('DOMContentLoaded', () => {
    fetchUserAccount();
});

// เพิ่ม Event Listener สำหรับปุ่ม Logout
document.getElementById('logoutButton').addEventListener('click', logout);

// เพิ่ม Event Listener สำหรับปุ่ม Toggle Sidebar
document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
