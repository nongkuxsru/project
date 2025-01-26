let allUsers = []; // เก็บข้อมูลผู้ใช้ทั้งหมด

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ทั้งหมด
const fetchUsers = async () => {
    try {
        const response = await fetch('/api/admin/users'); // เรียก API เพื่อดึงข้อมูลผู้ใช้
        allUsers = await response.json(); // เก็บข้อมูลผู้ใช้ทั้งหมด
        renderUsers(allUsers); // แสดงข้อมูลผู้ใช้ในตาราง
    } catch (error) {
        console.error('Error fetching users:', error);
    }
};

// ฟังก์ชันสำหรับแสดงข้อมูลผู้ใช้ในตาราง
const renderUsers = (users) => {
    const usersTable = document.getElementById('usersTable').getElementsByTagName('tbody')[0];
    usersTable.innerHTML = ''; // ล้างข้อมูลเก่า

    users.forEach(user => {
        const row = usersTable.insertRow();
        row.insertCell().textContent = user.name;
        row.insertCell().textContent = user.email;
        row.insertCell().textContent = user.permission;

        // เพิ่มปุ่ม Actions
        const actionsCell = row.insertCell();
        actionsCell.className = 'actions';
        actionsCell.innerHTML = `
            <button onclick="editUser('${user._id}')"><i class="fas fa-edit"></i></button>
            <button onclick="deleteUser('${user._id}')"><i class="fas fa-trash"></i></button>
        `;
    });
};

// ฟังก์ชันสำหรับ filter ข้อมูล
const filterUsers = () => {
    const searchText = document.getElementById('searchInput').value.toLowerCase(); // ข้อความค้นหา
    const permissionFilter = document.getElementById('permissionFilter').value; // สิทธิ์ที่เลือก

    const filteredUsers = allUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchText) || user.email.toLowerCase().includes(searchText);
        const matchesPermission = permissionFilter === 'all' || user.permission === permissionFilter;
        return matchesSearch && matchesPermission;
    });

    renderUsers(filteredUsers); // แสดงข้อมูลที่ filter แล้ว
};

// เพิ่ม Event Listeners สำหรับช่องค้นหาและ dropdown filter
document.getElementById('searchInput').addEventListener('input', filterUsers);
document.getElementById('permissionFilter').addEventListener('change', filterUsers);
document.getElementById('logoutButton').addEventListener('click', logout);
document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);

// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
window.onload = () => {
    fetchUsers(); // ดึงข้อมูลผู้ใช้
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