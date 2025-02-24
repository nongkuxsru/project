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

// ฟังก์ชันสำหรับดึงข้อมูลบัญชีสัญญากู้ยืม
const fetchPromise = async () => {
    try {
        const response = await fetch('/api/staff/promise'); // เรียก API เพื่อดึงข้อมูลบัญชีสัญญากู้ยืม
        const data = await response.json();

        console.log(data); // ดูข้อมูลที่ได้รับจาก API

        // อัปเดตข้อมูลบัญชีในหน้าเว็บ
        const tableBody = document.getElementById('promiseTableBody');
        tableBody.innerHTML = ''; // ล้างข้อมูลเก่าทิ้ง

        // ตรวจสอบว่ามีข้อมูลบัญชีหรือไม่
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">No loan promises available.</td></tr>';
        } else {
            // ทำการแสดงข้อมูลบัญชีในตาราง
            data.forEach(account => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${account._id}</td> <!-- แสดง Account ID -->
                    <td>${account.id_saving}</td> <!-- แสดง Member ID -->
                    <td>${account.amount}</td> <!-- แสดงจำนวนเงินกู้ยืม -->
                    <td>${account.id_saving}</td> <!-- แสดง Staff ID หรืออ้างอิงบัญชีออม -->
                    <td>${new Date(account.Datepromise).toLocaleDateString()}</td> <!-- แสดงวันที่ Promise -->
                    <td>${new Date(account.DueDate).toLocaleDateString()}</td> <!-- แสดง Due Date -->
                    <td><button class="viewDetailsButton"><i class="fas fa-eye"></i> View Details</button></td>
                `;
                tableBody.appendChild(row);
            });
            
            
        }
    } catch (error) {
        console.error('Error fetching loan promise data:', error);
        const tableBody = document.getElementById('promiseTableBody');
        tableBody.innerHTML = '<tr><td colspan="7">Failed to load data.</td></tr>';
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

// เรียกใช้ฟังก์ชันเพื่อดึงข้อมูลเมื่อโหลดหน้าเสร็จ
document.addEventListener('DOMContentLoaded', fetchPromise);

// เพิ่ม Event Listener สำหรับปุ่ม Toggle Sidebar
document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
