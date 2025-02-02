// ฟังก์ชันสำหรับ Logout
const logout = async () => {
    try {
        // ✅ เรียก API logout ไปที่ backend
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            // ✅ ลบข้อมูล LocalStorage
            localStorage.removeItem("currentUser");
            localStorage.removeItem("selectedTheme");

            alert("Logout successful! Redirecting to login page...");
            window.location.href = "/"; // ✅ เปลี่ยนเส้นทางไปหน้า Login
        } else {
            alert("Logout failed. Please try again.");
        }
    } catch (error) {
        console.error("Error during logout:", error);
        alert("An error occurred while logging out.");
    }
};

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

// เรียกใช้งานฟังก์ชันเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', fetchTransactions);
// เพิ่ม Event Listener สำหรับปุ่ม Toggle Sidebar
document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);


