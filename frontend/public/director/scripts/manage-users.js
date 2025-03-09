// ===============================
// Constants & Global Variables
// ===============================
let allUsers = []; // เก็บข้อมูลผู้ใช้ทั้งหมด
let currentPage = 1;
const rowsPerPage = 8;
let totalPages = 1;

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

// ===============================
// Event Listeners & Initialization
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    // เริ่มต้นการทำงานหลัก
    fetchAndRenderUsers();
    
    // เริ่มการสังเกตการณ์ DOM
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Event Listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const debouncedFilter = debounce(filterUsers, 300);
        searchInput.addEventListener('input', debouncedFilter);
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    const addUserButton = document.getElementById('addUserButton');
    if (addUserButton) {
        addUserButton.addEventListener('click', openAddUserModal);
    }
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

const fetchAndRenderUsers = async () => {
    try {
        const response = await fetch('/api/admin/users');
        allUsers = await response.json();

        // ตรวจสอบสิทธิ์ของผู้ใช้ปัจจุบัน
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser && currentUser.permission === 'director') {
            // กรองให้แสดงเฉพาะ staff และ member
            allUsers = allUsers.filter(user => 
                user.permission === 'staff' || user.permission === 'member'
            );
        }

        renderUsers(allUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        showError('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
    }
};

const renderUsers = (users) => {
    const tableBody = document.querySelector('#usersTable tbody');
    if (!tableBody) return;

    // คำนวณ index เริ่มต้นและสิ้นสุดสำหรับหน้าปัจจุบัน
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const usersToShow = users.slice(startIndex, endIndex);

    // คำนวณจำนวนหน้าทั้งหมด
    totalPages = Math.ceil(users.length / rowsPerPage);

    tableBody.innerHTML = '';
    
    if (usersToShow.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">ไม่พบข้อมูลผู้ใช้</td>
            </tr>
        `;
        return;
    }

    usersToShow.forEach(user => {
        // ข้ามการแสดงผู้ใช้ที่มีสิทธิ์ admin
        if (user.permission === 'admin') return;

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        // ชื่อผู้ใช้
        const nameCell = row.insertCell();
        nameCell.className = 'border px-4 py-2';
        nameCell.textContent = user.name;

        // อีเมล
        const emailCell = row.insertCell();
        emailCell.className = 'border px-4 py-2';
        emailCell.textContent = user.email;
        
        // สิทธิ์ผู้ใช้
        const permissionCell = row.insertCell();
        permissionCell.className = 'border px-4 py-2';
        permissionCell.innerHTML = getPermissionBadgeHTML(user.permission);

        // ปุ่มดำเนินการ
        const actionsCell = row.insertCell();
        actionsCell.className = 'border px-4 py-2';
        actionsCell.appendChild(createActionButtons(user));

        tableBody.appendChild(row);
    });

    addActionButtonListeners();
    renderPagination();
};

const getPermissionBadgeHTML = (permission) => {
    const badges = {
        director: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'ผู้อำนวยการ' },
        staff: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'เจ้าหน้าที่' },
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

const createActionButtons = (user) => {
    const actionWrapper = document.createElement('div');
    actionWrapper.className = 'flex items-center justify-end space-x-2 min-w-[200px]';
    
    let buttonsHTML = '';
    
    // ตรวจสอบสิทธิ์ของผู้ใช้ปัจจุบัน
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    // ปุ่มแก้ไขและลบ
    buttonsHTML += `
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
    
    actionWrapper.innerHTML = buttonsHTML;
    return actionWrapper;
};

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
    document.querySelectorAll('.update-password-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            openUpdatePasswordModal(button.getAttribute('data-user-id'));
        });
    });
};


// ===============================
// User CRUD Operations
// ===============================
const editUser = async (userId) => {
    const user = allUsers.find(u => u._id === userId);
    if (user) {
        await openEditModal(user);
    } else {
        showError('ไม่พบข้อมูลผู้ใช้');
    }
};

const deleteUser = async (userId) => {
const result = await showConfirm(
    'ยืนยันการลบผู้ใช้',
    'คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้? การกระทำนี้ไม่สามารถย้อนกลับได้'
);

if (!result.isConfirmed) return;

try {
    const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'ไม่สามารถลบผู้ใช้ได้');
    }

    // ลบข้อมูลบัญชีออมทรัพย์
    const savingResponse = await fetch(`/api/staff/saving/${userId}`, { method: 'DELETE' });
    if (!savingResponse.ok) {
        const errorData = await savingResponse.text();
        throw new Error(errorData || 'ไม่สามารถลบข้อมูลบัญชีออมทรัพย์ได้');
    }

    await fetchAndRenderUsers();
    showSuccess('ลบผู้ใช้สำเร็จ', 'ผู้ใช้ถูกลบออกจากระบบเรียบร้อยแล้ว');
} catch (error) {
    console.error('Error deleting user:', error);
    showError(error.message || 'ไม่สามารถลบผู้ใช้ได้ กรุณาลองใหม่');
}
};

// ===============================
// Modal Management Functions
// ===============================
const openEditModal = async (user) => {
    const modal = document.getElementById('editUserModal');
    const form = document.getElementById('editUserForm');

    if (!modal || !form) {
        console.error('Modal หรือฟอร์มหาไม่พบ');
        return;
    }

    try {
        const response = await fetch(`/api/admin/users/${user._id}`);
        if (!response.ok) {
            throw new Error(`ไม่สามารถดึงข้อมูลผู้ใช้ได้: ${response.status}`);
        }
        const userData = await response.json();

        populateEditForm(userData);
        showModal(modal);
        setupEditFormListeners(modal, form, user._id);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
        showError('ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่');
    }
};

// แก้ไขฟังก์ชัน openAddUserModal เพื่อจำกัดสิทธิ์ที่สามารถเพิ่มได้
const openAddUserModal = () => {
    const modal = document.getElementById('addUserModal');
    const form = document.getElementById('addUserForm');

    if (!modal || !form) {
        console.error('Modal หรือฟอร์มหาไม่พบ');
        return;
    }

    // เพิ่มตัวเลือกสิทธิ์ผู้ใช้ในฟอร์มเพิ่มผู้ใช้
    const permissionSelect = document.getElementById('addPermission');
    if (permissionSelect) {
        // ตรวจสอบสิทธิ์ของผู้ใช้ปัจจุบัน
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser && currentUser.permission === 'director') {
            // director สามารถเพิ่มได้เฉพาะ staff และ member
            permissionSelect.innerHTML = `
                <option value="member">สมาชิก</option>
                <option value="staff">เจ้าหน้าที่</option>
            `;
        } else {
            // admin สามารถเพิ่มได้ทุกสิทธิ์
            permissionSelect.innerHTML = `
                <option value="member">สมาชิก</option>
                <option value="staff">เจ้าหน้าที่</option>
                <option value="director">ผู้อำนวยการ</option>
                <option value="admin">ผู้ดูแลระบบ</option>
            `;
        }
    }

    showModal(modal);
    setupAddFormListeners(modal, form);
};

// ===============================
// Form Handling Functions
// ===============================
const populateEditForm = (userData) => {
    document.getElementById('editName').value = userData.name || '';
    document.getElementById('editEmail').value = userData.email || '';
    document.getElementById('editAddress').value = userData.address || '';
    document.getElementById('editPhone').value = userData.phone || '';
    document.getElementById('editBirthday').value = convertToThaiBuddhistDate(userData.birthday);
    document.getElementById('editPermission').value = userData.permission || 'user';
};

const setupEditFormListeners = (modal, form, userId) => {
    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    // Modal closing events
    modal.querySelector('.close').onclick = closeModal;
    modal.onclick = (event) => {
        if (event.target === modal || event.target.classList.contains('min-h-screen')) {
            closeModal();
        }
    };

    // Form submission
    form.onsubmit = async (e) => {
        e.preventDefault();
        await handleEditFormSubmit(form, userId, closeModal);
    };
};

const setupAddFormListeners = (modal, form) => {
    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    // Modal closing events
    modal.querySelector('.close').onclick = closeModal;
    modal.onclick = (event) => {
        if (event.target === modal || event.target.classList.contains('min-h-screen')) {
            closeModal();
        }
    };

    // Form submission
    form.onsubmit = async (e) => {
        e.preventDefault();
        await handleAddFormSubmit(form, closeModal);
    };
};

// ===============================
// PIN Management Functions
// ===============================
const resetPin = async (userId) => {
    const { value: pin } = await showPinPrompt('รีเซ็ต PIN', 'กรุณากรอก PIN ใหม่ 4 หลัก');
    if (!pin) return;

    try {
        const response = await fetch(`/api/admin/users/${userId}/pin`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
        });

        if (!response.ok) {
            throw new Error('ไม่สามารถรีเซ็ต PIN ได้');
        }

        clearSearchAndRefresh();
        showSuccess('รีเซ็ต PIN สำเร็จ', 'PIN ได้ถูกเปลี่ยนเรียบร้อยแล้ว');
    } catch (error) {
        console.error('Error resetting PIN:', error);
        showError('ไม่สามารถรีเซ็ต PIN ได้ กรุณาลองใหม่');
    }
};

// ===============================
// Utility Functions
// ===============================
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

const filterUsers = () => {
    const searchText = document.getElementById('searchInput').value.toLowerCase();

    const filteredUsers = allUsers.filter(user => {
        return (user.name?.toLowerCase() || '').includes(searchText) || 
               (user.email?.toLowerCase() || '').includes(searchText) ||
               (user.phone?.toLowerCase() || '').includes(searchText);
    });

    currentPage = 1; // รีเซ็ตกลับไปหน้าแรกเมื่อมีการค้นหา
    renderUsers(filteredUsers);
};

const convertToGregorianDate = (buddhistDate) => {
    if (!buddhistDate) return '';
    const dateParts = buddhistDate.split('-');
    const yearAD = parseInt(dateParts[0]) - 543;
    return `${yearAD}-${dateParts[1]}-${dateParts[2]}`;
};

const convertToThaiBuddhistDate = (gregorianDate) => {
    if (!gregorianDate) return '';
    const date = new Date(gregorianDate);
    const yearBE = date.getFullYear() + 543;
    return `${yearBE}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

const showModal = (modal) => {
    modal.style.display = 'block';
};

const clearSearchAndRefresh = async () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    await fetchAndRenderUsers();
};

const createSavingAccount = async (userId) => {
    if (!userId) {
        console.error('❌ createSavingAccount: userId is missing');
        return;
    }

    const user = JSON.parse(localStorage.getItem('currentUser'));
    const newSavingAccount = {
        id_account: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        id_member: userId,
        balance: 0,
        id_staff: user?._id || 'unknown_staff_id',
    };

    try {
        const response = await fetch('/api/staff/saving', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSavingAccount),
        });

        if (!response.ok) {
            throw new Error('Failed to create saving account');
        }

        console.log('✅ Saving account created successfully');
    } catch (error) {
        console.error('❌ Error creating saving account:', error);
        throw error;
    }
};

// ===============================
// Alert Functions
// ===============================
const showError = (message) => {
    return Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: message,
        confirmButtonText: 'ตกลง'
    });
};

const showSuccess = (title, text) => {
    return Swal.fire({
        icon: 'success',
        title: title,
        text: text,
        confirmButtonText: 'ตกลง'
    });
};

const showConfirm = (title, text) => {
    return Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
    });
};

const showPinPrompt = (title, text) => {
    return Swal.fire({
        title: title,
        html: `
            <input type="password" 
                id="pin" 
                class="swal2-input" 
                maxlength="4" 
                pattern="\\d{4}"
                inputmode="numeric"
                placeholder="${text}">
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
};

// ฟังก์ชันสร้าง pagination controls
const renderPagination = () => {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = `
        <button id="prevPage" class="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
            <i class="fas fa-chevron-left"></i>
        </button>
        <span class="mx-4 text-gray-600">หน้า ${currentPage} จาก ${totalPages}</span>
        <button id="nextPage" class="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;

    prevButton.addEventListener('click', () => changePage(currentPage - 1));
    nextButton.addEventListener('click', () => changePage(currentPage + 1));
};

// ฟังก์ชันเปลี่ยนหน้า
const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderUsers(allUsers); // ใช้ข้อมูลที่มีอยู่แล้วใน allUsers
    }
};

const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    
    const permission = document.getElementById('addPermission').value;
    
    // ตรวจสอบว่าไม่สามารถเพิ่มผู้ใช้ที่มีสิทธิ์ admin
    if (permission === 'admin') {
        Swal.fire({
            icon: 'error',
            title: 'ไม่สามารถดำเนินการได้',
            text: 'ไม่สามารถเพิ่มผู้ใช้ที่มีสิทธิ์ผู้ดูแลระบบได้',
        });
        return;
    }
    
    const newUser = {
        name: document.getElementById('addName').value,
        email: document.getElementById('addEmail').value,
        password: document.getElementById('addPassword').value,
        address: document.getElementById('addAddress').value,
        phone: document.getElementById('addPhone').value,
        birthday: convertToGregorianDate(document.getElementById('addBirthday').value),
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
        
        // ถ้าเป็นผู้อำนวยการ ให้แสดง modal สำหรับตั้ง PIN
        if (permission === 'director') {
            document.getElementById('addUserModal').style.display = 'none';
            await showSetPinModal(result._id);
        } else {
            document.getElementById('addUserModal').style.display = 'none';
            await fetchAndRenderUsers();
            Swal.fire({
                icon: 'success',
                title: 'เพิ่มผู้ใช้สำเร็จ',
                text: 'ผู้ใช้ได้ถูกเพิ่มเข้ามาแล้ว',
            });
        }
        
        e.target.reset();
    } catch (error) {
        console.error('Error adding user:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถเพิ่มผู้ใช้ได้ กรุณาลองใหม่',
        });
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

// เพิ่มฟังก์ชันสำหรับเปิด modal อัพเดทรหัสผ่าน
const openUpdatePasswordModal = (userId) => {
    const modal = document.getElementById('updatePasswordModal');
    const form = document.getElementById('updatePasswordForm');

    if (!modal || !form) {
        console.error('Modal หรือฟอร์มหาไม่พบ');
        return;
    }

    // แสดง modal
    modal.style.display = 'block';

    // ฟังก์ชันสำหรับปิด modal
    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

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
