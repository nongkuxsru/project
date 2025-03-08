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

        // กรองเฉพาะสัญญาที่มีสถานะ approved
        const approvedAccounts = data.filter(account => account.status === 'approved');

        if (approvedAccounts.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">ไม่พบข้อมูลสัญญาเงินกู้ที่อนุมัติแล้ว</td></tr>';
            return;
        }

        approvedAccounts.forEach(account => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-center text-gray-900">${account._id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-gray-900">${account.id_saving}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-gray-900">${account.amount.toLocaleString('th-TH')} บาท</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-gray-900">${new Date(account.Datepromise).toLocaleDateString('th-TH')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-gray-900">${new Date(account.DueDate).toLocaleDateString('th-TH')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
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
    const memberSelect = document.getElementById('memberName');
    const selectedOption = memberSelect.options[memberSelect.selectedIndex];
    const memberId = selectedOption?.value;
    const savingBalance = parseFloat(selectedOption?.dataset.balance || '0');
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value);
    const totalWithInterest = parseFloat(document.getElementById('totalWithInterest').value.replace(/[^\d.-]/g, ''));
    const promiseDate = document.getElementById('promiseDate').value;
    const dueDate = document.getElementById('dueDate').value;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!memberId) {
        throw new Error('กรุณาเลือกสมาชิก');
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
    if (loanAmount > savingBalance) {
        throw new Error('จำนวนเงินที่ขอกู้เกินกว่ายอดเงินในบัญชีออมทรัพย์');
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

// ฟังก์ชันสำหรับเปิด modal แสดงรายละเอียด
const openPromiseDetailsModal = async (id_saving) => {
    try {
        const response = await fetch(`/api/staff/promise/${id_saving}`);
        
        if (response.status === 404) {
            throw new Error('ไม่พบข้อมูลสัญญาที่ต้องการ');
        }
        if (!response.ok) {
            throw new Error(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${response.status}`);
        }

        const promiseDetails = await response.json();

        if (!promiseDetails) {
            throw new Error('ไม่ได้รับข้อมูลจาก API');
        }

        // ตรวจสอบสถานะสัญญา
        if (promiseDetails.status !== 'approved') {
            Swal.fire({
                icon: 'warning',
                title: 'ไม่สามารถดูข้อมูลได้',
                text: 'สัญญานี้ยังไม่ได้รับการอนุมัติ'
            });
            return;
        }

        const modal = document.getElementById('promiseDetailsModal');
        const modalContent = document.getElementById('promiseDetailsContent');
        
        if (!modal || !modalContent) {
            throw new Error('ไม่พบ elements ของ modal ในเอกสาร');
        }

        // คำนวณยอดเงินและดอกเบี้ย
        const amount = promiseDetails.amount || 0;
        const interestRate = promiseDetails.interestRate || 0;
        const interestAmount = (amount * interestRate) / 100;
        const totalAmount = amount + interestAmount;
        
        // ใช้ข้อมูลการชำระเงินจาก promiseDetails ถ้ามี
        const totalPaid = promiseDetails.totalPaid || 0;
        const remainingBalance = totalAmount - totalPaid;

        modalContent.innerHTML = `
            <div class="p-6">
                <h2 class="text-xl font-semibold mb-4">รายละเอียดสัญญาเงินกู้</h2>
                <div class="space-y-3">
                    <p><strong>รหัสสัญญา:</strong> ${promiseDetails._id || 'ไม่ระบุ'}</p>
                    <p><strong>รหัสบัญชี:</strong> ${promiseDetails.id_saving || 'ไม่ระบุ'}</p>
                    <p><strong>จำนวนเงินต้น:</strong> ${amount.toLocaleString('th-TH')} บาท</p>
                    <p><strong>อัตราดอกเบี้ย:</strong> ${interestRate}%</p>
                    <p><strong>ดอกเบี้ย:</strong> ${interestAmount.toLocaleString('th-TH')} บาท</p>
                    <p class="font-semibold text-lg text-green-600"><strong>ยอดรวมทั้งสิ้น:</strong> ${totalAmount.toLocaleString('th-TH')} บาท</p>
                    <p class="font-semibold text-lg text-blue-600"><strong>ยอดที่ชำระแล้ว:</strong> ${totalPaid.toLocaleString('th-TH')} บาท</p>
                    <p class="font-semibold text-lg text-red-600"><strong>ยอดคงเหลือ:</strong> ${remainingBalance.toLocaleString('th-TH')} บาท</p>
                    <p><strong>วันที่ทำสัญญา:</strong> ${new Date(promiseDetails.Datepromise).toLocaleDateString('th-TH', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</p>
                    <p><strong>วันครบกำหนด:</strong> ${new Date(promiseDetails.DueDate).toLocaleDateString('th-TH', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</p>
                    <div class="mt-4">
                        <button onclick="openPaymentHistoryModal('${encodeURIComponent(JSON.stringify(promiseDetails.payments || []))}')"
                                class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all">
                            <i class="fas fa-history"></i>
                            <span>ดูประวัติการชำระเงิน</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // เก็บข้อมูลทั้งหมดไว้ใน dataset
        modal.dataset.promiseDetails = JSON.stringify(promiseDetails);
        // เพิ่มบรรทัดนี้เพื่อเก็บ promiseId ไว้ใช้ต่อ
        modal.dataset.promiseId = promiseDetails._id;
        modal.style.display = 'block';

    } catch (error) {
        console.error('Error fetching promise details:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message,
            confirmButtonText: 'ตกลง'
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
            const memberName = await fetchUserName(account.id_member);
            const option = document.createElement('option');
            option.value = account.id_account;
            option.textContent = `${memberName}`;
            option.dataset.balance = account.balance;
            option.dataset.interestRate = account.interestRate;
            option.dataset.status = account.status;
            memberSelect.appendChild(option);
        }

        // ตั้งค่าเริ่มต้นและ event listeners
        document.getElementById('interestRate').value = '6';
        
        // เพิ่ม event listeners สำหรับการคำนวณดอกเบี้ย
        const loanAmountInput = document.getElementById('loanAmount');
        const interestRateInput = document.getElementById('interestRate');
        
        if (loanAmountInput) {
            loanAmountInput.addEventListener('input', calculateTotalWithInterest);
        }
        if (interestRateInput) {
            interestRateInput.addEventListener('input', calculateTotalWithInterest);
        }

        // เพิ่ม event listener สำหรับการเปลี่ยนแปลงการเลือกสมาชิก
        memberSelect.addEventListener('change', () => {
            const selectedOption = memberSelect.options[memberSelect.selectedIndex];
            if (selectedOption.value) {
                document.getElementById('memberId').value = selectedOption.value;
                document.getElementById('savingBalance').value = selectedOption.dataset.balance || '0.00';
                document.getElementById('savingStatus').value = selectedOption.dataset.status || 'ไม่ระบุ';
                document.getElementById('interestRate').value = '6';
                calculateTotalWithInterest(); // คำนวณดอกเบี้ยเมื่อเลือกสมาชิกใหม่
            } else {
                document.getElementById('memberId').value = '';
                document.getElementById('savingBalance').value = '0.00';
                document.getElementById('savingStatus').value = '';
                document.getElementById('interestRate').value = '6';
                calculateTotalWithInterest();
            }
        });

        modal.style.display = 'block';
        handleCreatePromiseForm(form, modal);
        
        // คำนวณดอกเบี้ยครั้งแรก
        calculateTotalWithInterest();

    } catch (error) {
        console.error('Error fetching members:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถดึงข้อมูลสมาชิกได้'
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
            if (form) form.reset();
        }
    });
};

// ฟังก์ชันสำหรับพิมพ์รายละเอียดสัญญา
const printPromiseDetails = () => {
    // ดึงข้อมูลจาก modal dataset
    const modal = document.getElementById('promiseDetailsModal');
    const promiseDetails = JSON.parse(modal.dataset.promiseDetails);
    // คำนวณดอกเบี้ยและยอดรวม
    const amount = promiseDetails.amount || 0;
    const interestRate = promiseDetails.interestRate || 0;
    const interestAmount = (amount * interestRate) / 100;
    const total = amount + interestAmount;
    
    // ดึงเทมเพลตจาก HTML
    const template = document.getElementById('promiseDetailsTemplate');
    
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
            padding: 15mm;
            background: white;
        }
        @media print {
            body {
                width: 210mm;
                height: 297mm;
            }
            .contract-container {
                page-break-inside: avoid;
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
                         // อัพเดตข้อมูลในเอกสาร
                        document.getElementById('contractId').textContent = '${promiseDetails._id}';
                        document.getElementById('memberId').textContent = '${promiseDetails.id_saving}';
                        document.getElementById('amount').textContent = '${amount.toLocaleString('th-TH')} ';
                        document.getElementById('interestRate').textContent = '${interestRate}';
                        document.getElementById('interest').textContent = '${interestAmount.toLocaleString('th-TH')} ';
                        document.getElementById('total').textContent = '${total.toLocaleString('th-TH')}';
                        document.getElementById('startDate').textContent = '${new Date(promiseDetails.Datepromise).toLocaleDateString('th-TH', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}';
                        document.getElementById('dueDate').textContent = '${new Date(promiseDetails.DueDate).toLocaleDateString('th-TH', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}';
                        
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
                ${template.innerHTML}
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


// Event Listeners เมื่อโหลดหน้าเว็บ
document.addEventListener("DOMContentLoaded", () => {
    // ใช้ MutationObserver เพื่อตรวจจับการโหลดของ sidebar
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                // ตรวจสอบและเพิ่ม event listeners สำหรับปุ่มต่างๆ
                const logoutButton = document.getElementById('logoutButton');
                const createPromiseButton = document.getElementById('createPromiseButton');
                const toggleSidebarButton = document.getElementById('toggleSidebar');
                const cancelPromiseButton = document.getElementById('cancelPromiseButton');

                if (logoutButton && !logoutButton.hasListener) {
                    logoutButton.addEventListener('click', logout);
                    logoutButton.hasListener = true;
                }

                if (createPromiseButton && !createPromiseButton.hasListener) {
                    createPromiseButton.addEventListener('click', openCreatePromiseModal);
                    createPromiseButton.hasListener = true;
                }

                if (toggleSidebarButton && !toggleSidebarButton.hasListener) {
                    toggleSidebarButton.addEventListener('click', toggleSidebar);
                    toggleSidebarButton.hasListener = true;
                }

                if (cancelPromiseButton && !cancelPromiseButton.hasListener) {
                    cancelPromiseButton.addEventListener('click', cancelPromiseCreation);
                    cancelPromiseButton.hasListener = true;
                }

                // ถ้าเจอปุ่มทั้งหมดแล้ว ให้หยุดการ observe
                if (logoutButton && createPromiseButton && toggleSidebarButton && cancelPromiseButton) {
                    observer.disconnect();
                }
            }
        });
    });

    // เริ่มการ observe
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

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

    // ดึงข้อมูลสัญญาเมื่อโหลดหน้า
    fetchPromise();
});

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

    if (!loanAmountInput || !interestRateInput || !totalWithInterestInput) {
        console.error('ไม่พบ elements ที่จำเป็นสำหรับการคำนวณดอกเบี้ย');
        return;
    }

    const loanAmount = parseFloat(loanAmountInput.value) || 0;
    const interestRate = parseFloat(interestRateInput.value) || 0;
    const interestAmount = (loanAmount * interestRate) / 100;
    const total = loanAmount + interestAmount;
    
    totalWithInterestInput.value = total.toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' บาท';
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
        const promiseId = detailsModal.dataset.promiseId;
        const promiseDetails = JSON.parse(detailsModal.dataset.promiseDetails);
        
        // ตรวจสอบ promiseId
        if (!promiseId) {
            throw new Error('ไม่พบรหัสสัญญา');
        }

        // คำนวณยอดเงินคงเหลือ
        const amount = promiseDetails.amount || 0;
        const interestRate = promiseDetails.interestRate || 0;
        const interestAmount = (amount * interestRate) / 100;
        const totalAmount = amount + interestAmount;
        const totalPaid = promiseDetails.totalPaid || 0;
        const remainingBalance = totalAmount - totalPaid;

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

        // เก็บ promiseId ไว้ใน dataset ของ modal
        paymentModal.dataset.promiseId = promiseId;
        paymentModal.style.display = 'block';

    } catch (error) {
        console.error('Error opening payment modal:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message
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

        // ตรวจสอบความถูกต้องของข้อมูล
        if (!amount || isNaN(amount) || amount <= 0) {
            throw new Error('กรุณาระบุจำนวนเงินที่ถูกต้อง');
        }
        if (!paymentDate) {
            throw new Error('กรุณาระบุวันที่ชำระเงิน');
        }

        const response = await fetch(`/api/staff/promise/${promiseId}/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount, paymentDate })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'การบันทึกการชำระเงินล้มเหลว');
        }

        await Swal.fire({
            icon: 'success',
            title: 'บันทึกการชำระเงินสำเร็จ',
            text: `ชำระเงินจำนวน ${amount.toLocaleString()} บาท`,
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
                    ${payments.map(payment => `
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${new Date(payment.paymentDate).toLocaleDateString('th-TH')}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${payment.amount.toLocaleString()} บาท
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${payment.remainingBalance.toLocaleString()} บาท
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                    ${payment.status === 'completed' ? 'ชำระแล้ว' : 'รอดำเนินการ'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
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