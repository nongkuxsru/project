window.onload = () => {
    fetchAndRenderUsers(); // ดึงข้อมูลผู้ใช้และแสดงผลในตาราง
    document.getElementById('searchInput').addEventListener('input', filterUsers);
    document.getElementById('logoutButton').addEventListener('click', logout);
};

let allUsers = []; // เก็บข้อมูลผู้ใช้ทั้งหมด

// เพิ่มตัวแปรสำหรับจัดการ pagination
let currentPage = 1;
const rowsPerPage = 8;
let totalPages = 1;

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

    // ฟังก์ชันสำหรับปิด modal
    const closeModal = () => {
        modal.classList.remove('flex');
        modal.style.display = 'none';
        form.reset();
    };

    try {
        const response = await fetch(`/api/admin/users/${userId}`);
        if (!response.ok) {
            throw new Error(`ไม่สามารถดึงข้อมูลผู้ใช้ได้: ${response.status}`);
        }
        const userData = await response.json();

        // ตรวจสอบว่าเป็นสมาชิกหรือไม่
        if (userData.permission !== 'member') {
            throw new Error('ไม่สามารถแก้ไขข้อมูลผู้ใช้ที่ไม่ใช่สมาชิกได้');
        }

        const convertToBE = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            const yearBE = date.getFullYear() + 543;
            return `${yearBE}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;
        };

        // กรอกข้อมูลในฟอร์ม
        document.getElementById('editName').value = userData.name || '';
        document.getElementById('editEmail').value = userData.email || '';
        document.getElementById('editAddress').value = userData.address || '';
        document.getElementById('editPhone').value = userData.phone || '';
        document.getElementById('editBirthday').value = userData.birthday
            ? convertToBE(userData.birthday)
            : '';

        // ซ่อนหรือลบ select สำหรับเลือกสิทธิ์
        const permissionSelect = document.getElementById('editPermission');
        if (permissionSelect) {
            permissionSelect.style.display = 'none';
            // หรือถ้าต้องการลบออกเลย
            // permissionSelect.remove();
        }

        // แสดง modal
        modal.style.display = 'block';
        modal.classList.add('flex');

        // จัดการการคลิกที่ modal background
        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.classList.contains('min-h-screen')) {
                closeModal();
            }
        });

        // จัดการปุ่มปิด
        const closeButton = modal.querySelector('.close');
        if (closeButton) {
            closeButton.onclick = closeModal;
        }

        // จัดการการส่งฟอร์ม
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
                address: document.getElementById('editAddress').value,
                phone: document.getElementById('editPhone').value,
                birthday: convertToAD(document.getElementById('editBirthday').value),
                permission: 'member' // กำหนดค่าคงที่เป็น member
            };

            try {
                const saveResponse = await fetch(`/api/admin/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData),
                });

                if (!saveResponse.ok) {
                    throw new Error(`ไม่สามารถบันทึกข้อมูลสมาชิกได้: ${saveResponse.status}`);
                }

                await saveResponse.json();
                closeModal();
                await fetchAndRenderUsers();

                Swal.fire({
                    icon: 'success',
                    title: 'แก้ไขข้อมูลสำเร็จ',
                    text: 'ข้อมูลสมาชิกถูกบันทึกเรียบร้อยแล้ว',
                });
            } catch (saveError) {
                console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลสมาชิก:', saveError);
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: 'ไม่สามารถบันทึกข้อมูลสมาชิกได้ กรุณาลองใหม่',
                });
            }
        };
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถดึงข้อมูลสมาชิกได้ กรุณาลองใหม่',
        });
    }
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
    usersTable.innerHTML = '';

    // กรองเฉพาะผู้ใช้ที่มีสิทธิ์เป็น member
    const memberUsers = users.filter(user => user.permission === 'member');

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const usersToDisplay = memberUsers.slice(startIndex, endIndex);
    totalPages = Math.ceil(memberUsers.length / rowsPerPage);

    if (usersToDisplay.length === 0) {
        usersTable.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">ไม่พบข้อมูลสมาชิก</td>
            </tr>
        `;
        return;
    }

    usersToDisplay.forEach(user => {
        const row = usersTable.insertRow();
        
        const nameCell = row.insertCell();
        nameCell.className = 'border px-6 py-4 whitespace-nowrap text-sm text-gray-800';
        nameCell.textContent = user.name;

        const emailCell = row.insertCell();
        emailCell.className = 'border px-6 py-4 whitespace-nowrap text-sm text-gray-800';
        emailCell.textContent = user.email;
        
        // เซลล์สำหรับสิทธิ์ผู้ใช้
        const permissionCell = row.insertCell();
        permissionCell.className = 'border px-6 py-4 whitespace-nowrap text-sm text-gray-800';
        permissionCell.innerHTML = getPermissionBadge(user.permission);

        // เซลล์สำหรับปุ่ม Actions
        const actionsCell = row.insertCell();
        actionsCell.className = 'border px-6 py-4 whitespace-nowrap text-sm text-gray-800';
        const actionWrapper = document.createElement('div');
        actionWrapper.className = 'flex justify-center gap-2';
        actionWrapper.innerHTML = `
            <button 
                class="update-password-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition duration-200 ease-in-out flex items-center gap-1 text-sm"
                data-user-id="${user._id}"
                title="อัพเดทรหัสผ่าน">
                <i class="fas fa-key"></i>
                <span>รหัสผ่าน</span>
            </button>
            <button 
                class="edit-btn bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg transition duration-200 ease-in-out flex items-center gap-1 text-sm"
                data-user-id="${user._id}"
                title="แก้ไขข้อมูล">
                <i class="fas fa-edit"></i>
                <span>แก้ไข</span>
            </button>
            <button 
                class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition duration-200 ease-in-out flex items-center gap-1 text-sm"
                data-user-id="${user._id}"
                title="ลบผู้ใช้">
                <i class="fas fa-trash-alt"></i>
                <span>ลบ</span>
            </button>
        `;
        actionsCell.appendChild(actionWrapper);
    });

    addActionButtonListeners();
    renderPagination();
};

// ฟังก์ชันสำหรับสร้าง badge แสดงสิทธิ์
const getPermissionBadge = (permission) => {
    const badges = {
        member: { bg: 'bg-green-100', text: 'text-green-700', label: 'สมาชิก' }
    };

    const badge = badges[permission] || badges.member;
    return `
        <span class="px-2 py-1 rounded-full text-sm font-semibold inline-block
            ${badge.bg} ${badge.text}">
            ${badge.label}
        </span>
    `;
};

// ฟังก์ชันสำหรับเพิ่ม event listener ให้กับปุ่ม Actions
const addActionButtonListeners = () => {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => editUser(button.getAttribute('data-user-id')));
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => deleteUser(button.getAttribute('data-user-id')));
    });

    document.querySelectorAll('.update-password-btn').forEach(button => {
        button.addEventListener('click', () => openUpdatePasswordModal(button.getAttribute('data-user-id')));
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

    const filteredUsers = allUsers.filter(user => {
        return user.permission === 'member' && (
            (user.name?.toLowerCase() || '').includes(searchText) || 
            (user.email?.toLowerCase() || '').includes(searchText) ||
            (user.phone?.toLowerCase() || '').includes(searchText)
        );
    });

    currentPage = 1;
    renderUsers(filteredUsers);
};

// เพิ่ม debounce function เพื่อเพิ่มประสิทธิภาพการค้นหา
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// ปรับปรุงการเพิ่ม event listener สำหรับการค้นหา
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const debouncedFilter = debounce(filterUsers, 300);
        searchInput.addEventListener('input', debouncedFilter);
    }
});

// เพิ่มฟังก์ชันแปลงวันที่จาก BE เป็น AD
const convertToAD = (dateString) => {
    if (!dateString) return '';
    const dateParts = dateString.split('-');
    const yearAD = parseInt(dateParts[0]) - 543;
    return `${yearAD}-${dateParts[1]}-${dateParts[2]}`;
};

// ฟังก์ชันสำหรับเปิด modal เพื่อเพิ่มผู้ใช้
const openAddUserModal = () => {
    const modal = document.getElementById('addUserModal');
    const form = document.getElementById('addUserForm');

    if (!modal || !form) {
        console.error('Modal หรือฟอร์มหาไม่พบ');
        return;
    }

    // ฟังก์ชันสำหรับปิด modal
    const closeModal = () => {
        modal.classList.remove('flex');
        modal.style.display = 'none';
        form.reset();
    };

    // แสดง modal
    modal.style.display = 'block';
    modal.classList.add('flex');

    // จัดการการคลิกที่ modal background
    modal.addEventListener('click', (event) => {
        if (event.target === modal || event.target.classList.contains('min-h-screen')) {
            closeModal();
        }
    });

    // จัดการปุ่มปิด
    const closeButton = modal.querySelector('.close');
    if (closeButton) {
        closeButton.onclick = closeModal;
    }

    // จัดการการส่งฟอร์ม
    form.onsubmit = handleAddUserSubmit;
};

const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    
    // กำหนดให้ผู้ใช้ใหม่มีสิทธิ์เป็น member เท่านั้น
    const newUser = {
        name: document.getElementById('addName').value,
        email: document.getElementById('addEmail').value,
        password: document.getElementById('addPassword').value,
        address: document.getElementById('addAddress').value,
        phone: document.getElementById('addPhone').value,
        birthday: convertToAD(document.getElementById('addBirthday').value),
        permission: 'member'
    };

    try {
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser),
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'ไม่สามารถเพิ่มสมาชิกได้');
        }

        if (!result._id) {
            throw new Error('ไม่พบ User ID ในการตอบกลับจาก API');
        }

        // สร้างบัญชีออมทรัพย์
        await createSavingAccount(result._id);
        
        document.getElementById('addUserModal').style.display = 'none';
        await fetchAndRenderUsers();
        Swal.fire({
            icon: 'success',
            title: 'เพิ่มสมาชิกสำเร็จ',
            text: 'สมาชิกได้ถูกเพิ่มเข้ามาแล้ว',
        });
        
        e.target.reset();
    } catch (error) {
        console.error('Error adding member:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถเพิ่มสมาชิกได้ กรุณาลองใหม่',
        });
    }
};

const resetPin = async (userId) => {
    try {
        const result = await Swal.fire({
            title: 'รีเซ็ต PIN',
            html: `
                <div class="mb-4">
                    <input type="password" 
                        id="newPin" 
                        class="swal2-input" 
                        maxlength="4" 
                        pattern="\\d{4}"
                        inputmode="numeric"
                        placeholder="กรุณากรอก PIN ใหม่ 4 หลัก">
                    <div id="pinError" class="text-red-500 text-sm mt-2"></div>
                </div>
                <div>
                    <input type="password" 
                        id="confirmPin" 
                        class="swal2-input" 
                        maxlength="4" 
                        pattern="\\d{4}"
                        inputmode="numeric"
                        placeholder="ยืนยัน PIN ใหม่">
                    <div id="confirmPinError" class="text-red-500 text-sm mt-2"></div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            preConfirm: () => {
                const newPin = document.getElementById('newPin').value;
                const confirmPin = document.getElementById('confirmPin').value;

                if (!newPin || newPin.length !== 4 || !/^\d+$/.test(newPin)) {
                    Swal.showValidationMessage('PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น');
                    return false;
                }

                if (newPin !== confirmPin) {
                    Swal.showValidationMessage('PIN ไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
                    return false;
                }

                return newPin;
            }
        });

        if (result.isConfirmed) {
            const response = await fetch(`/api/admin/users/${userId}/pin`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: result.value })
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถรีเซ็ต PIN ได้');
            }

            // ล้างค่าช่องค้นหาและดึงข้อมูลใหม่
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
            }
            await fetchAndRenderUsers();

            await Swal.fire({
                icon: 'success',
                title: 'รีเซ็ต PIN สำเร็จ',
                text: 'PIN ได้ถูกเปลี่ยนเรียบร้อยแล้ว',
            });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            // ล้างค่าช่องค้นหาและดึงข้อมูลใหม่
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
            }
            await fetchAndRenderUsers();
            
            await Swal.fire({
                icon: 'info',
                title: 'ยกเลิกการรีเซ็ต PIN',
                text: 'การรีเซ็ต PIN ถูกยกเลิก',
                timer: 1500,
                showConfirmButton: false
            });
        }
    } catch (error) {
        console.error('Error resetting PIN:', error);
        await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถรีเซ็ต PIN ได้ กรุณาลองใหม่',
        });
    }
};

// เพิ่มฟังก์ชันสำหรับแสดง modal ตั้ง PIN
const showSetPinModal = async (userId) => {
    const result = await Swal.fire({
        title: 'ตั้ง PIN สำหรับผู้อำนวยการ',
        html: `
            <input type="password" 
                id="pin" 
                class="swal2-input" 
                maxlength="4" 
                pattern="\\d{4}"
                inputmode="numeric"
                placeholder="กรุณากรอก PIN 4 หลัก">
            <div id="pinError" class="text-red-500 text-sm mt-2"></div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'ตั้ง PIN',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            const pin = document.getElementById('pin').value;
            if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
                Swal.showValidationMessage('PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น');
                return false;
            }
            return pin;
        }
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/pin`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: result.value })
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถตั้ง PIN ได้');
            }

            Swal.fire({
                icon: 'success',
                title: 'เพิ่มผู้ใช้และตั้ง PIN สำเร็จ',
                text: 'ผู้อำนวยการได้ถูกเพิ่มเข้ามาแล้ว',
            });
        } catch (error) {
            console.error('Error setting PIN:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถตั้ง PIN ได้ กรุณาลองใหม่',
            });
        }
    } else {
        // ถ้าผู้ใช้ยกเลิกการตั้ง PIN ให้ลบผู้ใช้ที่เพิ่งสร้าง
        try {
            await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            Swal.fire({
                icon: 'info',
                title: 'ยกเลิกการเพิ่มผู้อำนวยการ',
                text: 'การเพิ่มผู้อำนวยการถูกยกเลิกเนื่องจากไม่ได้ตั้ง PIN',
            });
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    }
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
        const userAvatar = user.avatar || userName.charAt(0).toUpperCase();
       
        // แสดงชื่อผู้ใช้
        document.getElementById('userName').textContent = 'ยินดีต้อนรับ ' + userName;
        
        // แสดงอวาตาร์
        document.getElementById('userAvatar').textContent = userAvatar;

        // จัดการ Dropdown Menu
        const userMenuButton = document.getElementById('userMenuButton');
        const userDropdownMenu = document.getElementById('userDropdownMenu');
        const chevronIcon = userMenuButton.querySelector('.fa-chevron-down');

        // Toggle dropdown เมื่อคลิกที่ปุ่ม
        userMenuButton.addEventListener('click', () => {
            const isExpanded = userMenuButton.getAttribute('aria-expanded') === 'true';
            userMenuButton.setAttribute('aria-expanded', !isExpanded);
            userDropdownMenu.classList.toggle('hidden');
            chevronIcon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
        });

        // ปิด dropdown เมื่อคลิกที่อื่น
        document.addEventListener('click', (event) => {
            if (!userMenuButton.contains(event.target)) {
                userMenuButton.setAttribute('aria-expanded', 'false');
                userDropdownMenu.classList.add('hidden');
                chevronIcon.style.transform = 'rotate(0deg)';
            }
        });

        // จัดการปุ่มอัพเดทรหัสผ่าน
        document.getElementById('updateUserPasswordBtn').addEventListener('click', () => {
            openUpdatePasswordModal(user._id);
        });
    } else {
        // หากไม่มีข้อมูลผู้ใช้ใน localStorage
        document.getElementById('userName').textContent = 'ไม่พบข้อมูลผู้ใช้';
        document.getElementById('userAvatar').textContent = 'N/A';
    }
});

// เพิ่ม event listener ให้กับปุ่ม Add User
document.getElementById('addUserButton').addEventListener('click', openAddUserModal);

// เพิ่มฟังก์ชันสำหรับสร้าง pagination controls
const renderPagination = () => {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) {
        // สร้าง container สำหรับ pagination ถ้ายังไม่มี
        const container = document.createElement('div');
        container.id = 'pagination';
        container.className = 'flex justify-center items-center space-x-2 mt-4';
        document.querySelector('section.bg-white').appendChild(container);
    }

    paginationContainer.innerHTML = `
        <button 
            class="px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}"
            ${currentPage === 1 ? 'disabled' : ''}
            onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
        <span class="px-4 py-1">หน้า ${currentPage} จาก ${totalPages}</span>
        <button 
            class="px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}"
            ${currentPage === totalPages ? 'disabled' : ''}
            onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
};

// เพิ่มฟังก์ชันสำหรับเปลี่ยนหน้า
const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderUsers(allUsers);
    }
};

// เพิ่มฟังก์ชันสำหรับเปิด modal อัพเดทรหัสผ่าน
const openUpdatePasswordModal = (userId) => {
    const modal = document.getElementById('updatePasswordModal');
    const form = document.getElementById('updatePasswordForm');

    if (!modal || !form) {
        console.error('Modal หรือฟอร์มหาไม่พบ');
        return;
    }

    // ฟังก์ชันสำหรับปิด modal
    const closeModal = () => {
        modal.classList.remove('flex');
        modal.style.display = 'none';
        form.reset();
    };

    // แสดง modal
    modal.style.display = 'block';
    modal.classList.add('flex');

    // จัดการการคลิกที่ modal background
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // จัดการปุ่มปิด
    const closeButtons = modal.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.onclick = closeModal;
    });

    // จัดการการส่งฟอร์ม
    form.onsubmit = async (e) => {
        e.preventDefault();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'รหัสผ่านไม่ตรงกัน',
                text: 'กรุณากรอกรหัสผ่านให้ตรงกันทั้งสองช่อง'
            });
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword })
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถอัพเดทรหัสผ่านได้');
            }

            closeModal();
            Swal.fire({
                icon: 'success',
                title: 'อัพเดทรหัสผ่านสำเร็จ',
                text: 'รหัสผ่านได้ถูกเปลี่ยนเรียบร้อยแล้ว'
            });
        } catch (error) {
            console.error('Error updating password:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถอัพเดทรหัสผ่านได้ กรุณาลองใหม่'
            });
        }
    };
};
