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
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-800">ไม่พบรายการ</td></tr>';
        return;
    }

    applications.forEach(app => {
        const row = tbody.insertRow();
        
        // วันที่ทำสัญญา
        const dateCell = row.insertCell();
        dateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-800';
        const date = new Date(app.Datepromise);
        dateCell.textContent = date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // จำนวนเงิน
        const amountCell = row.insertCell();
        amountCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-800';
        amountCell.textContent = new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(app.amount || 0);

        // ระยะเวลา (คำนวณจากวันที่ทำสัญญาถึงวันครบกำหนด)
        const termCell = row.insertCell();
        termCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-800';
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
                        class="bg-green-500/70 hover:bg-green-600/90 text-white px-3 py-1.5 rounded-lg transition duration-200 ease-in-out mr-2">
                    <i class="fas fa-check-circle mr-1"></i>อนุมัติ
                </button>
                <button onclick="handleReject('${app._id}')"
                        class="bg-red-500/70 hover:bg-red-600/90 text-white px-3 py-1.5 rounded-lg transition duration-200 ease-in-out">
                    <i class="fas fa-times-circle mr-1"></i>ปฏิเสธ
                </button>
            `;
        } else {
            actionCell.innerHTML = `
                <button onclick="viewLoanDetails('${app._id}')"
                        class="bg-blue-500/70 hover:bg-blue-600/90 text-white px-3 py-1.5 rounded-lg transition duration-200 ease-in-out">
                    <i class="fas fa-eye mr-1"></i>ดูรายละเอียด
                </button>
            `;
        }
    });
};

const getStatusBadge = (status) => {
    const badges = {
        pending: '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-500/70 text-white">รอการอนุมัติ</span>',
        approved: '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/70 text-white">อนุมัติแล้ว</span>',
        rejected: '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-500/70 text-white">ปฏิเสธ</span>',
        completed: '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-500/70 text-white">สำเร็จ</span>'
    };
    return badges[status] || '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-500/70 text-white">ไม่ระบุ</span>';
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
    console.log('Loan details:', loanDetails); // เพิ่ม log เพื่อตรวจสอบข้อมูลที่ได้รับ
    
    // แสดงข้อมูลผู้กู้
    const borrower = loanDetails.saving?.id_member || {};
    document.getElementById('borrowerName').textContent = borrower.name || 'ไม่ระบุ';
    document.getElementById('borrowerAddress').textContent = borrower.address || 'ไม่ระบุ';
    document.getElementById('borrowerPhone').textContent = borrower.phone || 'ไม่ระบุ';
    
    // เพิ่มรูปโปรไฟล์ผู้กู้ (ถ้ามี)
    const borrowerSection = document.querySelector('.space-y-3');
    if (borrowerSection) {
        // ลบรูปโปรไฟล์เดิม (ถ้ามี)
        const existingProfileImg = borrowerSection.querySelector('.profile-img-container');
        if (existingProfileImg) {
            existingProfileImg.remove();
        }
        
        // เพิ่มรูปโปรไฟล์ใหม่
        const profileImgContainer = document.createElement('div');
        profileImgContainer.className = 'profile-img-container flex justify-center mb-4';
        
        if (borrower.profileImage) {
            profileImgContainer.innerHTML = `
                <img src="${borrower.profileImage}" alt="${borrower.name}" 
                    class="w-24 h-24 rounded-full border-2 border-white shadow-lg object-cover">
            `;
        } else {
            // ถ้าไม่มีรูป ให้แสดงตัวอักษรย่อแทน
            const initials = borrower.name ? borrower.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
            profileImgContainer.innerHTML = `
                <div class="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-white shadow-lg">
                    ${initials}
                </div>
            `;
        }
        
        borrowerSection.insertBefore(profileImgContainer, borrowerSection.firstChild);
    }
    
    // เพิ่มข้อมูลผู้กู้เพิ่มเติม
    appendInfoIfNotExists(borrowerSection, 'borrowerID', 'รหัสสมาชิก:', borrower.id_member || 'ไม่ระบุ');
    appendInfoIfNotExists(borrowerSection, 'borrowerEmail', 'อีเมล:', borrower.email || 'ไม่ระบุ');
    
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
    
    // หาส่วนข้อมูลสัญญาสำหรับการเพิ่มข้อมูล
    const contractSection = document.querySelectorAll('.space-y-3')[1];
    if (contractSection) {
        // เพิ่มข้อมูลสัญญาเพิ่มเติม
        appendInfoIfNotExists(contractSection, 'contractID', 'เลขที่สัญญา:', loanDetails.id_promise || 'ไม่ระบุ');
        appendInfoIfNotExists(contractSection, 'loanPurpose', 'วัตถุประสงค์การกู้:', loanDetails.purpose || 'ไม่ระบุ');
        
        // จัดรูปแบบวันที่
        const formattedStartDate = formatThaiDate(startDate);
        const formattedEndDate = formatThaiDate(endDate);
        
        appendInfoIfNotExists(contractSection, 'startDate', 'วันที่เริ่มสัญญา:', formattedStartDate);
        appendInfoIfNotExists(contractSection, 'endDate', 'วันที่สิ้นสุดสัญญา:', formattedEndDate);
        
        // คำนวณและแสดงจำนวนเงินที่ต้องชำระต่อเดือน
        const monthlyPayment = calculateMonthlyPayment(loanDetails.amount, loanDetails.interestRate, months);
        appendInfoIfNotExists(contractSection, 'monthlyPayment', 'ยอดชำระต่อเดือน:', new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(monthlyPayment));
    }
    
    // แสดงเอกสารแนบ (ถ้ามี)
    if (loanDetails.documents && loanDetails.documents.length > 0) {
        displayAttachedDocuments(loanDetails.documents);
    } else {
        // กรณีไม่มีเอกสารแนบ
        const documentsContainer = document.getElementById('attachedDocuments');
        documentsContainer.innerHTML = '<p class="text-white/70 italic">ไม่พบเอกสารแนบ</p>';
    }
    
    // แสดงประวัติการชำระเงิน (ถ้ามี)
    if (loanDetails.payments && loanDetails.payments.length > 0) {
        displayPaymentHistory(loanDetails.payments);
    }
    
    // แสดงสถานะสัญญาปัจจุบัน
    const statusBadge = getStatusBadge(loanDetails.status || 'pending');
    const modal = document.getElementById('viewDetailsModal');
    const modalHeader = modal.querySelector('.modal-header') || modal.querySelector('h3').parentElement;
    
    // ลบ status badge เดิม (ถ้ามี)
    const existingBadge = modalHeader.querySelector('.status-badge');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    // เพิ่ม status badge ใหม่
    const statusElement = document.createElement('div');
    statusElement.className = 'status-badge ml-3';
    statusElement.innerHTML = statusBadge;
    modalHeader.querySelector('h3').appendChild(statusElement);
    
    // อัปเดตปุ่มดำเนินการ
    updateActionButtons(loanDetails.status || 'pending');
};

// ฟังก์ชั่นแสดงประวัติการชำระเงิน
const displayPaymentHistory = (payments) => {
    const historyBody = document.getElementById('paymentHistoryBody');
    historyBody.innerHTML = '';
    
    if (!payments || payments.length === 0) {
        historyBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-white/70 italic">ยังไม่มีประวัติการชำระเงิน</td>
            </tr>
        `;
        return;
    }
    
    // เรียงลำดับตามวันที่ จากล่าสุดไปเก่าสุด
    const sortedPayments = [...payments].sort((a, b) => 
        new Date(b.paymentDate) - new Date(a.paymentDate)
    );
    
    sortedPayments.forEach(payment => {
        const paymentDate = new Date(payment.paymentDate);
        const row = document.createElement('tr');
        row.className = 'bg-white/5 hover:bg-white/10 transition-colors duration-150 text-gray-600';
        
        // สถานะการชำระเงิน
        let statusBadge;
        switch (payment.status) {
            case 'success':
                statusBadge = '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/70 text-white">สำเร็จ</span>';
                break;
            case 'pending':
                statusBadge = '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-500/70 text-white">รอตรวจสอบ</span>';
                break;
            case 'failed':
                statusBadge = '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-500/70 text-white">ล้มเหลว</span>';
                break;
            default:
                statusBadge = '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/70 text-white">สำเร็จ</span>';
        }
        
        row.innerHTML = `
            <td class="px-4 py-2 rounded-l-lg">${formatThaiDate(paymentDate)}</td>
            <td class="px-4 py-2">${payment.installment || '-'}</td>
            <td class="px-4 py-2 text-right">${formatCurrency(payment.amount)}</td>
            <td class="px-4 py-2 text-center">${payment.method || 'ชำระด้วยเงินสด'}</td>
            <td class="px-4 py-2 text-center rounded-r-lg">${statusBadge}</td>
        `;
        
        historyBody.appendChild(row);
    });
};

// ฟังก์ชั่นช่วยสำหรับการจัดรูปแบบเงิน
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB'
    }).format(amount || 0);
};

// ฟังก์ชั่นช่วยสำหรับการเพิ่มข้อมูลถ้ายังไม่มี
const appendInfoIfNotExists = (parentElement, id, label, value) => {
    if (!parentElement) return;
    
    let element = document.getElementById(id);
    if (!element) {
        const newElement = document.createElement('div');
        newElement.className = 'flex border-b border-white/10 pb-2';
        newElement.innerHTML = `
            <span class="text-white/80 w-32">${label}</span>
            <span id="${id}" class="text-white flex-1">${value}</span>
        `;
        parentElement.appendChild(newElement);
    } else {
        element.textContent = value;
    }
};

// ฟังก์ชั่นช่วยสำหรับการจัดรูปแบบวันที่เป็นภาษาไทย
const formatThaiDate = (date) => {
    if (!date || isNaN(date)) return 'ไม่ระบุ';
    
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
    
    return `${day} ${month} ${year}`;
};

// ฟังก์ชั่นคำนวณยอดชำระต่อเดือน
const calculateMonthlyPayment = (principal, interestRate, months) => {
    if (!principal || !months || months <= 0) return 0;
    
    // เงื่อนไขใหม่: ดอกเบี้ย 1% ต่อเดือน และระยะเวลากู้สูงสุด 3 เดือน
    // คำนวณแบบเงินต้นเท่ากันทุกงวด + ดอกเบี้ยคิดจากเงินต้นคงเหลือ
    
    // ใช้ 1% ต่อเดือนโดยตรงตามเงื่อนไข (ไม่แปลงจากรายปีเป็นรายเดือน)
    const monthlyInterestRate = 0.01; // คงที่ 1% ต่อเดือนตามเงื่อนไขใหม่
    
    // คำนวณดอกเบี้ยรวมทั้งหมดที่ต้องจ่าย
    let totalInterest = 0;
    let remainingPrincipal = principal;
    const monthlyPrincipal = principal / months;
    
    for (let i = 0; i < months; i++) {
        // ดอกเบี้ยคิดจากยอดเงินต้นคงเหลือ
        const interest = remainingPrincipal * monthlyInterestRate;
        totalInterest += interest;
        remainingPrincipal -= monthlyPrincipal;
    }
    
    // ยอดจ่ายต่อเดือน = (เงินต้น + ดอกเบี้ยทั้งหมด) / จำนวนงวด
    const monthlyPayment = (principal + totalInterest) / months;
    
    return monthlyPayment;
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
