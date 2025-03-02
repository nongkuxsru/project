window.onload = () => {
    document.getElementById('logoutButton').addEventListener('click', logout);
};

// ตัวแปรสำหรับเก็บข้อมูลคำขอกู้ทั้งหมด
let allLoanApplications = [];
let currentLoanId = null;

// ตัวแปรสำหรับเก็บข้อมูลการทำงานปัจจุบัน
let currentAction = null;
let currentPaymentId = null;
let currentReason = null;

// เมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', () => {
    initializeUserInfo();
    fetchAndRenderLoanApplications();
    initializeEventListeners();
    initializeModal();
});

// ดึงข้อมูลคำขอกู้และแสดงผล
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
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถดึงข้อมูลคำขอกู้ได้ กรุณาลองใหม่อีกครั้ง'
        });
    }
};

// แสดงข้อมูลคำขอกู้ในตาราง
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

// ฟังก์ชันแสดงรายละเอียดคำขอกู้
const viewLoanDetails = async (loanId) => {
    try {
        const response = await fetch(`/api/admin/loan-applications/${loanId}`);
        if (!response.ok) {
            throw new Error('ไม่สามารถดึงข้อมูลรายละเอียดคำขอกู้ได้');
        }
        const loanDetails = await response.json();
        currentLoanId = loanId;

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

        // แสดงรายการเอกสารแนบ
        const documentsContainer = document.getElementById('attachedDocuments');
        documentsContainer.innerHTML = '';
        loanDetails.documents.forEach(doc => {
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

        // แสดงหรือซ่อนปุ่มตามสถานะ
        const approveBtn = document.getElementById('approveBtn');
        const rejectBtn = document.getElementById('rejectBtn');
        if (loanDetails.status === 'pending') {
            approveBtn.style.display = 'block';
            rejectBtn.style.display = 'block';
        } else {
            approveBtn.style.display = 'none';
            rejectBtn.style.display = 'none';
        }

        // แสดงโมดัล
        document.getElementById('viewDetailsModal').style.display = 'flex';
    } catch (error) {
        console.error('Error fetching loan details:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถดึงข้อมูลรายละเอียดคำขอกู้ได้'
        });
    }
};

// ฟังก์ชันเปิดเอกสารแนบ
const viewDocument = (url) => {
    window.open(url, '_blank');
};

// ฟังก์ชันอนุมัติคำขอกู้
const approveLoan = async () => {
    try {
        const response = await fetch(`/api/admin/loan-applications/${currentLoanId}/approve`, {
            method: 'PUT'
        });

        if (!response.ok) {
            throw new Error('ไม่สามารถอนุมัติคำขอกู้ได้');
        }

        await Swal.fire({
            icon: 'success',
            title: 'อนุมัติสำเร็จ',
            text: 'คำขอกู้ได้รับการอนุมัติแล้ว'
        });

        document.getElementById('viewDetailsModal').style.display = 'none';
        await fetchAndRenderLoanApplications();
    } catch (error) {
        console.error('Error approving loan:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถอนุมัติคำขอกู้ได้'
        });
    }
};

// ฟังก์ชันปฏิเสธคำขอกู้
const rejectLoan = async () => {
    try {
        const { value: reason } = await Swal.fire({
            title: 'ระบุเหตุผลที่ปฏิเสธ',
            input: 'textarea',
            inputPlaceholder: 'กรุณาระบุเหตุผล...',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            inputValidator: (value) => {
                if (!value) {
                    return 'กรุณาระบุเหตุผล';
                }
            }
        });

        if (reason) {
            const response = await fetch(`/api/admin/loan-applications/${currentLoanId}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });

            if (!response.ok) {
                throw new Error('ไม่สามารถปฏิเสธคำขอกู้ได้');
            }

            await Swal.fire({
                icon: 'success',
                title: 'ปฏิเสธสำเร็จ',
                text: 'คำขอกู้ถูกปฏิเสธแล้ว'
            });

            document.getElementById('viewDetailsModal').style.display = 'none';
            await fetchAndRenderLoanApplications();
        }
    } catch (error) {
        console.error('Error rejecting loan:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถปฏิเสธคำขอกู้ได้'
        });
    }
};

// ฟังก์ชันเริ่มต้นโมดัล
const initializeModal = () => {
    const modal = document.getElementById('viewDetailsModal');
    const closeBtn = modal.querySelector('.close');

    // ปิดโมดัลเมื่อคลิกที่ปุ่มปิด
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    // ปิดโมดัลเมื่อคลิกที่พื้นหลัง
    modal.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    // เพิ่ม event listener สำหรับปุ่มอนุมัติและปฏิเสธ
    document.getElementById('approveBtn').onclick = approveLoan;
    document.getElementById('rejectBtn').onclick = rejectLoan;
};

// ฟังก์ชันออกจากระบบ
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
        await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง'
        });
    }
};

// แสดงข้อมูลธุรกรรม
function renderTransactions(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    const noDataState = document.getElementById('noDataState');
    
    if (!tbody || !noDataState) {
        console.error('Required elements not found');
        return;
    }

    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '';
        noDataState.classList.remove('hidden');
        return;
    }

    noDataState.classList.add('hidden');
    tbody.innerHTML = transactions.map(loan => {
        const pendingPayment = loan.payments.find(p => p.status === 'pending');
        if (!pendingPayment) return '';

        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${loan.id_saving}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${new Date(pendingPayment.paymentDate).toLocaleDateString('th-TH')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${pendingPayment.amount.toLocaleString()} บาท</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${pendingPayment.remainingBalance.toLocaleString()} บาท</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="handleApprove('${loan._id}', '${pendingPayment._id}')" 
                            class="text-green-600 hover:text-green-900 mr-3">
                        <i class="fas fa-check-circle mr-1"></i>อนุมัติ
                    </button>
                    <button onclick="handleReject('${loan._id}', '${pendingPayment._id}')"
                            class="text-red-600 hover:text-red-900">
                        <i class="fas fa-times-circle mr-1"></i>ปฏิเสธ
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// จัดการการอนุมัติ
async function handleApprove(loanId) {
    if (!loanId) {
        showError('ไม่พบข้อมูลสัญญาที่ต้องการอนุมัติ');
        return;
    }
    
    currentLoanId = loanId; // กำหนดค่า currentLoanId
    showPinModal('approve');
}

// จัดการการปฏิเสธ
async function handleReject(loanId) {
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
}

// แสดง Modal สำหรับกรอก PIN
function showPinModal(action, reason = '') {
    const pinModal = document.getElementById('pinModal');
    const pinInput = document.getElementById('pinInput');
    
    if (pinModal && pinInput) {
        pinModal.dataset.action = action;
        pinModal.dataset.reason = reason;
        pinModal.classList.remove('hidden');
        pinInput.value = '';
        pinInput.focus();
    }
}

// ปิด Modal PIN
function closePinModal() {
    const pinModal = document.getElementById('pinModal');
    if (pinModal) {
        pinModal.classList.add('hidden');
        pinModal.dataset.action = '';
        pinModal.dataset.reason = '';
        currentLoanId = null;
    }
}

// ตรวจสอบ PIN
async function verifyPin() {
    const pinInput = document.getElementById('pinInput');
    const pinModal = document.getElementById('pinModal');
    if (!pinInput || !pinModal) return;

    const pin = pinInput.value;
    if (!pin || pin.length !== 4) {
        showError('กรุณากรอกรหัส PIN 4 หลัก');
        return;
    }

    try {
        // ตรวจสอบว่ามีข้อมูลผู้ใช้หรือไม่
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            showError('กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/api/admin/verify-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pin })
        });

        const result = await response.json();
        if (result.verified) {
            const action = pinModal.dataset.action;
            const reason = pinModal.dataset.reason;

            // ตรวจสอบ currentLoanId
            if (!currentLoanId) {
                showError('ไม่พบข้อมูลสัญญาที่ต้องการดำเนินการ');
                return;
            }

            // ซ่อน Modal
            pinModal.classList.add('hidden');
            
            if (action === 'approve') {
                await approvePromise();
            } else if (action === 'reject') {
                await rejectPromise(reason);
            }

            // ล้างค่าหลังจากดำเนินการเสร็จ
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
}

// อนุมัติสัญญา
async function approvePromise() {
    try {
        // ตรวจสอบ currentLoanId
        if (!currentLoanId) {
            throw new Error('ไม่พบข้อมูลสัญญาที่ต้องการอนุมัติ');
        }

        // ตรวจสอบว่ามีข้อมูลผู้ใช้หรือไม่
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                adminId: currentUser._id
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
            window.location.href = '/login.html';
        }
    }
}

// ปฏิเสธสัญญา
async function rejectPromise(reason) {
    try {
        // ตรวจสอบ currentLoanId
        if (!currentLoanId) {
            throw new Error('ไม่พบข้อมูลสัญญาที่ต้องการปฏิเสธ');
        }

        // ตรวจสอบว่ามีข้อมูลผู้ใช้หรือไม่
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
            headers: {
                'Content-Type': 'application/json'
            },
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
            window.location.href = '/login.html';
        }
    }
}

// รีเฟรชข้อมูล
function refreshTransactions() {
    fetchPendingTransactions();
}

// Utility Functions
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: message
    });
}

function showSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: message
    });
}

function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase();
}

// เริ่มต้น Event Listeners
function initializeEventListeners() {
    // จัดการ PIN Modal
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

    // จัดการปุ่มรีเฟรช
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.onclick = fetchAndRenderLoanApplications;
    }

    // ล้างค่าช่องค้นหา
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        searchInput.autocomplete = 'off';
    }
}

// แสดงข้อมูลผู้ใช้
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
