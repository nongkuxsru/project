window.onload = () => {
    document.getElementById('logoutButton').addEventListener('click', logout);
};

document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
});

// ===============================
// Sidebar Functions
// ===============================
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
        textElements.forEach(span => span.classList.toggle('hidden'));

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
            textElements.forEach(span => span.classList.add('hidden'));
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการเริ่มต้น sidebar:', error);
    }
};

// ===============================
// Sidebar Observer
// ===============================
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
        // แสดง Loading
        Swal.fire({
            title: 'กำลังโหลดข้อมูล',
            text: 'กรุณารอสักครู่...',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(`/api/admin/users/${userId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch user data: ${response.status}`);
        }
        const userData = await response.json();

        // ปิด Loading
        Swal.close();

        // แปลงวันเกิดจาก ค.ศ. เป็น พ.ศ.
        let birthday = '';
        if (userData.birthday) {
            const birthdayDate = new Date(userData.birthday);
            const buddhistYear = birthdayDate.getFullYear() + 543;
            birthday = `${buddhistYear}-${(birthdayDate.getMonth() + 1).toString().padStart(2, '0')}-${birthdayDate.getDate().toString().padStart(2, '0')}`;
        }

        // เติมข้อมูลในฟอร์ม
        document.getElementById('editName').value = userData.name || '';
        document.getElementById('editEmail').value = userData.email || '';
        document.getElementById('editPassword').value = '';
        document.getElementById('editAddress').value = userData.address || '';
        document.getElementById('editPhone').value = userData.phone || '';
        document.getElementById('editBirthday').value = birthday;
        document.getElementById('editPermission').value = userData.permission || 'user';

        // แสดง modal
        modal.classList.remove('hidden');

        // จัดการเมื่อฟอร์มถูกส่ง
        form.onsubmit = async (e) => {
            e.preventDefault();

            // แปลงวันเกิดจาก พ.ศ. ไป ค.ศ.
            const birthdayInput = document.getElementById('editBirthday').value;
            const birthdayDate = new Date(birthdayInput);
            const gregorianYear = birthdayDate.getFullYear() - 543;
            const formattedBirthday = `${gregorianYear}-${(birthdayDate.getMonth() + 1).toString().padStart(2, '0')}-${birthdayDate.getDate().toString().padStart(2, '0')}`;

            const updatedData = {
                name: document.getElementById('editName').value,
                email: document.getElementById('editEmail').value,
                password: document.getElementById('editPassword').value,
                address: document.getElementById('editAddress').value,
                phone: document.getElementById('editPhone').value,
                birthday: formattedBirthday,
                permission: document.getElementById('editPermission').value,
            };

            try {
                // แสดง Loading
                Swal.fire({
                    title: 'กำลังบันทึกข้อมูล',
                    text: 'กรุณารอสักครู่...',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    willOpen: () => {
                        Swal.showLoading();
                    }
                });

                const saveResponse = await fetch(`/api/admin/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData),
                });

                if (!saveResponse.ok) {
                    throw new Error(`Failed to save user data: ${saveResponse.status}`);
                }

                await saveResponse.json();

                await Swal.fire({
                    icon: 'success',
                    title: 'บันทึกข้อมูลสำเร็จ',
                    text: 'ข้อมูลผู้ใช้ได้รับการอัปเดตแล้ว',
                    confirmButtonText: 'ตกลง'
                });

                modal.classList.add('hidden');
                await fetchAndRenderUsers();
            } catch (saveError) {
                console.error('Error saving user data:', saveError);
                await Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
                    confirmButtonText: 'ตกลง'
                });
            }
        };
    } catch (error) {
        console.error('Error fetching user data:', error);
        await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง',
            confirmButtonText: 'ตกลง'
        });
    }

    // ปิด modal เมื่อคลิกปุ่ม close
    document.querySelectorAll('#editUserModal .close').forEach(button => {
        button.onclick = () => {
            modal.classList.add('hidden');
        };
    });

    // ปิด modal เมื่อคลิกนอก modal
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.classList.add('hidden');
        }
    };
};

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้และแสดงผลในตาราง
const fetchAndRenderUsers = async () => {
    try {
        // แสดง Loading
        Swal.fire({
            title: 'กำลังโหลดข้อมูล',
            text: 'กรุณารอสักครู่...',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch('/api/admin/users');
        allUsers = await response.json();
        
        // ปิด Loading
        Swal.close();
        
        renderUsers(allUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง',
            confirmButtonText: 'ตกลง'
        });
    }
};

// ฟังก์ชันสำหรับแสดงข้อมูลผู้ใช้ในตาราง
const renderUsers = (users) => {
    const usersTable = document.getElementById('usersTable').getElementsByTagName('tbody')[0];
    usersTable.innerHTML = '';

    users.forEach(user => {
        const row = usersTable.insertRow();
        
        // ชื่อ
        const nameCell = row.insertCell();
        nameCell.className = 'px-6 py-4 whitespace-nowrap';
        nameCell.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                        ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                </div>
                <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${user.name || ''}</div>
                </div>
            </div>
        `;

        // อีเมล
        const emailCell = row.insertCell();
        emailCell.className = 'px-6 py-4 whitespace-nowrap';
        emailCell.innerHTML = `<div class="text-sm text-gray-900">${user.email || ''}</div>`;

        // สิทธิ์
        const permissionCell = row.insertCell();
        permissionCell.className = 'px-6 py-4 whitespace-nowrap';
        const permissionClass = {
            admin: 'bg-red-100 text-red-800',
            staff: 'bg-blue-100 text-blue-800',
            user: 'bg-green-100 text-green-800'
        }[user.permission] || 'bg-gray-100 text-gray-800';
        permissionCell.innerHTML = `
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${permissionClass}">
                ${user.permission || 'user'}
            </span>
        `;

        // การกระทำ
        const actionsCell = row.insertCell();
        actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
        actionsCell.innerHTML = `
            <button class="text-green-600 hover:text-green-900 mr-3 edit-btn" data-user-id="${user._id}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="text-red-600 hover:text-red-900 delete-btn" data-user-id="${user._id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
    });

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
    const result = await Swal.fire({
        title: 'ยืนยันการลบผู้ใช้',
        text: 'คุณต้องการลบผู้ใช้นี้ใช่หรือไม่?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ลบผู้ใช้',
        cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
        try {
            // แสดง Loading
            Swal.fire({
                title: 'กำลังลบข้อมูล',
                text: 'กรุณารอสักครู่...',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading();
                }
            });

            const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete user');
            }

            await Swal.fire({
                icon: 'success',
                title: 'ลบผู้ใช้สำเร็จ',
                text: 'ข้อมูลผู้ใช้ถูกลบเรียบร้อยแล้ว',
                confirmButtonText: 'ตกลง'
            });

            await fetchAndRenderUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถลบผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง',
                confirmButtonText: 'ตกลง'
            });
        }
    }
};

// ฟังก์ชันสำหรับ filter ข้อมูล
const filterUsers = () => {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const permissionFilter = document.getElementById('permissionFilter').value;

    const filteredUsers = allUsers.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchText) || 
                            user.email?.toLowerCase().includes(searchText);
        const matchesPermission = permissionFilter === 'all' || user.permission === permissionFilter;
        return matchesSearch && matchesPermission;
    });

    renderUsers(filteredUsers);
};

// ฟังก์ชันสำหรับแก้ไขผู้ใช้
const editUser = (userId) => {
    const user = allUsers.find(u => u._id === userId);
    if (user) openEditModal(user);
};

// ฟังก์ชันสำหรับเปิด modal เพิ่มผู้ใช้
const openAddUserModal = () => {
    const modal = document.getElementById('addUserModal');
    const form = document.getElementById('addUserForm');

    // แสดง modal
    modal.classList.remove('hidden');

    // ปิด modal เมื่อคลิกปุ่ม close
    document.querySelectorAll('#addUserModal .close').forEach(button => {
        button.onclick = () => {
            modal.classList.add('hidden');
        };
    });

    // ปิด modal เมื่อคลิกนอก modal
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.classList.add('hidden');
        }
    };

    // จัดการการส่งฟอร์ม
    form.onsubmit = async (e) => {
        e.preventDefault();

        const birthdayInput = document.getElementById('addBirthday').value;
        const birthdayDate = new Date(birthdayInput);
        const gregorianYear = birthdayDate.getFullYear() - 543;
        const formattedBirthday = `${gregorianYear}-${(birthdayDate.getMonth() + 1).toString().padStart(2, '0')}-${birthdayDate.getDate().toString().padStart(2, '0')}`;

        const newUser = {
            name: document.getElementById('addName').value,
            email: document.getElementById('addEmail').value,
            password: document.getElementById('addPassword').value,
            address: document.getElementById('addAddress').value,
            phone: document.getElementById('addPhone').value,
            birthday: formattedBirthday,
            permission: document.getElementById('addPermission').value,
        };

        try {
            // แสดง Loading
            Swal.fire({
                title: 'กำลังเพิ่มผู้ใช้',
                text: 'กรุณารอสักครู่...',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading();
                }
            });

            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to add user');
            }

            await Swal.fire({
                icon: 'success',
                title: 'เพิ่มผู้ใช้สำเร็จ',
                text: 'ข้อมูลผู้ใช้ใหม่ถูกเพิ่มเรียบร้อยแล้ว',
                confirmButtonText: 'ตกลง'
            });

            modal.classList.add('hidden');
            form.reset();
            await fetchAndRenderUsers();
        } catch (error) {
            console.error('Error adding user:', error);
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถเพิ่มผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง',
                confirmButtonText: 'ตกลง'
            });
        }
    };
};

// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderUsers();
    document.getElementById('addUserButton').addEventListener('click', openAddUserModal);

    // อัปเดตชื่อผู้ใช้และอวาตาร์
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (userData) {
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        if (userName && userAvatar) {
            userName.textContent = 'ยินดีต้อนรับ ' + (userData.name || 'ผู้ดูแลระบบ');
            userAvatar.textContent = userData.name ? userData.name.charAt(0).toUpperCase() : 'A';
        }
    }
});

const logout = async () => {
    try {
        // แสดง SweetAlert2 เพื่อยืนยันการออกจากระบบ
        const result = await Swal.fire({
            title: 'ยืนยันการออกจากระบบ',
            text: 'คุณต้องการออกจากระบบใช่หรือไม่?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ใช่, ออกจากระบบ',
            cancelButtonText: 'ยกเลิก'
        });

        // ถ้าผู้ใช้กดยืนยัน
        if (result.isConfirmed) {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('selectedTheme');

                await Swal.fire({
                    icon: 'success',
                    title: 'ออกจากระบบสำเร็จ',
                    text: 'กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...',
                    timer: 1500,
                    showConfirmButton: false
                });

                window.location.href = '/';
            } else {
                throw new Error('Logout failed');
            }
        }
    } catch (error) {
        console.error('Error during logout:', error);
        await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง'
        });
    }
};