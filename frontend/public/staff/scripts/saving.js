const getStaffIdFromLocalStorage = () => {
    const staffData = localStorage.getItem('currentUser');
    if (!staffData) {
        console.error('Staff data not found in localStorage. Make sure to set it correctly.');
        return null;
    }
    
    try {
        const staff = JSON.parse(staffData);
        if (staff && staff._id) {
            return staff._id;
        } else {
            console.error('Staff ID not found in stored data');
            return null;
        }
    } catch (error) {
        console.error('Error parsing staff data from localStorage:', error);
        return null;
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

const fetchAccount = async () => {
    try {
        const response = await fetch('/api/staff/saving'); // เรียก API เพื่อดึงข้อมูลบัญชี
        const data = await response.json();


        // อัปเดตข้อมูลบัญชีในหน้าเว็บ
        const tableBody = document.getElementById('accountTableBody');
        tableBody.innerHTML = ''; // ล้างข้อมูลเก่าทิ้ง

        // ตรวจสอบว่ามีข้อมูลบัญชีหรือไม่
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No accounts available.</td></tr>';
        } else {
            // ทำการแสดงข้อมูลบัญชีในตาราง
            for (const account of data) {
                const userName = await fetchUserName(account.id_member); // ดึงชื่อผู้ใช้
                const staffName = await fetchUserName(account.id_staff); // ดึงชื่อผู้ใช้
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${account._id}</td>
                    <td>${userName}</td> <!-- แสดงชื่อผู้ใช้แทน id_member -->
                    <td>${account.balance}</td>
                    <td>${staffName}</td>
                    <td>${new Date(account.createdAt).toLocaleDateString()}</td> <!-- แปลงวันที่เป็นรูปแบบที่อ่านง่าย -->
                    <td><button class="edit-btn"><i class="fas fa-edit"></i></button></td>
                `;
                tableBody.appendChild(row);
            }
        }
    } catch (error) {
        console.error('Error fetching account data:', error);
        const tableBody = document.getElementById('accountTableBody');
        tableBody.innerHTML = '<tr><td colspan="6">Failed to load data.</td></tr>';
    }
};

const fetchUserName = async (userId) => {
    try {
        const response = await fetch(`/api/admin/users/${userId}`); // เรียก API เพื่อดึงข้อมูลผู้ใช้
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        const userData = await response.json();
        return userData.name; // ส่งกลับชื่อผู้ใช้
    } catch (error) {
        console.error('Error fetching user data:', error);
        return 'Unknown'; // หากเกิดข้อผิดพลาด ให้ส่งกลับค่า 'Unknown'
    }
};

const fetchStaffName = async (userId) => {
    try {
        const response = await fetch(`/api/admin/users/${userId}`); // เรียก API เพื่อดึงข้อมูลผู้ใช้
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        const userData = await response.json();
        return userData.name; // ส่งกลับชื่อผู้ใช้
    } catch (error) {
        console.error('Error fetching user data:', error);
        return 'Unknown'; // หากเกิดข้อผิดพลาด ให้ส่งกลับค่า 'Unknown'
    }
};

const openAddUserModal = () => {
    const modal = document.getElementById('addUserModal');
    const form = document.getElementById('addUserForm');
    const nameSelect = document.getElementById('addName');
    const selectedUserIdInput = document.getElementById('selectedUserId');

    modal.style.display = 'block';  // แสดง modal

    // เติมค่า Staff ID ลงในฟอร์มโดยอัตโนมัติ
    const staffId = getStaffIdFromLocalStorage();
    if (staffId) document.getElementById('addStaffId').value = staffId;

    // ดึงรายชื่อจาก API
    const fetchNames = async () => {
        try {
            const response = await fetch('/api/admin/users');
            const users = await response.json();

            if (response.ok && Array.isArray(users)) {
                nameSelect.innerHTML = '';  // ลบ option เก่าทั้งหมด
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user._id;
                    option.textContent = user.name;
                    nameSelect.appendChild(option);
                });
            } else {
                console.error('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching user names:', error);
        }
    };
    fetchNames();

    // เมื่อเลือกชื่อผู้ใช้
    nameSelect.addEventListener('change', (event) => {
        selectedUserIdInput.value = event.target.value;
    });
    
    nameSelect.addEventListener('click', (event) => {
        selectedUserIdInput.value = event.target.value;
    });

    // ปิด modal เมื่อคลิกปุ่ม close หรือคลิกนอก modal
    document.querySelector('#addUserModal .close').onclick = () => modal.style.display = 'none';
    window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };

    // ฟังก์ชันสำหรับการล้างฟอร์ม
    const resetForm = () => {
        form.reset();  // ล้างค่าฟอร์ม
        selectedUserIdInput.value = '';  // ล้างค่า userId
    };

     // ฟังก์ชันตรวจสอบข้อมูลซ้ำ
     const checkDuplicateUser = async (id_member) => {
        try {
            const response = await fetch(`/api/staff/saving/check/${id_member}`);
            const result = await response.json();

            if (response.ok && result.exists) {
                return true;  // ถ้ามีผู้ใช้นั้นอยู่แล้ว
            }
            return false;  // ถ้าไม่มีผู้ใช้นั้น
        } catch (error) {
            console.error('Error checking for duplicate user:', error);
            return false;
        }
    };

    // ส่งฟอร์ม
    form.onsubmit = async (e) => {
        e.preventDefault();

        const id_member = selectedUserIdInput.value;
        const balance = document.getElementById('addBalance').value;
        const id_staff = document.getElementById('addStaffId').value;

        if (!id_member) {
            alert('Please select a valid name.');
            return;
        }

        // ตรวจสอบข้อมูลซ้ำ
        const isDuplicate = await checkDuplicateUser(id_member);
        if (isDuplicate) {
            alert('This user already exists in the system.');
            return;
        }

        const newUser = { id_member, balance, id_staff };

        try {
            const response = await fetch('/api/staff/saving', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to add user');

            console.log('User added successfully');
            await fetchAccount();  // รีเฟรชข้อมูลบัญชี
            modal.style.display = 'none';
            alert('User added successfully');
            resetForm();  // ล้างฟอร์มหลังการบันทึก
        } catch (error) {
            console.error('Error adding user:', error);
            alert(error.message || 'Failed to add user. Please try again.');
        }
    };
};


document.getElementById('addUserButton').addEventListener('click', openAddUserModal);

// เรียกใช้ฟังก์ชันเพื่อดึงข้อมูลเมื่อโหลดหน้าเสร็จ
document.addEventListener('DOMContentLoaded', fetchAccount);

// เพิ่ม Event Listener สำหรับปุ่ม Toggle Sidebar
document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
