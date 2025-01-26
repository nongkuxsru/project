// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ทั้งหมด
const fetchUsers = async () => {
    try {
        const response = await fetch('/api/admin/users'); // เรียก API เพื่อดึงข้อมูลผู้ใช้
        const data = await response.json();

        // อัปเดตข้อมูลผู้ใช้ในตาราง
        const usersTable = document.getElementById('usersTable').getElementsByTagName('tbody')[0];
        usersTable.innerHTML = ''; // ล้างข้อมูลเก่า

        data.forEach(user => {
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
    } catch (error) {
        console.error('Error fetching users:', error);
    }
};

// ฟังก์ชันสำหรับแก้ไขผู้ใช้
const editUser = (userId) => {
    alert(`Edit user with ID: ${userId}`);
    // เพิ่มโค้ดสำหรับแก้ไขผู้ใช้
};

// ฟังก์ชันสำหรับลบผู้ใช้
const deleteUser = (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
        alert(`Delete user with ID: ${userId}`);
        // เพิ่มโค้ดสำหรับลบผู้ใช้
    }
};

// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
window.onload = () => {
    fetchUsers(); // ดึงข้อมูลผู้ใช้
    document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
};