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
    fetchUserInfo(); // ดึงข้อมูลผู้ใช้

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

if (window.location.pathname === '/staff/') {
    // ฟังก์ชันที่เกี่ยวข้องกับการดึงข้อมูลธุรกรรม
    fetchTransactions();
}


const fetchAccount = async () => {
    try {
        const response = await fetch('/api/staff/users'); // เรียก API เพื่อดึงข้อมูลบัญชี
        const data = await response.json();

        console.log(data); // ดูข้อมูลที่ได้รับจาก API

        // อัปเดตข้อมูลบัญชีในหน้าเว็บ
        const tableBody = document.getElementById('accountTableBody');
        tableBody.innerHTML = ''; // ล้างข้อมูลเก่าทิ้ง

        // ตรวจสอบว่ามีข้อมูลบัญชีหรือไม่
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No accounts available.</td></tr>';
        } else {
            // ทำการแสดงข้อมูลบัญชีในตาราง
            data.forEach(account => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${account._id}</td>
                    <td>${account.id_member}</td>
                    <td>${account.balance}</td>
                    <td>${account.id_staff}</td>
                    <td>${new Date(account.createdAt).toLocaleDateString()}</td> <!-- แปลงวันที่เป็นรูปแบบที่อ่านง่าย -->
                    <td><button class="edit-btn" ><i class="fas fa-edit"></i></button></td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error fetching account data:', error);
        const tableBody = document.getElementById('accountTableBody');
        tableBody.innerHTML = '<tr><td colspan="6">Failed to load data.</td></tr>';
    }
};

// ฟังก์ชันสำหรับเปิด modal และเพิ่มผู้ใช้
const openAddUserModal = () => {
    const modal = document.getElementById('addUserModal');
    const form = document.getElementById('addUserForm');

    // แสดง modal
    modal.style.display = 'block';

    // ปิด modal เมื่อคลิกปุ่ม close (×)
    document.querySelector('#addUserModal .close').onclick = () => {
        modal.style.display = 'none';
    };

    // ปิด modal เมื่อคลิกนอก modal
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    // จัดการการส่งฟอร์ม
    form.onsubmit = async (e) => {
        e.preventDefault();

        const newUser = {
            name: document.getElementById('addName').value,
            email: document.getElementById('addEmail').value,
            balance: document.getElementById('addBalance').value,
            staffId: document.getElementById('addStaffId').value,
        };

        try {
            const response = await fetch('/api/staff/account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to add user');
            }

            // รีเฟรชข้อมูลบัญชีทั้งหมด
            await fetchAccount();
            modal.style.display = 'none'; // ปิด modal
            alert('User added successfully');
        } catch (error) {
            console.error('Error adding user:', error);
            alert(error.message || 'Failed to add user. Please try again.');
        }
    };
};

document.getElementById('addUserButton').addEventListener('click', openAddUserModal);

// เรียกใช้ฟังก์ชันเพื่อดึงข้อมูลเมื่อโหลดหน้าเสร็จ
document.addEventListener('DOMContentLoaded', fetchAccount);


// เรียกใช้งานฟังก์ชันเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', fetchTransactions);


// เพิ่ม Event Listener สำหรับปุ่ม Toggle Sidebar
document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);

