window.onload = () => {
    fetchAndRenderUsers(); // ดึงข้อมูลผู้ใช้และแสดงผลในตาราง
    document.getElementById('searchInput').addEventListener('input', filterUsers);
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

    // ฟังก์ชันสำหรับปิด modal
    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    try {
        const response = await fetch(`/api/admin/users/${userId}`);
        if (!response.ok) {
            throw new Error(`ไม่สามารถดึงข้อมูลผู้ใช้ได้: ${response.status}`);
        }
        const userData = await response.json();

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
        document.getElementById('editPermission').value = userData.permission || 'user';

        // แสดง modal
        modal.style.display = 'block';

        // จัดการการคลิกที่ modal background
        modal.addEventListener('click', (event) => {
            // ตรวจสอบว่าคลิกที่ modal background หรือพื้นที่ centering
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

                await saveResponse.json();
                closeModal();
                await fetchAndRenderUsers();

                Swal.fire({
                    icon: 'success',
                    title: 'แก้ไขข้อมูลสำเร็จ',
                    text: 'ข้อมูลผู้ใช้ถูกบันทึกเรียบร้อยแล้ว',
                });
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

    users.forEach(user => {
        const row = usersTable.insertRow();
        
        // เพิ่ม class ให้กับทุก cell เพื่อให้เส้นขอบต่อเนื่อง
        const nameCell = row.insertCell();
        nameCell.className = 'border px-4 py-2';
        nameCell.textContent = user.name;

        const emailCell = row.insertCell();
        emailCell.className = 'border px-4 py-2';
        emailCell.textContent = user.email;
        
        // เซลล์สำหรับสิทธิ์ผู้ใช้
        const permissionCell = row.insertCell();
        permissionCell.className = 'border px-4 py-2';
        permissionCell.innerHTML = `
            <span class="px-2 py-1 rounded-full text-sm font-semibold inline-block
                ${user.permission === 'admin' ? 'bg-purple-100 text-purple-700' : 
                user.permission === 'staff' ? 'bg-blue-100 text-blue-700' : 
                'bg-green-100 text-green-700'}">
                ${user.permission === 'admin' ? 'ผู้ดูแล' : 
                user.permission === 'staff' ? 'พนักงาน' : 'ผู้ใช้'}
            </span>
        `;

        // เซลล์สำหรับปุ่ม Actions
        const actionsCell = row.insertCell();
        actionsCell.className = 'border px-4 py-2';
        const actionWrapper = document.createElement('div');
        actionWrapper.className = 'flex items-center justify-end space-x-2 min-w-[200px]';
        actionWrapper.innerHTML = `
            ${user.permission === 'admin' ? `
                <button 
                    class="reset-pin-btn bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1 rounded-md transition duration-200 ease-in-out flex items-center gap-1 text-sm shadow-sm"
                    data-user-id="${user._id}"
                    onclick="resetPin('${user._id}')"
                    title="รีเซ็ต PIN">
                    <i class="fas fa-key text-xs"></i>
                    <span>รีเซ็ต PIN</span>
                </button>
            ` : ''}
            <button 
                class="edit-btn bg-yellow-500 hover:bg-yellow-600 text-white px-2.5 py-1 rounded-md transition duration-200 ease-in-out flex items-center gap-1 text-sm shadow-sm"
                data-user-id="${user._id}"
                title="แก้ไขข้อมูล">
                <i class="fas fa-edit text-xs"></i>
                <span>แก้ไข</span>
            </button>
            <button 
                class="delete-btn bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-md transition duration-200 ease-in-out flex items-center gap-1 text-sm shadow-sm"
                data-user-id="${user._id}"
                title="ลบผู้ใช้">
                <i class="fas fa-trash-alt text-xs"></i>
                <span>ลบ</span>
            </button>
        `;
        actionsCell.appendChild(actionWrapper);
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

    document.querySelectorAll('.reset-pin-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            resetPin(button.getAttribute('data-user-id'));
        });
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
        return user.name.toLowerCase().includes(searchText) || 
               user.email.toLowerCase().includes(searchText);
    });

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

    // แสดง modal
    modal.style.display = 'block';

    // ฟังก์ชันสำหรับปิด modal
    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    // จัดการการคลิกที่ modal background
    modal.addEventListener('click', (event) => {
        // ตรวจสอบว่าคลิกที่ modal background (ไม่ใช่ที่เนื้อหาของ modal)
        if (event.target === modal || event.target.classList.contains('min-h-screen')) {
            closeModal();
        }
    });

    // จัดการปุ่มปิด
    const closeButton = modal.querySelector('.close');
    if (closeButton) {
        closeButton.onclick = closeModal;
    }

    // จัดการการส่งฟอร์ม (ส่วนที่เหลือคงเดิม)
    form.onsubmit = async (e) => {
        e.preventDefault();
    
        const permission = document.getElementById('addPermission').value;
    
        const newUser = {
            name: document.getElementById('addName').value,
            email: document.getElementById('addEmail').value,
            password: document.getElementById('addPassword').value,
            address: document.getElementById('addAddress').value,
            phone: document.getElementById('addPhone').value,
            birthday: convertToAD(document.getElementById('addBirthday').value),
            permission: permission
        };
    
        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
    
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'ไม่สามารถเพิ่มผู้ใช้ได้');
            }
    
            if (!result._id) {
                throw new Error('ไม่พบ User ID ในการตอบกลับจาก API');
            }

            // สร้างบัญชีออมทรัพย์
            await createSavingAccount(result._id);
            
            // ถ้าเป็นผู้ดูแล ให้แสดง modal สำหรับตั้ง PIN
            if (permission === 'admin') {
                modal.style.display = 'none';
                await showSetPinModal(result._id);
            } else {
                modal.style.display = 'none';
                await fetchAndRenderUsers();
                Swal.fire({
                    icon: 'success',
                    title: 'เพิ่มผู้ใช้สำเร็จ',
                    text: 'ผู้ใช้ได้ถูกเพิ่มเข้ามาแล้ว',
                });
            }
            
            form.reset();
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

            // เคลียร์ช่องค้นหา
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
            }

            // ดึงข้อมูลผู้ใช้ใหม่
            await fetchAndRenderUsers();

            Swal.fire({
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
        title: 'ตั้ง PIN สำหรับผู้ดูแล',
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

            // เคลียร์ช่องค้นหา
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
            }

            // ดึงข้อมูลผู้ใช้ใหม่
            await fetchAndRenderUsers();

            Swal.fire({
                icon: 'success',
                title: 'เพิ่มผู้ใช้และตั้ง PIN สำเร็จ',
                text: 'ผู้ดูแลระบบได้ถูกเพิ่มเข้ามาแล้ว',
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
            // เคลียร์ช่องค้นหา
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
            }

            // ดึงข้อมูลผู้ใช้ใหม่
            await fetchAndRenderUsers();
            
            Swal.fire({
                icon: 'info',
                title: 'ยกเลิกการเพิ่มผู้ดูแล',
                text: 'การเพิ่มผู้ดูแลถูกยกเลิกเนื่องจากไม่ได้ตั้ง PIN',
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

// ... existing code ...
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

// เพิ่ม event listener ให้กับปุ่ม Add User
document.getElementById('addUserButton').addEventListener('click', openAddUserModal);
