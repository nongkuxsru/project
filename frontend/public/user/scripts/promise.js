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

const fetchPromiseAccount = async () => {
    const userId = getUserIdFromLocalStorage();
    if (!userId) {
        document.getElementById('promiseAccountContainer').innerHTML = '<p class="error">User not found. Please login again.</p>';
        return;
    }

    try {
        const response = await fetch(`/api/staff/promise/${userId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch promise account data with status: ${response.status}`);
        }

        const promiseData = await response.json();

        if (promiseData && promiseData.amount != null && promiseData.Datepromise && promiseData.DueDate) {
            // อัปเดตข้อมูลบัญชีเงินกู้ยืมใน UI
            document.getElementById('promiseBalance').textContent = promiseData.amount.toFixed(2) || 'N/A';
            document.getElementById('promiseCreatedAt').textContent = new Date(promiseData.Datepromise).toLocaleDateString() || 'N/A';
            document.getElementById('promiseDueDate').textContent = new Date(promiseData.DueDate).toLocaleDateString() || 'N/A';
        } else {
            console.error('Promise data is incomplete');
            document.getElementById('promiseAccountContainer').innerHTML = '<p class="error">Promise account data is incomplete.</p>';
        }
    } catch (error) {
        document.getElementById('promiseAccountContainer').innerHTML = '<p class="error">Failed to load promise account data.</p>';
    }
};

document.addEventListener("DOMContentLoaded", function() {
    // ดึงข้อมูลผู้ใช้จาก localStorage
    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (user) {
        // หากข้อมูลผู้ใช้มีการล็อกอินมาแล้ว
        const userName = user.name || 'ผู้ใช้ไม่ระบุ';
        const userAvatar = user.avatar || userName.charAt(0).toUpperCase(); // ใช้อักษรตัวแรกจากชื่อผู้ใช้เป็นอวาตาร์
       
        // แสดงชื่อผู้ใช้
        document.getElementById('userName').textContent = 'ยินดีต้อนรับ ' + userName;
        
        // แสดงอวาตาร์
        document.getElementById('userAvatar').textContent = userAvatar;
    } else {
        // หากไม่มีข้อมูลผู้ใช้ใน localStorage
        document.getElementById('userName').textContent = 'ไม่พบข้อมูลผู้ใช้';
        document.getElementById('userAvatar').textContent = 'N/A';
    }
});

// ฟังก์ชันสำหรับ Logout
const logout = async () => {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            // ลบข้อมูลจาก LocalStorage
            localStorage.removeItem("currentUser");
            localStorage.removeItem("selectedTheme");

            alert("Logout successful! Redirecting to login page...");
            window.location.href = "/";
        } else {
            alert("Logout failed. Please try again.");
        }
    } catch (error) {
        console.error("Error during logout:", error);
        alert("An error occurred while logging out.");
    }
};
// เมื่อ DOM ถูกโหลดแล้ว เรียกใช้ฟังก์ชัน
document.addEventListener('DOMContentLoaded', fetchPromiseAccount);

// ฟังก์ชันเรียกใช้เมื่อต้องการโหลดข้อมูลบัญชี
document.addEventListener('DOMContentLoaded', () => {
    fetchPromiseAccount();
});

// เพิ่ม Event Listener สำหรับปุ่ม Logout
document.getElementById('logoutButton').addEventListener('click', logout);

// เพิ่ม Event Listener สำหรับปุ่ม Toggle Sidebar
document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
