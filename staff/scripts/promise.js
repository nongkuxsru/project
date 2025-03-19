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

// =============================================
// Data Management Functions
// =============================================

// ฟังก์ชันสำหรับดึงข้อมูลบัญชีสัญญากู้ยืม
const fetchPromise = async () => {
    try {
        const response = await fetch('/api/staff/promise');
        const data = await response.json();

        const tableBody = document.getElementById('promiseTableBody');
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">ไม่พบข้อมูลสัญญาเงินกู้</td></tr>';
            return;
        }

        data.forEach(account => {
            // กำหนดสีและข้อความตามสถานะ
            const statusConfig = {
                pending: {
                    color: 'bg-yellow-100 text-yellow-800',
                    text: 'รอการอนุมัติ'
                },
                approved: {
                    color: 'bg-green-100 text-green-800',
                    text: 'อนุมัติแล้ว'
                },
                rejected: {
                    color: 'bg-red-100 text-red-800',
                    text: 'ไม่อนุมัติ'
                },
                completed: {
                    color: 'bg-blue-100 text-blue-800',
                    text: 'ชำระเสร็จสิ้น'
                }
            };

            const status = statusConfig[account.status] || {
                color: 'bg-gray-100 text-gray-800',
                text: 'ไม่ระบุสถานะ'
            };

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="border px-6 py-4 whitespace-nowrap text-sm text-gray-800">${account._id}</td>
                <td class="border px-6 py-4 whitespace-nowrap text-sm text-gray-800">${account.id_saving}</td>
                <td class="border px-6 py-4 whitespace-nowrap text-sm text-gray-800">${account.amount.toLocaleString('th-TH')} บาท</td>
                <td class="border px-6 py-4 whitespace-nowrap text-sm text-gray-800">${new Date(account.Datepromise).toLocaleDateString('th-TH')}</td>
                <td class="border px-6 py-4 whitespace-nowrap text-sm text-gray-800">${new Date(account.DueDate).toLocaleDateString('th-TH')}</td>
                <td class="border px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    <span class="px-3 py-1 rounded-full ${status.color} text-sm font-medium">
                        ${status.text}
                    </span>
                </td>
                <td class="border px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    <button onclick="openPromiseDetailsModal('${account.id_saving}')" 
                        class="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">
                        <i class="fas fa-eye"></i>
                        <span class="font-ibm-plex-thai">ดูรายละเอียด</span>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching loan promise data:', error);
        const tableBody = document.getElementById('promiseTableBody');
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>ไม่สามารถโหลดข้อมูลได้</td></tr>';
    }
};

// =============================================
// Form Handling Functions
// =============================================

// ฟังก์ชันตรวจสอบและดึงข้อมูลจากฟอร์ม
const validateAndGetFormData = () => {
    const memberId = document.getElementById('memberId').value;
    const savingBalance = parseFloat(document.getElementById('savingBalance').value || '0');
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value);
    const totalWithInterest = parseFloat(document.getElementById('totalWithInterest').value.replace(/[^\d.-]/g, ''));
    const promiseDate = document.getElementById('promiseDate').value;
    const dueDate = document.getElementById('dueDate').value;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!memberId) {
        throw new Error('กรุณาระบุรหัสสมาชิก');
    }
    if (!loanAmount || isNaN(loanAmount) || loanAmount <= 0) {
        throw new Error('กรุณาระบุจำนวนเงินที่ถูกต้อง');
    }
    if (!interestRate || isNaN(interestRate)) {
        throw new Error('กรุณาระบุอัตราดอกเบี้ยที่ถูกต้อง');
    }
    if (!promiseDate) {
        throw new Error('กรุณาระบุวันที่ทำสัญญา');
    }
    if (!dueDate) {
        throw new Error('กรุณาระบุวันครบกำหนด');
    }
    
    // ตรวจสอบว่าผู้กู้มีหุ้นไม่ต่ำกว่า 30% ของยอดกู้ (1 หุ้น = 100 บาท)
    const memberSharesValue = parseFloat(document.getElementById('memberShares').value) * 100;
    const requiredShares = loanAmount * 0.3; // 30% ของยอดกู้
    
    if (memberSharesValue < requiredShares) {
        throw new Error(`ผู้กู้ต้องมีหุ้นไม่ต่ำกว่า 30% ของยอดกู้ (ต้องมีหุ้นอย่างน้อย ${Math.ceil(requiredShares / 100)} หุ้น)`);
    }
    
    if (new Date(dueDate) <= new Date(promiseDate)) {
        throw new Error('วันครบกำหนดต้องมากกว่าวันที่ทำสัญญา');
    }

    return {
        id_saving: memberId,
        amount: loanAmount,
        Datepromise: promiseDate,
        DueDate: dueDate,
        interestRate: interestRate,
        totalAmount: totalWithInterest,
        status: 'pending'
    };
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
    // รีเซ็ตค่าในฟิลด์ที่ไม่ได้อยู่ในฟอร์มโดยตรง
    document.getElementById('memberName').value = '';
    document.getElementById('savingBalance').value = '';
    document.getElementById('savingStatus').value = '';
    document.getElementById('totalWithInterest').value = '';
    
    // รีเซ็ตปุ่มแสดงรายละเอียด
    const viewDetailsBtn = document.getElementById('viewMemberDetailsBtn');
    if (viewDetailsBtn) {
        viewDetailsBtn.disabled = true;
        delete viewDetailsBtn.dataset.savingAccount;
        delete viewDetailsBtn.dataset.memberName;
    }
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

// ฟังก์ชันสำหรับเปิด Modal แสดงรายละเอียดสัญญา
const openPromiseDetailsModal = async (id_promise) => {
    try {
        // แสดง loading
        const detailsContent = document.getElementById('promiseDetailsContent');
        detailsContent.innerHTML = `
            <div class="flex justify-center items-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        `;
        
        // เปิด modal
        const modal = document.getElementById('promiseDetailsModal');
        modal.style.display = 'block';
        
        // ดึงข้อมูลสัญญา
        const response = await fetch(`/api/staff/promise/${id_promise}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch promise details');
        }
        
        const promise = await response.json();
        
        // ตรวจสอบว่ามีข้อมูลหรือไม่
        if (!promise) {
            throw new Error('ไม่พบข้อมูลสัญญาเงินกู้');
        }
        
        // คำนวณจำนวนเงินที่ชำระแล้ว
        let totalPaid = 0;
        if (promise.payments && promise.payments.length > 0) {
            totalPaid = promise.payments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
        } else if (promise.totalPaid) {
            // ใช้ totalPaid จากข้อมูลที่มีอยู่แล้ว
            totalPaid = parseFloat(promise.totalPaid) || 0;
        }
        
        // ตรวจสอบและแปลงค่าให้เป็นตัวเลข
        const amount = parseFloat(promise.amount) || 0;
        
        // คำนวณระยะเวลากู้เป็นเดือน
        let loanPeriodMonths = 1;
        if (promise.Datepromise && promise.DueDate) {
            const startDate = new Date(promise.Datepromise);
            const dueDate = new Date(promise.DueDate);
            const diffTime = Math.abs(dueDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            loanPeriodMonths = Math.ceil(diffDays / 30);
            loanPeriodMonths = Math.min(loanPeriodMonths, 3); // ไม่เกิน 3 เดือน
        }
        
        // คำนวณดอกเบี้ย 1% ต่อเดือน
        const interestRate = 1; // 1% ต่อเดือน
        const interestAmount = (amount * interestRate * loanPeriodMonths) / 100;
        const totalAmount = amount + interestAmount;
        
        // คำนวณยอดคงเหลือ
        const remainingBalance = totalAmount - totalPaid;
        
        // คำนวณค่าปรับชำระล่าช้า (ถ้ามี)
        let lateFee = 0;
        let isLate = false;
        const today = new Date();
        const dueDate = new Date(promise.DueDate || promise.due_date);
        
        if (today > dueDate && remainingBalance > 0) {
            // คำนวณจำนวนเดือนที่เลยกำหนด (ปัดขึ้น)
            const diffTime = Math.abs(today - dueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const lateMonths = Math.ceil(diffDays / 30);
            lateFee = lateMonths * 50; // ค่าปรับ 50 บาทต่อเดือน
            isLate = true;
        }
        
        // แปลงวันที่ให้อยู่ในรูปแบบที่อ่านง่าย
        let startDate = 'ไม่ระบุ';
        if (promise.Datepromise || promise.start_date) {
            try {
                const dateValue = promise.Datepromise || promise.start_date;
                startDate = new Date(dateValue).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (e) {
                console.error('Error formatting start date:', e);
            }
        }
        
        let dueDateStr = 'ไม่ระบุ';
        if (promise.DueDate || promise.due_date) {
            try {
                const dateValue = promise.DueDate || promise.due_date;
                dueDateStr = new Date(dateValue).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (e) {
                console.error('Error formatting due date:', e);
            }
        }
        
        // คำนวณเวลาที่เหลือจนถึงวันครบกำหนด
        let remainingTimeText = '';
        if (promise.DueDate || promise.due_date) {
            try {
                const today = new Date();
                const dueDateObj = new Date(promise.DueDate || promise.due_date);
                const daysRemaining = Math.ceil((dueDateObj - today) / (1000 * 60 * 60 * 24));
                
                if (daysRemaining > 0) {
                    remainingTimeText = `<span class="text-green-600 font-medium">อีก ${daysRemaining} วัน</span>`;
                } else if (daysRemaining === 0) {
                    remainingTimeText = `<span class="text-orange-500 font-medium">วันนี้</span>`;
            } else {
                    remainingTimeText = `<span class="text-red-600 font-medium">เลยกำหนด ${Math.abs(daysRemaining)} วัน</span>`;
                }
            } catch (e) {
                console.error('Error calculating remaining time:', e);
                remainingTimeText = '<span class="text-gray-600">ไม่สามารถคำนวณได้</span>';
            }
        } else {
            remainingTimeText = '<span class="text-gray-600">ไม่ระบุ</span>';
        }
        
        // คำนวณเปอร์เซ็นต์การชำระเงิน
        let paymentPercentage = 0;
        if (totalAmount > 0) {
            paymentPercentage = Math.min(Math.round((totalPaid / totalAmount) * 100), 100);
        }
        
        // กำหนดสถานะสัญญา
        let statusDisplay = '';
        const status = promise.status || 'unknown';
        
        if (status === 'active' || status === 'approved') {
            if (isLate) {
                statusDisplay = `<span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">ค้างชำระ</span>`;
            } else {
                statusDisplay = `<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">กำลังผ่อนชำระ</span>`;
            }
        } else if (status === 'completed') {
            statusDisplay = `<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">ชำระครบแล้ว</span>`;
        } else if (status === 'pending') {
            statusDisplay = `<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">รออนุมัติ</span>`;
        } else {
            statusDisplay = `<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">${status}</span>`;
        }
        
        // แสดงข้อมูลในรูปแบบที่สวยงาม
        detailsContent.innerHTML = `
            <div class="bg-white rounded-lg overflow-hidden">
                <div class="bg-green-50 p-3 border-l-4 border-green-500 mb-3">
                <div class="flex justify-between items-center">
                        <h3 class="text-green-800 font-bold">สัญญาเงินกู้เลขที่: ${promise._id || promise.id_promise || 'ไม่ระบุ'}</h3>
                        ${statusDisplay}
                </div>
                    </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <p class="text-xs text-gray-500 mb-1">บัญชีออมทรัพย์</p>
                        <p class="font-medium flex items-center">
                            <i class="fas fa-piggy-bank text-green-600 mr-2"></i>
                            ${promise.id_saving || 'ไม่ระบุ'}
                        </p>
                    </div>
                    
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <p class="text-xs text-gray-500 mb-1">จำนวนเงินกู้</p>
                        <p class="font-medium flex items-center">
                            <i class="fas fa-money-bill-wave text-green-600 mr-2"></i>
                            ${amount.toLocaleString('th-TH')} บาท
                        </p>
                    </div>
                    
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <p class="text-xs text-gray-500 mb-1">อัตราดอกเบี้ย</p>
                        <p class="font-medium flex items-center">
                            <i class="fas fa-percentage text-blue-600 mr-2"></i>
                            ${interestRate}% ต่อเดือน (ระยะเวลากู้ ${loanPeriodMonths} เดือน)
                        </p>
                    </div>
                    
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <p class="text-xs text-gray-500 mb-1">จำนวนเงินรวมดอกเบี้ย</p>
                        <p class="font-medium flex items-center">
                            <i class="fas fa-calculator text-blue-600 mr-2"></i>
                            ${totalAmount.toLocaleString('th-TH')} บาท
                        </p>
                    </div>
                    
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <p class="text-xs text-gray-500 mb-1">วันที่ทำสัญญา</p>
                        <p class="font-medium flex items-center">
                            <i class="fas fa-calendar-alt text-indigo-600 mr-2"></i>
                            ${startDate}
                        </p>
                    </div>
                    
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <p class="text-xs text-gray-500 mb-1">วันครบกำหนด</p>
                        <p class="font-medium flex items-center">
                            <i class="fas fa-calendar-check text-indigo-600 mr-2"></i>
                            ${dueDateStr} (${remainingTimeText})
                        </p>
                    </div>
                </div>
                
                <div class="bg-gray-50 p-3 rounded-lg mb-3">
                    <div class="flex justify-between mb-1">
                        <span class="text-sm font-medium">ความคืบหน้าการชำระเงิน</span>
                        <span class="text-sm font-medium">${paymentPercentage}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-green-600 h-2.5 rounded-full" style="width: ${paymentPercentage}%"></div>
                    </div>
                    <div class="flex justify-between mt-2">
                    <div>
                            <p class="text-xs text-gray-500">ชำระแล้ว</p>
                            <p class="font-medium text-green-600">${totalPaid.toLocaleString('th-TH')} บาท</p>
                    </div>
                        <div class="text-right">
                            <p class="text-xs text-gray-500">คงเหลือ</p>
                            <p class="font-medium text-${remainingBalance > 0 ? 'red' : 'green'}-600">${remainingBalance.toLocaleString('th-TH')} บาท</p>
                </div>
                    </div>
                    ${lateFee > 0 ? `
                    <div class="mt-2 bg-red-50 p-2 rounded-lg border-l-4 border-red-500">
                        <p class="text-xs text-red-800 font-medium">
                            <i class="fas fa-exclamation-triangle mr-1"></i>
                            ค่าปรับชำระล่าช้า: ${lateFee.toLocaleString('th-TH')} บาท
                        </p>
                        <p class="text-xs text-red-700">
                            (คิดค่าปรับ 50 บาทต่อเดือน นับจากวันที่ครบกำหนด)
                        </p>
                    </div>
                    ` : ''}
                </div>
                
                <div class="mb-2">
                    <h4 class="font-medium mb-2 flex items-center">
                        <i class="fas fa-history text-gray-600 mr-2"></i>
                        ประวัติการชำระเงิน
                    </h4>
                    ${promise.payments && promise.payments.length > 0 ? `
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ครั้งที่</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่ชำระ</th>
                                        <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวนเงิน</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    ${promise.payments.map((payment, index) => {
                                        let paymentDate = 'ไม่ระบุ';
                                        let paymentAmount = 0;
                                        
                                        try {
                                            // ตรวจสอบทุกชื่อฟิลด์ที่เป็นไปได้สำหรับวันที่ชำระเงิน
                                            if (payment.payment_date) {
                                                paymentDate = new Date(payment.payment_date).toLocaleDateString('th-TH');
                                            } else if (payment.paymentDate) {
                                                paymentDate = new Date(payment.paymentDate).toLocaleDateString('th-TH');
                                            } else if (payment.date) {
                                                paymentDate = new Date(payment.date).toLocaleDateString('th-TH');
                                            }
                                            
                                            paymentAmount = parseFloat(payment.amount) || 0;
                                        } catch (e) {
                                            console.error('Error formatting payment data:', e);
                                        }
                                        
                                        return `
                                            <tr>
                                                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${index + 1}</td>
                                                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${paymentDate}</td>
                                                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">${paymentAmount.toLocaleString('th-TH')} บาท</td>
                                        </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="text-center py-4 bg-gray-50 rounded-lg">
                            <p class="text-gray-500">ยังไม่มีประวัติการชำระเงิน</p>
                    </div>
                    `}
                </div>
                
                <div class="bg-blue-50 p-3 rounded-lg mb-3 border-l-4 border-blue-500">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-2"></i>
                        <strong>หมายเหตุ:</strong> สัญญาเงินกู้นี้มีระยะเวลาไม่เกิน 3 เดือน และต้องชำระเงินทั้งหมดในเดือนสุดท้าย
                    </p>
                </div>
            </div>
        `;

        // เก็บข้อมูลสัญญาไว้ใช้ในฟังก์ชันอื่น
        const paymentBtn = document.querySelector('[onclick="openPaymentModal()"]');
        if (paymentBtn) {
            paymentBtn.dataset.promiseId = promise._id || promise.id_promise || '';
            paymentBtn.dataset.remainingBalance = remainingBalance || 0;
            paymentBtn.dataset.lateFee = lateFee || 0;
        }
        
        // เก็บข้อมูลสัญญาไว้ใน dataset ของ modal
        modal.dataset.promiseId = promise._id || promise.id_promise || '';
        modal.dataset.promiseDetails = JSON.stringify({
            _id: promise._id || promise.id_promise,
            id_saving: promise.id_saving,
            amount: amount,
            interestRate: interestRate,
            loanPeriodMonths: loanPeriodMonths,
            Datepromise: promise.Datepromise || promise.start_date,
            DueDate: promise.DueDate || promise.due_date,
            totalPaid: totalPaid,
            status: status,
            payments: promise.payments || [],
            lateFee: lateFee
        });
        
        // อัพเดทปุ่มในส่วน footer ของ modal
        const modalFooter = modal.querySelector('.modal-footer');
        if (modalFooter) {
            // ซ่อนปุ่มชำระเงินเมื่อสัญญามีสถานะเป็น completed หรือเมื่อชำระเงินครบแล้ว
            modalFooter.innerHTML = `
                ${(status !== 'completed' && remainingBalance > 0 && status === 'approved') ? `
                    <button onclick="openPaymentModal()" 
                        class="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-all duration-300">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>ชำระเงิน</span>
                    </button>
                ` : ''}
                <button class="bg-primary hover:bg-green-600 text-white px-3 py-1.5 text-sm rounded-lg transition-colors" 
                        onclick="printPromiseDetails()">
                    <i class="fas fa-print mr-1"></i>พิมพ์สัญญา
                </button>
                <button class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 text-sm rounded-lg transition-colors" 
                        onclick="closePromiseDetails()">
                    ปิด
                </button>
            `;
        }
        
    } catch (error) {
        console.error('Error opening promise details:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถแสดงรายละเอียดสัญญาได้: ' + error.message
        });
    }
};

// ฟังก์ชันสำหรับปิด modal
const closePromiseDetails = () => {
    const modal = document.getElementById('promiseDetailsModal');
    modal.style.display = 'none';
};

// ฟังก์ชันสำหรับเปิด modal และสร้างสัญญาเงินกู้
const openCreatePromiseModal = async () => {
    const modal = document.getElementById('createPromiseModal');
    const form = document.getElementById('createPromiseForm');
    const searchMemberBtn = document.getElementById('searchMemberBtn');
    const memberIdInput = document.getElementById('memberId');
    const viewDetailsBtn = document.getElementById('viewMemberDetailsBtn');

    try {
        // ตั้งค่าเริ่มต้นและ event listeners
        document.getElementById('interestRate').value = '1';
        
        // ตั้งค่าวันที่เริ่มต้น
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        document.getElementById('promiseDate').value = todayStr;
        
        // คำนวณวันที่ครบกำหนดเริ่มต้น (3 เดือนจากวันนี้)
        const threeMonthsLater = new Date(today);
        threeMonthsLater.setMonth(today.getMonth() + 3);
        // ปรับให้ไม่เกิน 3 เดือน
        if (threeMonthsLater.getDate() !== today.getDate()) {
            threeMonthsLater.setDate(0); // ย้อนกลับไปวันสุดท้ายของเดือนก่อนหน้า
        }
        document.getElementById('dueDate').value = threeMonthsLater.toISOString().split('T')[0];
        
        // เพิ่ม event listeners สำหรับการคำนวณดอกเบี้ย
        const loanAmountInput = document.getElementById('loanAmount');
        const promiseDateInput = document.getElementById('promiseDate');
        const dueDateInput = document.getElementById('dueDate');
        
        if (loanAmountInput) {
            loanAmountInput.addEventListener('input', calculateTotalWithInterest);
        }
        
        if (promiseDateInput) {
            promiseDateInput.addEventListener('change', calculateTotalWithInterest);
        }
        
        if (dueDateInput) {
            dueDateInput.addEventListener('change', calculateTotalWithInterest);
        }

        // เพิ่ม event listener สำหรับปุ่มค้นหาสมาชิก
        if (searchMemberBtn) {
            searchMemberBtn.addEventListener('click', searchMember);
        }

        // เพิ่ม event listener สำหรับปุ่มแสดงรายละเอียด
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', viewSavingDetails);
            viewDetailsBtn.disabled = true; // เริ่มต้นให้ปุ่มถูก disable ไว้
        }

        // เพิ่ม event listener สำหรับการกด Enter ที่ช่องรหัสสมาชิก
        if (memberIdInput) {
            memberIdInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault(); // ป้องกันการ submit form
                    searchMember();
                }
            });
        }

        // เพิ่ม event listener สำหรับการตรวจสอบวันที่ครบกำหนด
        if (dueDateInput) {
            dueDateInput.addEventListener('change', (event) => {
                const startDate = new Date(promiseDateInput.value);
                const endDate = new Date(dueDateInput.value);
                
                if (startDate && endDate && !isNaN(startDate) && !isNaN(endDate)) {
                    // คำนวณจำนวนวัน
                    const diffTime = Math.abs(endDate - startDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    // ตรวจสอบว่าเกิน 3 เดือนหรือไม่ (90 วัน)
                    if (diffDays > 90) {
                        Swal.fire({
                            icon: 'warning',
                            title: 'ระยะเวลากู้เกินกำหนด',
                            text: 'ระยะเวลาในการกู้ต้องไม่เกิน 3 เดือน',
                            confirmButtonText: 'ตกลง'
                        });
                        
                        // รีเซ็ตวันที่ครบกำหนดเป็น 3 เดือนจากวันเริ่มต้น
                        const maxDueDate = new Date(startDate);
                        maxDueDate.setMonth(startDate.getMonth() + 3);
                        if (maxDueDate.getDate() !== startDate.getDate()) {
                            maxDueDate.setDate(0);
                        }
                        dueDateInput.value = maxDueDate.toISOString().split('T')[0];
                    }
                }
                
                // คำนวณดอกเบี้ยใหม่
                calculateTotalWithInterest();
            });
        }

        modal.style.display = 'block';
        handleCreatePromiseForm(form, modal);
        
        // คำนวณดอกเบี้ยครั้งแรก
        calculateTotalWithInterest();

    } catch (error) {
        console.error('Error opening create promise modal:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถเปิดหน้าสร้างสัญญาได้'
        });
    }
};

// ฟังก์ชันสำหรับค้นหาข้อมูลสมาชิกจากรหัสสมาชิก
const searchMember = async () => {
    try {
        const memberId = document.getElementById('memberId').value.trim();
        
        if (!memberId) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณาระบุรหัสสมาชิก',
                text: 'โปรดกรอกรหัสสมาชิกก่อนทำการค้นหา'
            });
            return;
        }

        // แสดง loading
        Swal.fire({
            title: 'กำลังค้นหาข้อมูล...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // ค้นหาข้อมูลบัญชีออมทรัพย์จากรหัสสมาชิก (id_account)
        const savingResponse = await fetch(`/api/staff/saving/account/${memberId}`);
        
        if (savingResponse.status === 404) {
            Swal.fire({
                icon: 'error',
                title: 'ไม่พบข้อมูล',
                text: 'ไม่พบข้อมูลบัญชีออมทรัพย์ของสมาชิกรหัสนี้'
            });
            return;
        }
        
        if (!savingResponse.ok) {
            throw new Error('Failed to fetch saving account');
        }
        
        const savingAccount = await savingResponse.json();
        
        // ดึงข้อมูลชื่อสมาชิก
        const memberName = await fetchUserName(savingAccount.id_member);
        
        // แสดงข้อมูลในฟอร์ม
        document.getElementById('memberName').value = memberName;
        document.getElementById('savingBalance').value = (parseFloat(savingAccount.balance) || 0).toLocaleString('th-TH') + ' บาท';
        
        // แสดงสถานะบัญชี
        const savingStatusSelect = document.getElementById('savingStatus');
        if (savingStatusSelect) {
            savingStatusSelect.value = savingAccount.status || 'ordinary_loan';
        }
        
        // แสดงจำนวนหุ้น
        const shares = parseFloat(savingAccount.shares) || 0;
        document.getElementById('memberShares').value = shares.toLocaleString('th-TH') + ' หุ้น (' + (shares * 100).toLocaleString('th-TH') + ' บาท)';
        
        // เปิดใช้งานปุ่มแสดงรายละเอียด
        const viewDetailsBtn = document.getElementById('viewMemberDetailsBtn');
        if (viewDetailsBtn) {
            viewDetailsBtn.disabled = false;
            // เก็บข้อมูลบัญชีออมทรัพย์ไว้ใน dataset ของปุ่ม
            viewDetailsBtn.dataset.savingAccount = JSON.stringify(savingAccount);
            viewDetailsBtn.dataset.memberName = memberName;
        }
        
        // ปิด loading
        Swal.close();
        
        // แจ้งเตือนสำเร็จ
        Swal.fire({
            icon: 'success',
            title: 'พบข้อมูลสมาชิก',
            text: `ชื่อสมาชิก: ${memberName}`,
            timer: 1500,
            showConfirmButton: false
        });
        
        // คำนวณดอกเบี้ย
        calculateTotalWithInterest();
        
    } catch (error) {
        console.error('Error searching member:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถค้นหาข้อมูลสมาชิกได้ กรุณาลองใหม่อีกครั้ง'
        });
    }
};

// ฟังก์ชันสำหรับแสดงรายละเอียดบัญชีออมทรัพย์
const viewSavingDetails = () => {
    try {
        const viewDetailsBtn = document.getElementById('viewMemberDetailsBtn');
        if (!viewDetailsBtn || !viewDetailsBtn.dataset.savingAccount) {
            throw new Error('ไม่พบข้อมูลบัญชีออมทรัพย์');
        }

        const savingAccount = JSON.parse(viewDetailsBtn.dataset.savingAccount);
        const memberName = viewDetailsBtn.dataset.memberName || 'ไม่ระบุชื่อ';

        const modal = document.getElementById('savingDetailsModal');
        const modalContent = document.getElementById('savingDetailsContent');

        if (!modal || !modalContent) {
            throw new Error('ไม่พบ elements ของ modal ในเอกสาร');
        }

        // แสดง loading animation
        modalContent.innerHTML = `
            <div class="flex justify-center items-center py-10">
                <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
            </div>
        `;
        
        modal.style.display = 'block';
        
        // จำลองการโหลดข้อมูล (เพื่อให้เห็น animation)
        setTimeout(() => {
            // กำหนดสีและข้อความตามสถานะ
            const statusConfig = {
                active: {
                    color: 'bg-green-100 text-green-800 border-green-200',
                    icon: 'fa-check-circle text-green-500',
                    text: 'ใช้งาน'
                },
                inactive: {
                    color: 'bg-red-100 text-red-800 border-red-200',
                    icon: 'fa-times-circle text-red-500',
                    text: 'ไม่ใช้งาน'
                },
                suspended: {
                    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                    icon: 'fa-exclamation-circle text-yellow-500',
                    text: 'ระงับชั่วคราว'
                }
            };

            const status = statusConfig[savingAccount.status] || {
                color: 'bg-gray-100 text-gray-800 border-gray-200',
                icon: 'fa-question-circle text-gray-500',
                text: 'ไม่ระบุสถานะ'
            };

            // คำนวณระยะเวลาที่เปิดบัญชี
            const createdDate = new Date(savingAccount.createdAt);
            const today = new Date();
            const diffTime = Math.abs(today - createdDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffMonths = Math.floor(diffDays / 30);
            const diffYears = Math.floor(diffMonths / 12);
            
            let accountAge = '';
            if (diffYears > 0) {
                accountAge = `${diffYears} ปี ${diffMonths % 12} เดือน`;
            } else if (diffMonths > 0) {
                accountAge = `${diffMonths} เดือน`;
            } else {
                accountAge = `${diffDays} วัน`;
            }

            // แสดงข้อมูลในรูปแบบการ์ดที่สวยงาม
            modalContent.innerHTML = `
                <div class="space-y-6 animate-fadeIn">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-3">
                            <div class="bg-green-500 text-white p-3 rounded-full">
                                <i class="fas fa-user-circle text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-gray-800">${memberName}</h3>
                                <p class="text-sm text-gray-500">สมาชิกหมายเลข: ${savingAccount.id_member}</p>
                            </div>
                        </div>
                        <span class="px-4 py-2 rounded-full ${status.color} text-sm font-medium border flex items-center">
                            <i class="fas ${status.icon} mr-2"></i>
                            ${status.text}
                        </span>
                    </div>
                    
                    <div class="bg-green-50 rounded-lg p-5 border border-green-100 shadow-sm">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="text-lg font-semibold text-green-800">ข้อมูลบัญชี</h4>
                            <div class="text-sm text-gray-500">เปิดบัญชีเมื่อ ${accountAge} ที่แล้ว</div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                <p class="text-sm text-gray-500 mb-1">หมายเลขบัญชี</p>
                                <p class="font-semibold text-lg flex items-center">
                                    <i class="fas fa-hashtag text-green-500 mr-2"></i>
                                    ${savingAccount.id_account}
                                </p>
                            </div>
                            
                            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                <p class="text-sm text-gray-500 mb-1">วันที่เปิดบัญชี</p>
                                <p class="font-semibold text-lg flex items-center">
                                    <i class="fas fa-calendar-day text-blue-500 mr-2"></i>
                                    ${new Date(savingAccount.createdAt).toLocaleDateString('th-TH', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                            
                            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                <p class="text-sm text-gray-500 mb-1">ยอดเงินคงเหลือ</p>
                                <p class="font-semibold text-lg flex items-center">
                                    <i class="fas fa-coins text-yellow-500 mr-2"></i>
                                    <span class="text-green-600">${(savingAccount.balance || 0).toLocaleString('th-TH')}</span>
                                    <span class="text-sm text-gray-500 ml-1">บาท</span>
                                </p>
                            </div>
                            
                            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                <p class="text-sm text-gray-500 mb-1">จำนวนหุ้น</p>
                                <p class="font-semibold text-lg flex items-center">
                                    <i class="fas fa-chart-pie text-purple-500 mr-2"></i>
                                    ${(savingAccount.shares || 0).toLocaleString('th-TH')}
                                    <span class="text-sm text-gray-500 ml-1">หุ้น</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 rounded-lg p-5 border border-blue-100 shadow-sm">
                        <h4 class="text-lg font-semibold text-blue-800 mb-3">ข้อมูลเพิ่มเติม</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm text-gray-600">ประเภทบัญชี</p>
                                <p class="font-medium">${savingAccount.type || 'บัญชีออมทรัพย์ทั่วไป'}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">อัพเดทล่าสุด</p>
                                <p class="font-medium">${new Date(savingAccount.updatedAt || savingAccount.createdAt).toLocaleDateString('th-TH')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // เพิ่ม CSS animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }
            `;
            document.head.appendChild(style);
            
        }, 500); // แสดง loading 0.5 วินาที

    } catch (error) {
        console.error('Error viewing saving details:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถแสดงรายละเอียดบัญชีออมทรัพย์ได้'
        });
    }
};

// ฟังก์ชันสำหรับปิด modal
const closeModal = () => {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
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
            if (modal) modal.style.display = 'none';
            if (form) {
                form.reset();
                // รีเซ็ตค่าในฟิลด์ที่ไม่ได้อยู่ในฟอร์มโดยตรง
                document.getElementById('memberName').value = '';
                document.getElementById('savingBalance').value = '';
                document.getElementById('savingStatus').value = '';
                document.getElementById('totalWithInterest').value = '';
                
                // รีเซ็ตปุ่มแสดงรายละเอียด
                const viewDetailsBtn = document.getElementById('viewMemberDetailsBtn');
                if (viewDetailsBtn) {
                    viewDetailsBtn.disabled = true;
                    delete viewDetailsBtn.dataset.savingAccount;
                    delete viewDetailsBtn.dataset.memberName;
                }
            }
        }
    });
};

// ฟังก์ชันสำหรับพิมพ์รายละเอียดสัญญา
const printPromiseDetails = () => {
    // ดึงข้อมูลจาก modal dataset
    const modal = document.getElementById('promiseDetailsModal');
    const promiseDetails = JSON.parse(modal.dataset.promiseDetails);
    
    // คำนวณดอกเบี้ยและยอดรวม
    const amount = parseFloat(promiseDetails.amount) || 0;
    const interestRate = parseFloat(promiseDetails.interestRate) || 0;
    const loanPeriodMonths = parseInt(promiseDetails.loanPeriodMonths) || 1;
    const interestAmount = (amount * interestRate * loanPeriodMonths) / 100;
    const total = amount + interestAmount;
    
    // กำหนดค่าสถานะสัญญา
    const statusConfig = {
        pending: {
            color: '#f59e0b',
            borderColor: '#f59e0b',
            text: 'รออนุมัติ'
        },
        approved: {
            color: '#1B8F4C',
            borderColor: '#1B8F4C',
            text: 'อนุมัติแล้ว'
        },
        rejected: {
            color: '#dc2626',
            borderColor: '#dc2626',
            text: 'ไม่อนุมัติ'
        },
        completed: {
            color: '#2563eb',
            borderColor: '#2563eb',
            text: 'ชำระเสร็จสิ้น'
        }
    };
    
    // ดึงค่าสถานะจากข้อมูลสัญญา
    const status = promiseDetails.status || 'pending';
    const statusStyle = statusConfig[status] || statusConfig.pending;
    
    // สร้างหน้าต่างใหม่สำหรับพิมพ์
    const printWindow = window.open('', '_blank');
    
    // กำหนดสไตล์สำหรับการพิมพ์
    const printStyles = `
        @page {
            size: A4;
            margin: 0;
        }
        body {
            font-family: 'Sarabun', sans-serif;
            margin: 0;
            padding: 20mm;
            background: white;
            color: #333;
        }
        .contract-container {
            max-width: 170mm;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #1B8F4C;
            padding-bottom: 15px;
        }
        .header img {
            max-width: 100px;
            margin-bottom: 15px;
        }
        .header h1 {
            font-size: 28px;
            font-weight: bold;
            margin: 8px 0;
            color: #1B8F4C;
        }
        .header h2 {
            font-size: 22px;
            margin: 8px 0;
            color: #264C3B;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 2px solid #1B8F4C;
            padding-bottom: 5px;
            color: #1B8F4C;
        }
        .detail-row {
            display: flex;
            margin-bottom: 10px;
        }
        .detail-label {
            font-weight: bold;
            width: 40%;
        }
        .detail-value {
            width: 60%;
        }
        .signatures {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            text-align: center;
            width: 45%;
        }
        .signature-line {
            border-bottom: 1px solid #333;
            margin: 50px 0 5px 0;
        }
        .status-stamp {
            color: ${statusStyle.color};
            font-weight: bold;
            border: 2px solid ${statusStyle.borderColor};
            display: inline-block;
            padding: 5px 15px;
            border-radius: 5px;
            transform: rotate(-15deg);
            position: absolute;
            top: 100px;
            right: 50px;
            font-size: 24px;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        @media print {
            body {
                width: 210mm;
                height: 297mm;
            }
            .no-print {
                display: none;
            }
        }
    `;

    // เขียน HTML ลงในหน้าต่างใหม่
    printWindow.document.write(`
        <html>
            <head>
                <title>สัญญาเงินกู้</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
                <style>${printStyles}</style>
                <script>
                    // พิมพ์ทันทีเมื่อโหลดเสร็จ
                    window.onload = function() {
                        setTimeout(() => {
                        window.print();
                        }, 500);
                    }

                    // ปิดหน้าต่างหลังจากพิมพ์เสร็จ
                    window.addEventListener('afterprint', function() {
                        window.close();
                        if (window.opener && !window.opener.closed) {
                            window.opener.focus();
                        }
                    });
                </script>
            </head>
            <body>
                <div class="contract-container">
                    <div class="header">
                        <img src="/images/logo.png" alt="Logo">
                        <h1>สัญญาเงินกู้</h1>
                        <h2>สหกรณ์ออมทรัพย์หมู่บ้าน ตำบลตะกุกเหนือ</h2>
                    </div>
                    
                    <!-- สถานะสัญญา -->
                    <div class="status-stamp">
                        ${statusStyle.text}
                    </div>

                    <div class="section">
                        <h3 class="section-title">รายละเอียดสัญญา</h3>
                        
                        <div class="detail-row">
                            <div class="detail-label">รหัสสัญญา:</div>
                            <div class="detail-value">${promiseDetails._id}</div>
                        </div>
                        
                        <div class="detail-row">
                            <div class="detail-label">รหัสสมาชิก:</div>
                            <div class="detail-value">${promiseDetails.id_saving}</div>
                        </div>
                        
                        <div class="detail-row">
                            <div class="detail-label">จำนวนเงินต้น:</div>
                            <div class="detail-value">${amount.toLocaleString('th-TH')} บาท</div>
                        </div>
                        
                        <div class="detail-row">
                            <div class="detail-label">อัตราดอกเบี้ย:</div>
                            <div class="detail-value">${interestRate}% ต่อเดือน</div>
                        </div>
                        
                        <div class="detail-row">
                            <div class="detail-label">ระยะเวลากู้:</div>
                            <div class="detail-value">${loanPeriodMonths} เดือน</div>
                        </div>
                        
                        <div class="detail-row">
                            <div class="detail-label">จำนวนเงินดอกเบี้ย:</div>
                            <div class="detail-value">${interestAmount.toLocaleString('th-TH')} บาท</div>
                        </div>
                        
                        <div class="detail-row">
                            <div class="detail-label">จำนวนเงินรวม:</div>
                            <div class="detail-value">${total.toLocaleString('th-TH')} บาท</div>
                        </div>
                        
                        <div class="detail-row">
                            <div class="detail-label">วันที่ทำสัญญา:</div>
                            <div class="detail-value">${new Date(promiseDetails.Datepromise).toLocaleDateString('th-TH', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</div>
                        </div>
                        
                        <div class="detail-row">
                            <div class="detail-label">วันครบกำหนด:</div>
                            <div class="detail-value">${new Date(promiseDetails.DueDate).toLocaleDateString('th-TH', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</div>
                        </div>
                        
                        <div class="detail-row">
                            <div class="detail-label">สถานะสัญญา:</div>
                            <div class="detail-value" style="color: ${statusStyle.color}; font-weight: bold;">
                                ${statusStyle.text}
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <h3 class="section-title">เงื่อนไขสัญญา</h3>
                        <p>1. ผู้กู้ตกลงชำระเงินต้นพร้อมดอกเบี้ยให้แก่สหกรณ์ออมทรัพย์หมู่บ้าน ตำบลตะกุกเหนือ ภายในวันครบกำหนดตามที่ระบุในสัญญานี้</p>
                        <p>2. หากผู้กู้ผิดนัดชำระหนี้ ผู้กู้ยินยอมให้สหกรณ์คิดดอกเบี้ยในอัตราผิดนัดเพิ่มอีกร้อยละ 3 ต่อปีของเงินต้นที่ค้างชำระ</p>
                        <p>3. ผู้กู้ยินยอมให้สหกรณ์หักเงินปันผลหรือเงินอื่นใดที่ผู้กู้มีสิทธิได้รับจากสหกรณ์เพื่อชำระหนี้ตามสัญญานี้</p>
                    </div>

                    <div class="signatures">
                        <div class="signature-box">
                            <div class="signature-line"></div>
                            <p>ลงชื่อ..............................................ผู้กู้</p>
                            <p>(............................................)</p>
                            <p>วันที่........../........../.........</p>
                        </div>
                        
                        <div class="signature-box">
                            <div class="signature-line"></div>
                            <p>ลงชื่อ..............................................ผู้อนุมัติ</p>
                            <p>(............................................)</p>
                            <p>วันที่........../........../.........</p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>เอกสารนี้พิมพ์เมื่อวันที่ ${new Date().toLocaleDateString('th-TH', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</p>
                    </div>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #1B8F4C; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        พิมพ์สัญญา
                    </button>
                </div>
            </body>
        </html>
    `);
    
    printWindow.document.close();

    // จัดการข้อผิดพลาด
    printWindow.onerror = function(error) {
        console.error('Print preview error:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถแสดงตัวอย่างสัญญาได้',
            timer: 1500,
            showConfirmButton: false
        });
        printWindow.close();
    };
};

// ลบ window.onclick อันแรกออก และรวมเป็นอันเดียว
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

// ฟังก์ชันสำหรับสร้างสัญญาเงินกู้ใหม่
const createNewPromise = async (formData) => {
    try {
        // ตรวจสอบว่ามีสัญญาที่มีเลขบัญชีเดียวกันอยู่แล้วหรือไม่
        const existingPromisesResponse = await fetch(`/api/staff/promise?accountId=${formData.id_saving}`);
        const existingPromises = await existingPromisesResponse.json();

        // ตรวจสอบว่าบัญชีออมทรัพย์มีอยู่จริงหรือไม่
        const savingResponse = await fetch(`/api/staff/saving/account/${formData.id_saving}`);
        if (savingResponse.status === 404) {
            throw new Error('ไม่พบบัญชีออมทรัพย์ของสมาชิกรหัสนี้');
        }
        if (!savingResponse.ok) {
            throw new Error('ไม่สามารถตรวจสอบข้อมูลบัญชีออมทรัพย์ได้');
        }

        // เตรียมข้อมูลที่จะส่งไป API
        const promiseData = {
            id_saving: formData.id_saving,
            amount: parseFloat(formData.amount),
            Datepromise: formData.Datepromise,
            DueDate: formData.DueDate,
            interestRate: parseFloat(formData.interestRate),
            totalAmount: parseFloat(formData.totalAmount),
            status: formData.status
        };

        // ตรวจสอบความถูกต้องของข้อมูลก่อนส่ง
        if (isNaN(promiseData.interestRate) || isNaN(promiseData.amount) || isNaN(promiseData.totalAmount)) {
            throw new Error('ข้อมูลจำนวนเงินหรืออัตราดอกเบี้ยไม่ถูกต้อง');
        }

        const response = await fetch('/api/staff/promise', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(promiseData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'ไม่สามารถสร้างสัญญาเงินกู้ได้');
        }

        return data;
    } catch (error) {
        console.error('Error in createNewPromise:', error);
        throw error;
    }
};

const printEmptyLoanForm = () => {
    // ดึงเทมเพลตจาก HTML
    const template = document.getElementById('loanFormTemplate');
    const formContent = template.innerHTML;

    // สร้างสไตล์สำหรับการพิมพ์
    const printStyles = `
        @page {
            size: A4;
            margin: 0;
        }
        body {
            font-family: 'Sarabun', sans-serif;
            margin: 0;
            padding: 10mm;
            background: white;
        }
        @media print {
            body {
                width: 210mm;
                height: 297mm;
            }
            .loan-form-container {
                page-break-inside: avoid;
            }
        }
        .loan-form-container {
            max-width: 190mm;
            margin: 0 auto;
        }
        .loan-form-container img {
            height: 80px;
            width: auto;
            margin-bottom: 10px;
        }
        h1, h2 {
            margin: 5px 0;
            font-size: 20px;
        }
        h3 {
            font-size: 18px;
            margin: 10px 0 5px 0;
            border-bottom: 1px solid #000;
        }
        p {
            margin: 5px 0;
            line-height: 1.5;
        }
        strong {
            display: inline-block;
            min-width: 100px;
        }
        .form-field {
            display: inline-block;
            border-bottom: 1px dotted #000;
            min-width: 180px;
            height: 18px;
            vertical-align: middle;
            margin-left: 5px;
        }
        .checkbox-group {
            margin: 5px 0;
        }
        .checkbox-group div {
            display: inline-block;
            margin-right: 20px;
        }
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
        }
        .signature-box {
            text-align: center;
            width: 45%;
        }
        .signature-box p {
            margin: 3px 0;
        }
        .staff-section {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px dashed #000;
        }
        .staff-section h3 {
            font-size: 16px;
            margin-bottom: 5px;
        }
    `;

    // เปิดหน้าต่างใหม่และพิมพ์ทันที
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>แบบฟอร์มคำขอสินเชื่อ</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
                <style>${printStyles}</style>
                <script>
                    // พิมพ์ทันทีเมื่อโหลดเสร็จ
                    window.onload = function() {
                        window.print();
                    }

                    // ปิดหน้าต่างหลังจากพิมพ์เสร็จ
                    window.addEventListener('afterprint', function() {
                        window.close();
                        if (window.opener && !window.opener.closed) {
                            window.opener.focus();
                        }
                    });
                </script>
            </head>
            <body>
                ${formContent}
            </body>
        </html>
    `);
    printWindow.document.close();

    // จัดการข้อผิดพลาด
    printWindow.onerror = function(error) {
        console.error('Print preview error:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถแสดงตัวอย่างแบบฟอร์มได้',
            timer: 1500,
            showConfirmButton: false
        });
        printWindow.close();
    };
};

// ย้ายฟังก์ชัน calculateTotalWithInterest ไปไว้ด้านบน
const calculateTotalWithInterest = () => {
    const loanAmountInput = document.getElementById('loanAmount');
    const interestRateInput = document.getElementById('interestRate');
    const totalWithInterestInput = document.getElementById('totalWithInterest');
    const promiseDateInput = document.getElementById('promiseDate');
    const dueDateInput = document.getElementById('dueDate');
    const interestDetailsDiv = document.getElementById('interestDetails');

    if (!loanAmountInput || !interestRateInput || !totalWithInterestInput) {
        console.error('ไม่พบ elements ที่จำเป็นสำหรับการคำนวณดอกเบี้ย');
        return;
    }

    const loanAmount = parseFloat(loanAmountInput.value) || 0;
    
    // กำหนดดอกเบี้ยคงที่ 1% ต่อเดือน
    const interestRate = 1;
    interestRateInput.value = interestRate;
    
    // คำนวณระยะเวลากู้เป็นเดือน
    let months = 1; // ค่าเริ่มต้น 1 เดือน
    
    if (promiseDateInput && dueDateInput && promiseDateInput.value && dueDateInput.value) {
        const startDate = new Date(promiseDateInput.value);
        const endDate = new Date(dueDateInput.value);
        
        if (startDate && endDate && !isNaN(startDate) && !isNaN(endDate)) {
            // คำนวณจำนวนวัน
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // แปลงเป็นเดือน (ปัดขึ้น)
            months = Math.ceil(diffDays / 30);
            
            // จำกัดไม่เกิน 3 เดือน
            months = Math.min(months, 3);
        }
    }
    
    // คำนวณดอกเบี้ย 1% ต่อเดือน
    const interestAmount = (loanAmount * interestRate * months) / 100;
    const total = loanAmount + interestAmount;
    
    // ใช้ toLocaleString เพื่อจัดรูปแบบตัวเลขให้อ่านง่าย
    totalWithInterestInput.value = total.toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' บาท';
    
    // แสดงรายละเอียดการคำนวณ
    if (interestDetailsDiv) {
        interestDetailsDiv.innerHTML = `
            <div class="text-xs text-gray-600">
                <p>ดอกเบี้ย: ${loanAmount.toLocaleString('th-TH')} × ${interestRate}% × ${months} เดือน = ${interestAmount.toLocaleString('th-TH')} บาท</p>
                <p>ยอดรวม: ${loanAmount.toLocaleString('th-TH')} + ${interestAmount.toLocaleString('th-TH')} = ${total.toLocaleString('th-TH')} บาท</p>
            </div>
        `;
    }
};

const recordPayment = async (promiseId) => {
    try {
        const form = document.getElementById('paymentForm');
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const paymentDate = document.getElementById('paymentDate').value;

        const response = await fetch(`/api/staff/promise/${promiseId}/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount, paymentDate })
        });

        if (!response.ok) throw new Error('การบันทึกการชำระเงินล้มเหลว');

        const result = await response.json();

        await Swal.fire({
            icon: 'success',
            title: 'บันทึกการชำระเงินสำเร็จ',
            text: `ชำระเงินจำนวน ${amount.toLocaleString()} บาท`,
            timer: 2000
        });

        // รีเฟรชข้อมูลสัญญา
        await fetchPromise();
        closeModal();
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message
        });
    }
};

const showPaymentHistory = (payments) => {
    const historyTable = document.createElement('table');
    historyTable.innerHTML = `
        <tr>
            <th>วันที่ชำระ</th>
            <th>จำนวนเงิน</th>
            <th>ยอดคงเหลือ</th>
            <th>สถานะ</th>
        </tr>
        ${payments.map(payment => `
            <tr>
                <td>${new Date(payment.paymentDate).toLocaleDateString('th-TH')}</td>
                <td>${payment.amount.toLocaleString()} บาท</td>
                <td>${payment.remainingBalance.toLocaleString()} บาท</td>
                <td>${payment.status}</td>
            </tr>
        `).join('')}
    `;
    return historyTable.outerHTML;
};

// เพิ่มฟังก์ชันสำหรับเปิด modal ชำระเงิน
const openPaymentModal = () => {
    try {
        const detailsModal = document.getElementById('promiseDetailsModal');
        
        // ตรวจสอบว่ามีข้อมูลใน dataset หรือไม่
        if (!detailsModal.dataset.promiseId || !detailsModal.dataset.promiseDetails) {
            console.error('ไม่พบข้อมูลสัญญาใน dataset', detailsModal.dataset);
            throw new Error('ไม่พบข้อมูลสัญญา กรุณาลองโหลดข้อมูลใหม่');
        }

        const promiseId = detailsModal.dataset.promiseId;
        const promiseDetails = JSON.parse(detailsModal.dataset.promiseDetails);

        // ตรวจสอบสถานะสัญญาว่าได้รับการอนุมัติแล้วหรือไม่
        if (promiseDetails.status !== 'approved') {
            Swal.fire({
                icon: 'warning',
                title: 'ไม่สามารถชำระเงินได้',
                text: 'สัญญาเงินกู้นี้ยังไม่ได้รับการอนุมัติจากผู้อำนวยการ กรุณารอการอนุมัติก่อนทำการชำระเงิน',
                confirmButtonText: 'ตกลง'
            });
            return;
        }

        // คำนวณยอดเงินคงเหลือ
        const amount = parseFloat(promiseDetails.amount) || 0;
        const interestRate = parseFloat(promiseDetails.interestRate) || 0;
        const loanPeriodMonths = parseInt(promiseDetails.loanPeriodMonths) || 1;
        const interestAmount = (amount * interestRate * loanPeriodMonths) / 100;
        const totalAmount = amount + interestAmount;
        const totalPaid = parseFloat(promiseDetails.totalPaid) || 0;
        const remainingBalance = totalAmount - totalPaid;
        
        // ดึงค่าปรับชำระล่าช้า (ถ้ามี)
        const lateFee = parseFloat(promiseDetails.lateFee) || 0;

        // ตรวจสอบยอดเงินคงเหลือ
        if (remainingBalance <= 0) {
            Swal.fire({
                icon: 'info',
                title: 'ไม่มียอดค้างชำระ',
                text: 'สัญญานี้ได้ชำระเงินครบถ้วนแล้ว',
                confirmButtonText: 'ตกลง'
            });
            return;
        }

        const paymentModal = document.getElementById('paymentModal');
        if (!paymentModal) {
            throw new Error('ไม่พบ payment modal');
        }

        // ตั้งค่าวันที่ปัจจุบันเป็นค่าเริ่มต้น
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('paymentDate').value = today;

        // เก็บ promiseId และค่าปรับไว้ใน dataset ของ modal
        paymentModal.dataset.promiseId = promiseId;
        paymentModal.dataset.lateFee = lateFee;
        
        // แสดงยอดเงินคงเหลือและค่าปรับใน modal
        const paymentAmount = document.getElementById('paymentAmount');
        const lateFeeDisplay = document.getElementById('lateFeeDisplay');
        const totalPaymentDisplay = document.getElementById('totalPaymentDisplay');
        
        if (paymentAmount) {
            paymentAmount.max = remainingBalance;
            paymentAmount.placeholder = `ยอดคงเหลือ: ${remainingBalance.toLocaleString('th-TH')} บาท`;
            paymentAmount.value = remainingBalance; // ตั้งค่าเริ่มต้นเป็นยอดคงเหลือทั้งหมด
        }
        
        // แสดงค่าปรับชำระล่าช้า (ถ้ามี)
        if (lateFeeDisplay) {
            if (lateFee > 0) {
                lateFeeDisplay.innerHTML = `
                    <div class="bg-red-50 p-2 rounded-lg border-l-4 border-red-500 mb-3">
                        <p class="text-sm text-red-800 font-medium">
                            <i class="fas fa-exclamation-triangle mr-1"></i>
                            ค่าปรับชำระล่าช้า: ${lateFee.toLocaleString('th-TH')} บาท
                        </p>
                    </div>
                `;
                lateFeeDisplay.style.display = 'block';
            } else {
                lateFeeDisplay.style.display = 'none';
            }
        }
        
        // แสดงยอดรวมที่ต้องชำระ
        if (totalPaymentDisplay) {
            const updateTotalDisplay = () => {
                const currentAmount = parseFloat(paymentAmount.value) || 0;
                const total = currentAmount + lateFee;
                totalPaymentDisplay.innerHTML = `
                    <div class="bg-blue-50 p-2 rounded-lg">
                        <p class="text-sm text-blue-800 font-medium">
                            <i class="fas fa-calculator mr-1"></i>
                            ยอดรวมที่ต้องชำระ: ${total.toLocaleString('th-TH')} บาท
                        </p>
                    </div>
                `;
            };
            
            // อัพเดทยอดรวมเมื่อมีการเปลี่ยนแปลงจำนวนเงิน
            paymentAmount.addEventListener('input', updateTotalDisplay);
            
            // แสดงยอดรวมครั้งแรก
            updateTotalDisplay();
        }

        paymentModal.style.display = 'block';

    } catch (error) {
        console.error('Error opening payment modal:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถเปิดหน้าชำระเงินได้'
        });
    }
};

// เพิ่มฟังก์ชันสำหรับบันทึกการชำระเงิน
const handlePayment = async (event) => {
    event.preventDefault();
    
    try {
        const paymentModal = document.getElementById('paymentModal');
        const promiseId = paymentModal.dataset.promiseId;
        
        // เพิ่มการตรวจสอบ promiseId
        if (!promiseId) {
            throw new Error('ไม่พบรหัสสัญญา');
        }

        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const paymentDate = document.getElementById('paymentDate').value;
        
        // ดึงค่าปรับชำระล่าช้า (ถ้ามี)
        const lateFee = parseFloat(paymentModal.dataset.lateFee || 0);

        // ตรวจสอบความถูกต้องของข้อมูล
        if (!amount || isNaN(amount) || amount <= 0) {
            throw new Error('กรุณาระบุจำนวนเงินที่ถูกต้อง');
        }
        if (!paymentDate) {
            throw new Error('กรุณาระบุวันที่ชำระเงิน');
        }

        // แสดง loading
        Swal.fire({
            title: 'กำลังบันทึกข้อมูล...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // ถ้ามีค่าปรับ ให้แสดงข้อความยืนยันก่อน
        if (lateFee > 0) {
            const result = await Swal.fire({
                title: 'มีค่าปรับชำระล่าช้า',
                html: `
                    <p>จำนวนเงินที่ต้องชำระ: ${amount.toLocaleString()} บาท</p>
                    <p>ค่าปรับชำระล่าช้า: ${lateFee.toLocaleString()} บาท</p>
                    <p>รวมทั้งสิ้น: ${(amount + lateFee).toLocaleString()} บาท</p>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'ชำระเงิน',
                cancelButtonText: 'ยกเลิก'
            });
            
            if (!result.isConfirmed) {
                return;
            }
        }

        const response = await fetch(`/api/staff/promise/${promiseId}/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                amount, 
                paymentDate,
                // เพิ่มฟิลด์ date เพื่อความเข้ากันได้กับระบบ
                date: paymentDate,
                // เพิ่มค่าปรับชำระล่าช้า (ถ้ามี)
                lateFee: lateFee
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'การบันทึกการชำระเงินล้มเหลว');
        }

        await Swal.fire({
            icon: 'success',
            title: 'บันทึกการชำระเงินสำเร็จ',
            text: lateFee > 0 
                ? `ชำระเงินจำนวน ${amount.toLocaleString()} บาท และค่าปรับ ${lateFee.toLocaleString()} บาท` 
                : `ชำระเงินจำนวน ${amount.toLocaleString()} บาท`,
            timer: 2000,
            showConfirmButton: false
        });

        // ปิด modal การชำระเงิน
        paymentModal.style.display = 'none';
        document.getElementById('paymentForm').reset();

        // รีเฟรชข้อมูลในหน้ารายละเอียดสัญญา
        const detailsModal = document.getElementById('promiseDetailsModal');
        if (detailsModal && detailsModal.style.display === 'block') {
            const promiseDetails = JSON.parse(detailsModal.dataset.promiseDetails);
            await openPromiseDetailsModal(promiseDetails.id_saving);
        }

        // รีเฟรชตารางสัญญาทั้งหมด
        await fetchPromise();

    } catch (error) {
        console.error('Payment Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถบันทึกการชำระเงินได้'
        });
    }
};

// เพิ่มฟังก์ชันสำหรับเปิด modal ประวัติการชำระเงิน
const openPaymentHistoryModal = (paymentsJson) => {
    try {
        const payments = JSON.parse(decodeURIComponent(paymentsJson));
        const historyModal = document.getElementById('paymentHistoryModal');
        const historyContent = document.getElementById('paymentHistoryContent');
        
        if (!historyModal || !historyContent) {
            throw new Error('ไม่พบ elements ของ modal ประวัติการชำระเงิน');
        }

        if (!payments || payments.length === 0) {
            historyContent.innerHTML = '<p class="text-center text-gray-600">ยังไม่มีประวัติการชำระเงิน</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'min-w-full divide-y divide-gray-200';
            table.innerHTML = `
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่ชำระ</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวนเงิน</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดคงเหลือ</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${payments.map(payment => {
                        // ตรวจสอบทุกชื่อฟิลด์ที่เป็นไปได้สำหรับวันที่ชำระเงิน
                        let paymentDateStr = 'ไม่ระบุ';
                        try {
                            if (payment.payment_date) {
                                paymentDateStr = new Date(payment.payment_date).toLocaleDateString('th-TH');
                            } else if (payment.paymentDate) {
                                paymentDateStr = new Date(payment.paymentDate).toLocaleDateString('th-TH');
                            } else if (payment.date) {
                                paymentDateStr = new Date(payment.date).toLocaleDateString('th-TH');
                            }
                        } catch (e) {
                            console.error('Error formatting payment date:', e);
                        }
                        
                        return `
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${paymentDateStr}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                ${(parseFloat(payment.amount) || 0).toLocaleString()} บาท
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                ${(parseFloat(payment.remainingBalance) || 0).toLocaleString()} บาท
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                    ${payment.status === 'completed' ? 'ชำระแล้ว' : 'รอดำเนินการ'}
                                </span>
                            </td>
                        </tr>
                    `}).join('')}
                </tbody>
            `;
            historyContent.innerHTML = '';
            historyContent.appendChild(table);
        }

        historyModal.style.display = 'block';
    } catch (error) {
        console.error('Error opening payment history modal:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message
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
    
    const createPromiseButton = document.getElementById('createPromiseButton');
    const cancelPromiseButton = document.getElementById('cancelPromiseButton');

    createPromiseButton.addEventListener('click', openCreatePromiseModal);
    cancelPromiseButton.addEventListener('click', cancelPromiseCreation);

    // ดึงข้อมูลสัญญาเมื่อโหลดหน้า
    fetchPromise();
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