let allUsers = []; // เก็บข้อมูลผู้ใช้ทั้งหมด

// ฟังก์ชันสำหรับแสดง modal และแก้ไขข้อมูลผู้ใช้
const openEditModal = async (user) => {
    const modal = document.getElementById('editUserModal');
    const form = document.getElementById('editUserForm');

    if (!modal || !form) {
        console.error('Modal or form not found');
        return;
    }

    // ตรวจสอบว่า user object มีค่า _id
    const userId = user._id;
    if (!userId) {
        console.error('User ID is missing');
        return;
    }
    try {
        const response = await fetch(`/api/admin/users/${userId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch user data: ${response.status}`);
        }
        const userData = await response.json(); // แปลง response เป็น JSON

        // เติมข้อมูลในฟอร์ม
        document.getElementById('editName').value = userData.name || '';
        document.getElementById('editEmail').value = userData.email || '';
        document.getElementById('editPassword').value = userData.password || '';
        document.getElementById('editAddress').value = userData.address || '';
        document.getElementById('editPhone').value = userData.phone || '';
        document.getElementById('editBirthday').value = userData.birthday
            ? new Date(userData.birthday).toISOString().split('T')[0]
            : '';
        document.getElementById('editPermission').value = userData.permission || 'User';

        // แสดง modal
        modal.style.display = 'block';

        // จัดการเมื่อฟอร์มถูกส่ง
        form.onsubmit = async (e) => {
            e.preventDefault();

            const updatedData = {
                name: document.getElementById('editName').value,
                email: document.getElementById('editEmail').value,
                password: document.getElementById('editPassword').value,
                address: document.getElementById('editAddress').value,
                phone: document.getElementById('editPhone').value,
                birthday: document.getElementById('editBirthday').value,
                permission: document.getElementById('editPermission').value,
            };

            try {
                const saveResponse = await fetch(`/api/admin/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData),
                });

                if (!saveResponse.ok) {
                    throw new Error(`Failed to save user data: ${saveResponse.status}`);
                }

                const result = await saveResponse.json();

                alert('User data updated successfully!');
                modal.style.display = 'none'; // ปิด modal หลังจากบันทึกสำเร็จ
                await fetchAndRenderUsers(); // อัปเดตข้อมูลในตารางหรือหน้าเว็บ
            } catch (saveError) {
                console.error('Error saving user data:', saveError);
                alert('Failed to save user data. Please try again.');
            }
        };
    } catch (error) {
        console.error('Error fetching user data:', error);
        alert('Failed to fetch user data. Please try again.');
    }

    // ปิด modal เมื่อคลิกปุ่ม close (×)
    document.querySelector('#editUserModal .close').onclick = () => {
        modal.style.display = 'none';
    };

    // ปิด modal เมื่อคลิกนอก modal
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
};

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้และแสดงผลในตาราง
const fetchAndRenderUsers = async () => {
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

        // เพิ่มปุ่ม Actions โดยใช้ HTML
        const actionsCell = row.insertCell();
        actionsCell.className = 'actions';
        actionsCell.innerHTML = `
            <button class="edit-btn" data-user-id="${user._id}"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" data-user-id="${user._id}"><i class="fas fa-trash"></i></button>
        `;
    });

    // เพิ่ม event listener ให้กับปุ่ม Actions
    addActionButtonListeners();
};

// ฟังก์ชันสำหรับเพิ่ม event listener ให้กับปุ่ม Actions
const addActionButtonListeners = () => {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => editUser(button.getAttribute('data-user-id')));
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => deleteUser(button.getAttribute('data-user-id')));
    });
};

// ฟังก์ชันสำหรับลบผู้ใช้
const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`api/admin/users/${userId}`, { method: 'DELETE' });
        const result = await response.json(); // แปลง response เป็น JSON

        if (!response.ok) {
            // หาก API ส่งข้อความ error กลับมา
            throw new Error(result.message || 'Failed to delete user');
        }

        await fetchAndRenderUsers(); // อัปเดตตารางผู้ใช้หลังจากลบ
        alert('User deleted successfully');
    } catch (error) {
        console.error('Error deleting user:', error);
        alert(error.message || 'Failed to delete user. Please try again.');
    }
};

// ฟังก์ชันสำหรับ filter ข้อมูล
const filterUsers = () => {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const permissionFilter = document.getElementById('permissionFilter').value;

    const filteredUsers = allUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchText) || user.email.toLowerCase().includes(searchText);
        const matchesPermission = permissionFilter === 'all' || user.permission === permissionFilter;
        return matchesSearch && matchesPermission;
    });

    renderUsers(filteredUsers); // แสดงข้อมูลที่ filter แล้ว
};

// ฟังก์ชันสำหรับแก้ไขผู้ใช้
const editUser = (userId) => {
    const user = allUsers.find(u => u._id === userId); // หาข้อมูลผู้ใช้จาก allUsers
    if (user) openEditModal(user); // เปิด modal และแสดงข้อมูลผู้ใช้
};

// ฟังก์ชันสำหรับเปิด modal เพื่อเพิ่มผู้ใช้
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
            password: document.getElementById('addPassword').value,
            address: document.getElementById('addAddress').value,
            phone: document.getElementById('addPhone').value,
            birthday: document.getElementById('addBirthday').value,
            permission: document.getElementById('addPermission').value,
        };

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });

            // ตรวจสอบว่า response เป็น JSON หรือไม่
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text(); // อ่าน response เป็นข้อความ
                throw new Error(`Expected JSON, but got: ${text}`);
            }

            const result = await response.json(); // แปลง response เป็น JSON

            if (!response.ok) {
                throw new Error(result.message || 'Failed to add user');
            }

            await fetchAndRenderUsers(); // อัปเดตตารางผู้ใช้
            modal.style.display = 'none'; // ปิด modal
            alert('User added successfully');
        } catch (error) {
            console.error('Error adding user:', error);
            alert(error.message || 'Failed to add user. Please try again.');
        }
    };
};

// เพิ่ม event listener ให้กับปุ่ม Add User
document.getElementById('addUserButton').addEventListener('click', openAddUserModal);

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

// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
window.onload = () => {
    fetchAndRenderUsers(); // ดึงข้อมูลผู้ใช้และแสดงผลในตาราง
    document.getElementById('searchInput').addEventListener('input', filterUsers);
    document.getElementById('permissionFilter').addEventListener('change', filterUsers);
    document.getElementById('logoutButton').addEventListener('click', logout);
};