// ===============================
// Constants & Global Variables
// ===============================
let allLoanApplications = [];
let currentLoanId = null;
let currentAction = null;
let currentPaymentId = null;
let currentReason = null;

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
    fetchAndRenderLoanApplications();
    initializeEventListeners();
    initializeModal();

    // เริ่มการสังเกตการณ์ DOM สำหรับ Sidebar
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// ===============================
// Loan Management Functions
// ===============================
const fetchAndRenderLoanApplications = async () => {
    try {
        const statusFilter = document.getElementById('statusFilter').value;
        let endpoint = '/api/admin/promise-status';
        
        if (statusFilter !== 'all') {
            endpoint += `?status=${statusFilter}`;
        }

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // ตรวจสอบโครงสร้างข้อมูลที่ได้รับ
        if (!data.success) {
            throw new Error(data.message || 'ไม่สามารถดึงข้อมูลคำขอกู้ได้');
        }

        if (!Array.isArray(data.promises)) {
            throw new Error('ข้อมูลที่ได้รับไม่ถูกต้อง');
        }

        // ตรวจสอบและจัดการข้อมูลที่ขาดหาย
        const validatedPromises = data.promises.map(promise => ({
            _id: promise._id,
            id_saving: promise.id_saving || 'ไม่ระบุ',
            borrowerName: promise.borrowerName || 'ไม่ระบุชื่อ',
            Datepromise: promise.Datepromise || new Date(),
            amount: promise.amount || 0,
            interestRate: promise.interestRate || 0,
            DueDate: promise.DueDate || new Date(),
            totalPaid: promise.totalPaid || 0,
            payments: promise.payments || {},
            status: promise.status || 'pending'
        }));

        allLoanApplications = validatedPromises;
        renderLoanApplications(validatedPromises);
    } catch (error) {
        console.error('Error fetching loan applications:', error);
        showError(error.message || 'ไม่สามารถดึงข้อมูลคำขอกู้ได้ กรุณาลองใหม่อีกครั้ง');
        
        // แสดงข้อความว่าไม่พบข้อมูลในตาราง
        const tbody = document.querySelector('#loanApplicationsTable tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-red-500">
                        <i class="fas fa-exclamation-circle mr-2"></i>
                        ${error.message || 'ไม่สามารถดึงข้อมูลได้'}
                    </td>
                </tr>
            `;
        }
    }
};

const renderLoanApplications = (applications) => {
    const tbody = document.querySelector('#loanApplicationsTable tbody');
    tbody.innerHTML = '';

    if (!applications || applications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">ไม่พบรายการ</td></tr>';
        return;
    }

    applications.forEach(app => {
        const row = tbody.insertRow();
        
        // วันที่ทำสัญญา
        const dateCell = row.insertCell();
        dateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
        const date = new Date(app.Datepromise);
        dateCell.textContent = date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // จำนวนเงิน
        const amountCell = row.insertCell();
        amountCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
        amountCell.textContent = new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(app.amount || 0);

        // ระยะเวลา (คำนวณจากวันที่ทำสัญญาถึงวันครบกำหนด)
        const termCell = row.insertCell();
        termCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
        const dueDate = new Date(app.DueDate);
        const months = Math.round((dueDate - date) / (30 * 24 * 60 * 60 * 1000));
        termCell.textContent = `${months} เดือน`;

        // สถานะ
        const statusCell = row.insertCell();
        statusCell.className = 'px-6 py-4 whitespace-nowrap text-sm';
        const statusBadge = getStatusBadge(app.status);
        statusCell.innerHTML = statusBadge;

        // การดำเนินการ
        const actionCell = row.insertCell();
        actionCell.className = 'px-6 py-4 whitespace-nowrap text-center text-sm font-medium';
        
        if (app.status === 'pending') {
            actionCell.innerHTML = `
                <button onclick="handleApprove('${app._id}')" 
                        class="text-green-600 hover:text-green-900 mr-3">
                    <i class="fas fa-check-circle mr-1"></i>อนุมัติ
                </button>
                <button onclick="handleReject('${app._id}')"
                        class="text-red-600 hover:text-red-900">
                    <i class="fas fa-times-circle mr-1"></i>ปฏิเสธ
                </button>
            `;
        } else {
            actionCell.innerHTML = `
                <button onclick="viewLoanDetails('${app._id}')"
                        class="text-blue-600 hover:text-blue-900">
                    <i class="fas fa-eye mr-1"></i>ดูรายละเอียด
                </button>
            `;
        }
    });
};

const getStatusBadge = (status) => {
    const badges = {
        pending: '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">รอการอนุมัติ</span>',
        approved: '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">อนุมัติแล้ว</span>',
        rejected: '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">ปฏิเสธ</span>'
    };
    return badges[status] || '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">ไม่ระบุ</span>';
};

// ===============================
// Loan Details Functions
// ===============================
const viewLoanDetails = async (loanId) => {
    try {
        const response = await fetch(`/api/admin/promise-status/${loanId}/details`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('ไม่สามารถดึงข้อมูลรายละเอียดคำขอกู้ได้');
        }
        
        const loanDetails = await response.json();
        if (!loanDetails.success) {
            throw new Error(loanDetails.message || 'ไม่สามารถดึงข้อมูลรายละเอียดคำขอกู้ได้');
        }
        
        currentLoanId = loanId;
        displayLoanDetails(loanDetails.data);
        document.getElementById('viewDetailsModal').style.display = 'flex';
    } catch (error) {
        console.error('Error fetching loan details:', error);
        showError('ไม่สามารถดึงข้อมูลรายละเอียดคำขอกู้ได้');
    }
};

const displayLoanDetails = (loanDetails) => {
    // แสดงข้อมูลผู้กู้
    const borrower = loanDetails.saving?.id_member || {};
    document.getElementById('borrowerName').textContent = borrower.name || 'ไม่ระบุ';
    document.getElementById('borrowerAddress').textContent = borrower.address || 'ไม่ระบุ';
    document.getElementById('borrowerPhone').textContent = borrower.phone || 'ไม่ระบุ';

    // แสดงข้อมูลสัญญา
    document.getElementById('loanAmount').textContent = new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB'
    }).format(loanDetails.amount || 0);

    // คำนวณระยะเวลาผ่อนชำระเป็นเดือน
    const startDate = new Date(loanDetails.Datepromise);
    const endDate = new Date(loanDetails.DueDate);
    const months = Math.round((endDate - startDate) / (30 * 24 * 60 * 60 * 1000));
    document.getElementById('loanTerm').textContent = `${months} เดือน`;

    document.getElementById('interestRate').textContent = `${loanDetails.interestRate || 0}%`;

    // อัปเดตปุ่มดำเนินการ
    updateActionButtons(loanDetails.status || 'pending');
};

// ===============================
// Document Management Functions
// ===============================
const displayAttachedDocuments = (documents) => {
    const documentsContainer = document.getElementById('attachedDocuments');
    documentsContainer.innerHTML = '';
    
    documents.forEach(doc => {
        const docElement = document.createElement('div');
        docElement.className = 'flex items-center justify-between bg-gray-50 p-3 rounded-lg';
        docElement.innerHTML = `
            <span class="flex items-center">
                <i class="fas fa-file-pdf text-red-500 mr-2"></i>
                ${doc.name}
            </span>
            <button onclick="viewDocument('${doc.url}')" class="text-blue-600 hover:text-blue-800">
                <i class="fas fa-external-link-alt"></i>
            </button>
        `;
        documentsContainer.appendChild(docElement);
    });
};

const viewDocument = (url) => {
    window.open(url, '_blank');
};

// ===============================
// Approval/Rejection Functions
// ===============================
const handleApprove = async (loanId) => {
    if (!loanId) {
        showError('ไม่พบข้อมูลสัญญาที่ต้องการอนุมัติ');
        return;
    }
    currentLoanId = loanId;
    showPinModal('approve');
};

const handleReject = async (loanId) => {
    if (!loanId) {
        showError('ไม่พบข้อมูลสัญญาที่ต้องการปฏิเสธ');
        return;
    }
    currentLoanId = loanId;
    
    const { value: reason } = await Swal.fire({
        title: 'ระบุเหตุผลในการปฏิเสธ',
        input: 'text',
        inputLabel: 'เหตุผล',
        inputPlaceholder: 'กรุณาระบุเหตุผล',
        showCancelButton: true,
        cancelButtonText: 'ยกเลิก',
        confirmButtonText: 'ยืนยัน',
        inputValidator: (value) => {
            if (!value) {
                return 'กรุณาระบุเหตุผลในการปฏิเสธ';
            }
        }
    });

    if (reason) {
        showPinModal('reject', reason);
    }
};

// ===============================
// PIN Verification Functions
// ===============================
const showPinModal = (action, reason = '') => {
    const pinModal = document.getElementById('pinModal');
    const pinInput = document.getElementById('pinInput');
    
    if (pinModal && pinInput) {
        pinModal.dataset.action = action;
        pinModal.dataset.reason = reason;
        pinModal.classList.remove('hidden');
        pinInput.value = '';
        pinInput.focus();
    }
};

const closePinModal = () => {
    const pinModal = document.getElementById('pinModal');
    if (pinModal) {
        pinModal.classList.add('hidden');
        pinModal.dataset.action = '';
        pinModal.dataset.reason = '';
        currentLoanId = null;
    }
};

const verifyPin = async () => {
    const pinInput = document.getElementById('pinInput');
    const pinModal = document.getElementById('pinModal');
    if (!pinInput || !pinModal) return;

    const pin = pinInput.value;
    if (!pin || pin.length !== 4) {
        showError('กรุณากรอกรหัส PIN 4 หลัก');
        return;
    }

    try {
        const currentUserStr = localStorage.getItem('currentUser');
        if (!currentUserStr) {
            showError('กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
            window.location.href = '/';
            return;
        }

        const currentUser = JSON.parse(currentUserStr);
        const response = await fetch('/api/admin/verify-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                pin,
                userId: currentUser._id 
            })
        });

        const result = await response.json();
        if (result.verified) {
            const action = pinModal.dataset.action;
            const reason = pinModal.dataset.reason;

            pinModal.classList.add('hidden');
            
            if (action === 'approve') {
                await approvePromise(currentUser);
            } else if (action === 'reject') {
                await rejectPromise(reason, currentUser);
            }

            currentLoanId = null;
            pinModal.dataset.action = '';
            pinModal.dataset.reason = '';
        } else {
            showError('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        }
    } catch (error) {
        console.error('Error verifying PIN:', error);
        showError('ไม่สามารถตรวจสอบรหัส PIN ได้');
    }
};

// ===============================
// Promise Management Functions
// ===============================
const approvePromise = async () => {
    try {
        if (!currentLoanId) {
            throw new Error('ไม่พบข้อมูลสัญญาที่ต้องการอนุมัติ');
        }

        const currentUserStr = localStorage.getItem('currentUser');
        if (!currentUserStr) {
            throw new Error('กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
        }

        const currentUser = JSON.parse(currentUserStr);
        if (!currentUser || !currentUser._id || currentUser.permission !== 'director') {
            throw new Error('ไม่มีสิทธิ์ในการอนุมัติสัญญา');
        }

        const response = await fetch(`/api/admin/promise-status/${currentLoanId}/approve`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Add authentication token
            },
            body: JSON.stringify({ 
                adminId: currentUser._id,
                role: currentUser.permission // Add role information
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'ไม่สามารถอนุมัติสัญญาได้');
        }

        const result = await response.json();
        showSuccess(result.message);
        await fetchAndRenderLoanApplications();
    } catch (error) {
        console.error('Error approving loan promise:', error);
        showError(error.message);
        if (error.message.includes('เข้าสู่ระบบ')) {
            window.location.href = '/';
        }
    }
};

const rejectPromise = async (reason, currentUser) => {
    try {
        if (!currentLoanId) {
            throw new Error('ไม่พบข้อมูลสัญญาที่ต้องการปฏิเสธ');
        }

        if (!currentUser || !currentUser._id) {
            throw new Error('กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
        }

        const response = await fetch(`/api/admin/promise-status/${currentLoanId}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adminId: currentUser._id,
                reason: reason
            })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'ไม่สามารถปฏิเสธสัญญาได้');
        }
        const result = await response.json();
        showSuccess(result.message);
        await fetchAndRenderLoanApplications();
    } catch (error) {
        console.error('Error rejecting loan promise:', error);
    }
}

    // ... rest of the code remains the same

// ===============================
// Modal Management Functions
// ===============================
const initializeModal = () => {
    const modal = document.getElementById('viewDetailsModal');
    const closeBtn = modal.querySelector('.close');

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    modal.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    document.getElementById('approveBtn').onclick = () => handleApprove(currentLoanId);
    document.getElementById('rejectBtn').onclick = () => handleReject(currentLoanId);
};

const updateActionButtons = (status) => {
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    
    if (status === 'pending') {
        approveBtn.style.display = 'block';
        rejectBtn.style.display = 'block';
    } else {
        approveBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
    }
};

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
// Event Listeners Functions
// ===============================
const initializeEventListeners = () => {
    const pinModal = document.getElementById('pinModal');
    if (pinModal) {
        const closeButton = pinModal.querySelector('button[onclick="closePinModal()"]');
        const verifyButton = pinModal.querySelector('button[onclick="verifyPin()"]');
        
        if (closeButton) {
            closeButton.onclick = closePinModal;
        }
        if (verifyButton) {
            verifyButton.onclick = verifyPin;
        }
    }

    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.onclick = fetchAndRenderLoanApplications;
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        searchInput.autocomplete = 'off';
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', fetchAndRenderLoanApplications);
    }

};

// ===============================
// Utility Functions
// ===============================
const showError = (message) => {
    Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: message
    });
};

const showSuccess = (message) => {
    Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: message
    });
};

const refreshTransactions = () => {
    fetchPendingTransactions();
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
