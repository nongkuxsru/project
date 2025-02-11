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

document.addEventListener("DOMContentLoaded", function() {
    const storedUserName = localStorage.getItem('currentUser');
    const localStorageId = JSON.parse(storedUserName)._id;

    // ดึงข้อมูลประวัติการทำรายการจาก API
    fetch('/api/staff/transactions')
        .then(response => response.json())
        .then(data => {
            const filteredTransactions = data.filter(transaction => String(transaction.user) === localStorageId);
                populateTransactionTable(filteredTransactions);
            })
        .catch(error => {
            console.error("Error fetching transactions:", error);
        });
});

// ฟังก์ชั่นในการแสดงข้อมูลในตาราง
function populateTransactionTable(transactions) {
    const tableBody = document.querySelector("#transactionTable tbody");
    tableBody.innerHTML = ""; // ล้างข้อมูลเดิม

    transactions.forEach(transaction => {
        const row = document.createElement("tr");

        const dateCell = document.createElement("td");
        dateCell.classList.add("px-4", "py-2", "text-sm", "text-gray-700", "border-b", "border-green-200");
        dateCell.textContent = transaction.date;

        const typeCell = document.createElement("td");
        typeCell.classList.add("px-4", "py-2", "text-sm", "text-gray-700", "border-b", "border-green-200");
        typeCell.textContent = transaction.type;

        const amountCell = document.createElement("td");
        amountCell.classList.add("px-4", "py-2", "text-sm", "text-gray-700", "border-b", "border-green-200");
        amountCell.textContent = `${transaction.amount} บาท`;

        const statusCell = document.createElement("td");
        statusCell.classList.add("px-4", "py-2", "text-sm", "text-gray-700", "border-b", "border-green-200");
        statusCell.textContent = transaction.status;

        row.appendChild(dateCell);
        row.appendChild(typeCell);
        row.appendChild(amountCell);
        row.appendChild(statusCell);

        tableBody.appendChild(row);
    });
}

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

// ฟังก์ชันเรียกใช้เมื่อต้องการโหลดข้อมูลบัญชี
document.addEventListener('DOMContentLoaded', () => {
    fetchUserAccount();
});

// เพิ่ม Event Listener สำหรับปุ่ม Logout
document.getElementById('logoutButton').addEventListener('click', logout);

// เพิ่ม Event Listener สำหรับปุ่ม Toggle Sidebar
document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
