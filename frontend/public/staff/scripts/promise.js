// =============================================
// Utility Functions
// =============================================

// ฟังก์ชันดึงชื่อผู้ใช้จาก API
const fetchUserName = async (userId) => {
    try {
        const response = await fetch(`/api/admin/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user data');
        const userData = await response.json();
        return userData.name || 'Unknown';
    } catch (error) {
        console.error('Error fetching user name:', error);
        return 'Unknown';
    }
};

// ฟังก์ชันสำหรับ Toggle Sidebar
const toggleSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('collapsed');
};

// =============================================
// Promise Management Functions
// =============================================

// ฟังก์ชันสำหรับดึงข้อมูลบัญชีสัญญากู้ยืม
const fetchPromise = async () => {
    try {
        const response = await fetch('/api/staff/promise');
        const data = await response.json();

        const tableBody = document.getElementById('promiseTableBody');
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">No loan promises available.</td></tr>';
            return;
        }

        data.forEach(account => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${account._id}</td>
                <td>${account.id_saving}</td>
                <td>${account.amount}</td>
                <td>${account.id_saving}</td>
                <td>${new Date(account.Datepromise).toLocaleDateString()}</td>
                <td>${new Date(account.DueDate).toLocaleDateString()}</td>
                <td><button onclick="openPromiseDetailsModal('${account._id}')" class="viewDetailsButton">
                    <i class="fas fa-eye"></i> View Details
                </button></td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching loan promise data:', error);
        const tableBody = document.getElementById('promiseTableBody');
        tableBody.innerHTML = '<tr><td colspan="7">Failed to load data.</td></tr>';
    }
};

// =============================================
// Modal Management Functions
// =============================================

// ฟังก์ชันสำหรับเปิด modal แสดงรายละเอียด
const openPromiseDetailsModal = async (promiseId) => {
    try {
        const response = await fetch(`/api/staff/promise/${promiseId}`);
        const promiseDetails = await response.json();

        const modal = document.getElementById('promiseDetailsModal');
        const modalContent = document.getElementById('promiseDetailsContent');
        
        modalContent.innerHTML = `
            <h2>รายละเอียดสัญญากู้ยืม</h2>
            <p><strong>รหัสสัญญา:</strong> ${promiseDetails._id}</p>
            <p><strong>รหัสสมาชิก:</strong> ${promiseDetails.id_saving}</p>
            <p><strong>จำนวนเงิน:</strong> ${promiseDetails.amount} บาท</p>
            <p><strong>วันที่ทำสัญญา:</strong> ${new Date(promiseDetails.Datepromise).toLocaleDateString()}</p>
            <p><strong>วันครบกำหนด:</strong> ${new Date(promiseDetails.DueDate).toLocaleDateString()}</p>
            <button onclick="closePromiseDetailsModal()" class="closeButton">ปิด</button>
        `;

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching promise details:', error);
        alert('ไม่สามารถดึงข้อมูลรายละเอียดสัญญาได้');
    }
};

// ฟังก์ชันสำหรับปิด modal
const closePromiseDetailsModal = () => {
    const modal = document.getElementById('promiseDetailsModal');
    modal.style.display = 'none';
};

// ฟังก์ชันสำหรับเปิด modal และสร้างสัญญาเงินกู้
const openCreatePromiseModal = async () => {
    const modal = document.getElementById('createPromiseModal');
    const form = document.getElementById('createPromiseForm');
    const memberSelect = document.getElementById('memberName');

    try {
        // ดึงข้อมูลบัญชีออมทรัพย์ทั้งหมด
        const savingResponse = await fetch('/api/staff/saving');
        if (!savingResponse.ok) throw new Error('Failed to fetch saving accounts');
        const savingAccounts = await savingResponse.json();

        // ล้างตัวเลือกเก่าและเพิ่มตัวเลือกเริ่มต้น
        memberSelect.innerHTML = '<option value="">-- เลือกสมาชิก --</option>';

        // สร้าง options สำหรับแต่ละบัญชี
        for (const account of savingAccounts) {
            // ดึงข้อมูลชื่อสมาชิกจาก API
            const memberName = await fetchUserName(account.id_member);
            
            const option = document.createElement('option');
            option.value = account.id_account;
            option.textContent = `${memberName}`;
            option.dataset.balance = account.balance;
            option.dataset.status = account.status;
            memberSelect.appendChild(option);
        }

        // เพิ่ม event listener สำหรับการเปลี่ยนแปลงการเลือกสมาชิก
        memberSelect.addEventListener('change', () => {
            const selectedOption = memberSelect.options[memberSelect.selectedIndex];
            if (selectedOption.value) {
                document.getElementById('memberId').value = selectedOption.value;
                document.getElementById('savingBalance').value = selectedOption.dataset.balance || '0.00';
                document.getElementById('savingStatus').value = selectedOption.dataset.status || 'ไม่ระบุ';
            } else {
                document.getElementById('memberId').value = '';
                document.getElementById('savingBalance').value = '0.00';
                document.getElementById('savingStatus').value = '';
            }
        });

        modal.style.display = 'block';
        handleCreatePromiseForm(form, modal);
    } catch (error) {
        console.error('Error fetching members:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถดึงข้อมูลสมาชิกได้'
        });
    }
};

// ฟังก์ชันจัดการการส่งฟอร์มสร้างสัญญา
const handleCreatePromiseForm = (form, modal) => {
    form.onsubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = validateAndGetFormData();
            await createNewPromise(formData);
            await handleSuccessfulCreation(modal, form);
        } catch (error) {
            handlePromiseCreationError(error);
        }
    };
};

// ฟังก์ชันสำหรับยกเลิกการสร้างสัญญา
const cancelPromiseCreation = () => {
    Swal.fire({
        title: 'ยืนยันการยกเลิก?',
        text: "คุณต้องการยกเลิกการสร้างสัญญาใช่หรือไม่?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ยกเลิก',
        cancelButtonText: 'ไม่, กลับไปทำต่อ'
    }).then((result) => {
        if (result.isConfirmed) {
            const modal = document.getElementById('createPromiseModal');
            const form = document.getElementById('createPromiseForm');
            modal.style.display = 'none';
            form.reset();
        }
    });
};

// ปรับปรุง Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...
    
    // เพิ่ม Event Listener สำหรับปุ่มยกเลิก
    document.getElementById('cancelPromise').addEventListener('click', cancelPromiseCreation);
});

// ... existing code ...

// =============================================
// Form Handling Helper Functions
// =============================================

// ฟังก์ชันตรวจสอบและดึงข้อมูลจากฟอร์ม
const validateAndGetFormData = () => {
    const memberId = document.getElementById('memberId').value;
    const savingBalance = parseFloat(document.getElementById('savingBalance').value);
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const savingStatus = document.getElementById('savingStatus').value;

    if (savingStatus !== 'active') {
        throw new Error('บัญชีออมทรัพย์ไม่อยู่ในสถานะที่ใช้งานได้');
    }

    if (loanAmount > savingBalance) {
        throw new Error('จำนวนเงินที่ขอกู้เกินกว่ายอดเงินในบัญชีออมทรัพย์');
    }

    return {
        id_saving: memberId,
        amount: loanAmount,
        Datepromise: document.getElementById('promiseDate').value,
        DueDate: document.getElementById('dueDate').value
    };
};

// ฟังก์ชันสร้างสัญญาใหม่
const createNewPromise = async (promiseData) => {
    const response = await fetch('/api/staff/promise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promiseData)
    });

    if (!response.ok) {
        throw new Error('Failed to create loan promise');
    }
};

// ฟังก์ชันจัดการเมื่อสร้างสัญญาสำเร็จ
const handleSuccessfulCreation = async (modal, form) => {
    await Swal.fire({
        icon: 'success',
        title: 'สร้างสัญญาเงินกู้สำเร็จ',
        text: 'ระบบได้บันทึกข้อมูลสัญญาเรียบร้อยแล้ว',
        timer: 2000,
        showConfirmButton: false
    });
    await fetchPromise();
    modal.style.display = 'none';
    form.reset();
};

// ฟังก์ชันจัดการข้อผิดพลาดในการสร้างสัญญา
const handlePromiseCreationError = (error) => {
    console.error('Error creating loan promise:', error);
    Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถสร้างสัญญาเงินกู้ได้ กรุณาลองใหม่อีกครั้ง'
    });
};

// =============================================
// Authentication Functions
// =============================================

// ฟังก์ชันสำหรับ Logout
const logout = async () => {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            localStorage.removeItem("currentUser");
            localStorage.removeItem("selectedTheme");

            await Swal.fire({
                icon: 'success',
                title: 'Logout successful!',
                text: 'You have been logged out. Redirecting to login page...',
                timer: 1000,
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

// =============================================
// Event Listeners
// =============================================

// Event Listeners เมื่อโหลดหน้าเว็บ
document.addEventListener("DOMContentLoaded", () => {
    // ดึงข้อมูลผู้ใช้และแสดงผล
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        const userName = user.name || 'ผู้ใช้ไม่ระบุ';
        const userAvatar = user.avatar || userName.charAt(0).toUpperCase();
        document.getElementById('userName').textContent = 'ยินดีต้อนรับ ' + userName;
        document.getElementById('userAvatar').textContent = userAvatar;
    } else {
        document.getElementById('userName').textContent = 'ไม่พบข้อมูลผู้ใช้';
        document.getElementById('userAvatar').textContent = 'N/A';
    }

    // เพิ่ม Event Listeners
    document.getElementById('createPromiseButton').addEventListener('click', openCreatePromiseModal);
    document.getElementById('logoutButton').addEventListener('click', logout);
    document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
    
    // ดึงข้อมูลสัญญาเมื่อโหลดหน้า
    fetchPromise();
});

// Event Listener สำหรับการคลิกนอก modal
window.onclick = (event) => {
    const modal = document.getElementById('promiseDetailsModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// ... existing code ...

// ฟังก์ชันสำหรับปิด modal
const closeModal = () => {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
};

// เพิ่ม Event Listener สำหรับการคลิกพื้นที่ว่างเพื่อปิด modal
window.onclick = (event) => {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...

    // เพิ่ม Event Listener สำหรับปุ่มยกเลิกทั้งหมด
    const cancelButtons = document.querySelectorAll('.cancelButton');
    cancelButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });
});

// ... existing code ...