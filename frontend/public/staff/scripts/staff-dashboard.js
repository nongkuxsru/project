// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
window.onload = () => {
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

// ฟังก์ชันสำหรับดึงข้อมูลธุรกรรม
const fetchTransactions = async () => {
    try {
        const response = await fetch('/api/staff/transactions');
        if (!response.ok) {
            throw new Error(`Failed to fetch transactions. Status: ${response.status}`);
        }
        const data = await response.json();

        const tableBody = document.getElementById('transactionTableBody');
        tableBody.innerHTML = ''; 

        data.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction._id}</td>
                <td>${transaction.date}</td>
                <td>${transaction.user}</td>
                <td>${transaction.type}</td>
                <td>${transaction.amount}</td>
                <td>${transaction.status}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        alert('Error fetching transactions: ' + error.message); // แสดงข้อความแสดงข้อผิดพลาด
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

             // แสดงข้อความด้วย SweetAlert2
            await Swal.fire({
                icon: 'success',
                title: 'Logout successful!',
                text: 'You have been logged out. Redirecting to login page...',
                timer: 1000, // ตั้งเวลาแสดง 2 วินาที
                showConfirmButton: false,
            });

            window.location.href = "/";
        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Logout failed!',
                text: 'Please try again.',
            });
        }
    } catch (error) {
        console.error("Error during logout:", error);
        await Swal.fire({
            icon: 'error',
            title: 'An error occurred',
            text: 'There was an error while logging out.',
        });
    }
};

// เรียกใช้งานฟังก์ชันเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', fetchTransactions);
// เพิ่ม Event Listener สำหรับปุ่ม Toggle Sidebar
document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);


