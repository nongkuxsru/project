window.onload = () => {
    document.getElementById('logoutButton').addEventListener('click', logout);
};

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
    initializeUserInfo();
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
        const response = await fetch('/api/admin/promise-status/pending');
        if (!response.ok) {
            throw new Error('ไม่สามารถดึงข้อมูลคำขอกู้ได้');
        }
        allLoanApplications = await response.json();
        renderLoanApplications(allLoanApplications);
    } catch (error) {
        console.error('Error fetching loan applications:', error);
        showError('ไม่สามารถดึงข้อมูลคำขอกู้ได้ กรุณาลองใหม่อีกครั้ง');
    }
};

const renderLoanApplications = (applications) => {
    const tbody = document.querySelector('#loanApplicationsTable tbody');
    tbody.innerHTML = '';

    if (!applications || applications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">ไม่พบรายการที่รออนุมัติ</td></tr>';
        return;
    }

    applications.forEach(app => {
        const row = tbody.insertRow();
        
        // วันที่
        const dateCell = row.insertCell();
        dateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
        const date = new Date(app.Datepromise);
        dateCell.textContent = date.toLocaleDateString('th-TH');

        // รหัสบัญชี
        const accountCell = row.insertCell();
        accountCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
        accountCell.textContent = app.id_saving;

        // จำนวนเงิน
        const amountCell = row.insertCell();
        amountCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
        amountCell.textContent = new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(app.amount);

        // อัตราดอกเบี้ย
        const interestCell = row.insertCell();
        interestCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
        interestCell.textContent = `${app.interestRate}%`;

        // วันครบกำหนด
        const dueDateCell = row.insertCell();
        dueDateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
        const dueDate = new Date(app.DueDate);
        dueDateCell.textContent = dueDate.toLocaleDateString('th-TH');

        // การดำเนินการ
        const actionCell = row.insertCell();
        actionCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
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
    });
};

// ===============================
// Loan Details Functions
// ===============================
const viewLoanDetails = async (loanId) => {
    try {
        const response = await fetch(`/api/admin/loan-applications/${loanId}`);
        if (!response.ok) {
            throw new Error('ไม่สามารถดึงข้อมูลรายละเอียดคำขอกู้ได้');
        }
        const loanDetails = await response.json();
        currentLoanId = loanId;

        displayLoanDetails(loanDetails);
        document.getElementById('viewDetailsModal').style.display = 'flex';
    } catch (error) {
        console.error('Error fetching loan details:', error);
        showError('ไม่สามารถดึงข้อมูลรายละเอียดคำขอกู้ได้');
    }
};

const displayLoanDetails = (loanDetails) => {
    // แสดงข้อมูลในโมดัล
    document.getElementById('borrowerName').textContent = loanDetails.borrowerName;
    document.getElementById('borrowerId').textContent = loanDetails.borrowerId;
    document.getElementById('borrowerAddress').textContent = loanDetails.address;
    document.getElementById('borrowerPhone').textContent = loanDetails.phone;
    document.getElementById('loanAmount').textContent = new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB'
    }).format(loanDetails.loanAmount);
    document.getElementById('loanTerm').textContent = `${loanDetails.loanTerm} เดือน`;
    document.getElementById('interestRate').textContent = `${loanDetails.interestRate}%`;
    document.getElementById('monthlyPayment').textContent = new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB'
    }).format(loanDetails.monthlyPayment);

    displayAttachedDocuments(loanDetails.documents);
    updateActionButtons(loanDetails.status);
};n

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
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            showError('กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
            window.location.href = '/';
            return;
        }

        const response = await fetch('/api/admin/verify-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
        });

        const result = await response.json();
        if (result.verified) {
            const action = pinModal.dataset.action;
            const reason = pinModal.dataset.reason;

            pinModal.classList.add('hidden');
            
            if (action === 'approve') {
                await approvePromise();
            } else if (action === 'reject') {
                await rejectPromise(reason);
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
        if (!currentUser || !currentUser._id) {
            throw new Error('ข้อมูลผู้ใช้ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่');
        }

        const response = await fetch(`/api/admin/promise-status/${currentLoanId}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId: currentUser._id })
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

const rejectPromise = async (reason) => {
    try {
        if (!currentLoanId) {
            throw new Error('ไม่พบข้อมูลสัญญาที่ต้องการปฏิเสธ');
        }

        const currentUserStr = localStorage.getItem('currentUser');
        if (!currentUserStr) {
            throw new Error('กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
        }

        const currentUser = JSON.parse(currentUserStr);
        if (!currentUser || !currentUser._id) {
            throw new Error('ข้อมูลผู้ใช้ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่');
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
        showError(error.message);
        if (error.message.includes('เข้าสู่ระบบ')) {
            window.location.href = '/';
        }
    }
};

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
// User Management Functions
// ===============================
const initializeUserInfo = () => {
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
};

const logout = async () => {
    try {
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
        showError('ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง');
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
