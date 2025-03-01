// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
window.onload = () => {
    fetchAndRenderUsers(); // ดึงข้อมูลผู้ใช้และแสดงผลในตาราง
    document.getElementById('searchInput').addEventListener('input', filterUsers);
    document.getElementById('permissionFilter').addEventListener('change', filterUsers);
    document.getElementById('logoutButton').addEventListener('click', logout);
};

let allUsers = []; // เก็บข้อมูลผู้ใช้ทั้งหมด


document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Sidebar Functions
const toggleSidebar = () => {
    try {
        const aside = document.querySelector('aside');
        const main = document.querySelector('main');
        
        if (!aside || !main) {
            console.error('ไม่พบ aside หรือ main elements');
            return;
        }

        aside.classList.toggle('w-64');
        aside.classList.toggle('w-20');
        
        const textElements = aside.querySelectorAll('span');
        textElements.forEach(span => {
            span.classList.toggle('hidden');
        });

        const isCollapsed = !aside.classList.contains('w-64');
        localStorage.setItem('sidebarState', isCollapsed);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการ toggle sidebar:', error);
    }
};

const initializeSidebar = () => {
    try {
        const aside = document.querySelector('aside');
        if (!aside) return;

        const isCollapsed = localStorage.getItem('sidebarState') === 'true';
        
        if (isCollapsed) {
            aside.classList.remove('w-64');
            aside.classList.add('w-20');
            
            const textElements = aside.querySelectorAll('span');
            textElements.forEach(span => {
                span.classList.add('hidden');
            });
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการเริ่มต้น sidebar:', error);
    }
};

// Sidebar Observer
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            const aside = document.querySelector('aside');
            const toggleButton = document.getElementById('toggleSidebar');
            
            if (aside && toggleButton && !toggleButton.hasListener) {
                toggleButton.addEventListener('click', toggleSidebar);
                toggleButton.hasListener = true;
                initializeSidebar();
                observer.disconnect();
            }
        }
    });
});

// ฟังก์ชันสำหรับแสดง modal และแก้ไขข้อมูลผู้ใช้
const openEditModal = async (user) => {
    const modal = document.getElementById('editUserModal');
    const form = document.getElementById('editUserForm');

    if (!modal || !form) {
        console.error('Modal หรือฟอร์มหาไม่พบ');
        return;
    }

    const userId = user._id;
    if (!userId) {
        console.error('ไม่พบรหัสผู้ใช้');
        return;
    }

    try {
        const response = await fetch(`/api/admin/users/${userId}`);
        if (!response.ok) {
            throw new Error(`ไม่สามารถดึงข้อมูลผู้ใช้ได้: ${response.status}`);
        }
        const userData = await response.json();
        console.log(userData);

        const convertToBE = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            const yearBE = date.getFullYear() + 543;
            return `${yearBE}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;
        };

        document.getElementById('editName').value = userData.name || '';
        document.getElementById('editEmail').value = userData.email || '';
        document.getElementById('editAddress').value = userData.address || '';
        document.getElementById('editPhone').value = userData.phone || '';
        document.getElementById('editBirthday').value = userData.birthday
            ? convertToBE(userData.birthday)
            : '';
        document.getElementById('editPermission').value = userData.permission || 'User';

        modal.style.display = 'block';

        form.onsubmit = async (e) => {
            e.preventDefault();

            const convertToAD = (dateString) => {
                if (!dateString) return '';
                const dateParts = dateString.split('-');
                const yearAD = parseInt(dateParts[0]) - 543;
                return `${yearAD}-${dateParts[1]}-${dateParts[2]}`;
            };

            const updatedData = {
                name: document.getElementById('editName').value,
                email: document.getElementById('editEmail').value,
                password: document.getElementById('editPassword').value,
                address: document.getElementById('editAddress').value,
                phone: document.getElementById('editPhone').value,
                birthday: convertToAD(document.getElementById('editBirthday').value),
                permission: document.getElementById('editPermission').value,
            };

            try {
                const saveResponse = await fetch(`/api/admin/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData),
                });

                if (!saveResponse.ok) {
                    throw new Error(`ไม่สามารถบันทึกข้อมูลผู้ใช้ได้: ${saveResponse.status}`);
                }

                const result = await saveResponse.json();

                Swal.fire({
                    icon: 'success',
                    title: 'แก้ไขข้อมูลสำเร็จ',
                    text: 'ข้อมูลผู้ใช้ถูกบันทึกเรียบร้อยแล้ว',
                });

                modal.style.display = 'none';
                await fetchAndRenderUsers();
            } catch (saveError) {
                console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ใช้:', saveError);
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: 'ไม่สามารถบันทึกข้อมูลผู้ใช้ได้ กรุณาลองใหม่',
                });
            }
        };
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่',
        });
    }

    document.querySelector('#editUserModal .close').onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
};

// ฟังก์ชันสำหรับแก้ไขผู้ใช้
const editUser = (userId) => {
    const user = allUsers.find(u => u._id === userId); // หาข้อมูลผู้ใช้จาก allUsers
    if (user) openEditModal(user); // เปิด modal และแสดงข้อมูลผู้ใช้
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
    const confirmDelete = await Swal.fire({
        title: 'ยืนยันการลบผู้ใช้',
        text: 'คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
    });

    if (!confirmDelete.isConfirmed) return;

    try {
        const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });

        if (!response.ok) {
            const errorData = await response.text(); // รับข้อมูลเป็นข้อความ
            throw new Error(errorData || 'ไม่สามารถลบผู้ใช้ได้');
        }

         // ลบข้อมูลบัญชีออมทรัพย์ของผู้ใช้นี้
         const savingResponse = await fetch(`/api/staff/saving/${userId}`, { method: 'DELETE' });

         if (!savingResponse.ok) {
             const errorData = await savingResponse.text();
             throw new Error(errorData || 'ไม่สามารถลบข้อมูลบัญชีออมทรัพย์ได้');
         }

        await fetchAndRenderUsers(); // อัปเดตตารางผู้ใช้หลังจากลบ

        Swal.fire({
            icon: 'success',
            title: 'ลบผู้ใช้สำเร็จ',
            text: 'ผู้ใช้ถูกลบออกจากระบบเรียบร้อยแล้ว',
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถลบผู้ใช้ได้ กรุณาลองใหม่',
        });
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

// ฟังก์ชันสำหรับเปิด modal เพื่อเพิ่มผู้ใช้
const openAddUserModal = () => {
    const modal = document.getElementById('addUserModal');
    const form = document.getElementById('addUserForm');

    // แสดง modal
    modal.style.display = 'block';

    // ฟังก์ชันแปลงปี ค.ศ. เป็นปี พ.ศ.
    const convertToBE = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const yearBE = date.getFullYear() + 543;
        return `${yearBE}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;
    };

    // ฟังก์ชันแปลงปี พ.ศ. เป็นปี ค.ศ.
    const convertToAD = (dateString) => {
        if (!dateString) return '';
        const dateParts = dateString.split('-');
        const yearAD = parseInt(dateParts[0]) - 543;
        return `${yearAD}-${dateParts[1]}-${dateParts[2]}`;
    };

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

    form.onsubmit = async (e) => {
        e.preventDefault();
    
        const newUser = {
            name: document.getElementById('addName').value,
            email: document.getElementById('addEmail').value,
            password: document.getElementById('addPassword').value,
            address: document.getElementById('addAddress').value,
            phone: document.getElementById('addPhone').value,
            birthday: convertToAD(document.getElementById('addBirthday').value),
            permission: document.getElementById('addPermission').value,
        };
    
        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
    
            const result = await response.json();
            console.log('User created:', result); // ✅ ตรวจสอบข้อมูลที่ได้จาก API
    
            if (!response.ok) {
                throw new Error(result.message || 'ไม่สามารถเพิ่มผู้ใช้ได้');
            }
    
            if (!result._id) {
                throw new Error('ไม่พบ User ID ในการตอบกลับจาก API');
            }
    
            // ✅ ใช้ _id ในการสร้างบัญชี Saving
            await createSavingAccount(result._id);
    
            await fetchAndRenderUsers();
            modal.style.display = 'none';
            Swal.fire({
                icon: 'success',
                title: 'เพิ่มผู้ใช้สำเร็จ',
                text: 'ผู้ใช้ได้ถูกเพิ่มเข้ามาแล้ว',
            });
        } catch (error) {
            console.error('Error adding user:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถเพิ่มผู้ใช้ได้ กรุณาลองใหม่',
            });
        }
    };
};

const createSavingAccount = async (userId) => {
    if (!userId) {
        console.error('❌ createSavingAccount: userId is missing');
        return;
    }

    console.log('✅ Creating saving account for userId:', userId);

    const user = JSON.parse(localStorage.getItem('currentUser'));

    const newSavingAccount = {
        id_account: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        id_member: userId,
        balance: 0,
        id_staff: user && user._id ? user._id : 'unknown_staff_id',
    };

    try {
        console.log('Sending data:', newSavingAccount);

        const response = await fetch('/api/staff/saving', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSavingAccount),
        });

        const result = await response.json();
        console.log('Saving account response:', result);

        if (!response.ok) {
            throw new Error(result.message || 'Failed to create saving account');
        }

        console.log('✅ Saving account created successfully');
    } catch (error) {
        console.error('❌ Error creating saving account:', error);
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

// เพิ่ม event listener ให้กับปุ่ม Add User
document.getElementById('addUserButton').addEventListener('click', openAddUserModal);
