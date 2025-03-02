// =============================================
// Constants and Configurations
// =============================================

// =============================================
// Core Utility Functions
// =============================================
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
            tableBody.innerHTML = '<tr><td colspan="7">No loan promises available.</td></tr>';
            return;
        }

        data.forEach(account => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${account._id}</td>
                <td>${account.id_saving}</td>
                <td>${account.amount}</td>
                <td>${new Date(account.Datepromise).toLocaleDateString()}</td>
                <td>${new Date(account.DueDate).toLocaleDateString()}</td>
                <td>
                    <button onclick="openPromiseDetailsModal('${account._id}')" 
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
        tableBody.innerHTML = '<tr><td colspan="7">Failed to load data.</td></tr>';
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
    const promiseDate = document.getElementById('promiseDate').value;
    const dueDate = document.getElementById('dueDate').value;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!memberId) {
        throw new Error('กรุณาเลือกสมาชิก');
    }
    if (!loanAmount || isNaN(loanAmount) || loanAmount <= 0) {
        throw new Error('กรุณาระบุจำนวนเงินที่ถูกต้อง');
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
        DueDate: dueDate
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
    console.log('สร้างสัญญาสำเร็จ - กำลังรีเฟรชข้อมูล');
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
// Modal Management Functions
// =============================================

// ฟังก์ชันสำหรับเปิด modal แสดงรายละเอียด
const openPromiseDetailsModal = async (promiseId) => {
    try {
        const response = await fetch(`/api/staff/promise/${promiseId}`);
        const promiseDetails = await response.json();

        const modal = document.getElementById('promiseDetailsModal');
        const modalContent = document.getElementById('promiseDetailsContent');
        
        if (!modal || !modalContent) {
            throw new Error('Modal elements not found in the document');
        }

        modalContent.innerHTML = `
            <p><strong>รหัสสัญญา:</strong> ${promiseDetails._id}</p>
            <p><strong>รหัสสมาชิก:</strong> ${promiseDetails.id_saving}</p>
            <p><strong>จำนวนเงิน:</strong> ${promiseDetails.amount} บาท</p>
            <p><strong>วันที่ทำสัญญา:</strong> ${new Date(promiseDetails.Datepromise).toLocaleDateString()}</p>
            <p><strong>วันครบกำหนด:</strong> ${new Date(promiseDetails.DueDate).toLocaleDateString()}</p>
            <button onclick="closePromiseDetailsModal()" class="closeButton"></button>
        `;

        // เก็บข้อมูล promiseDetails ไว้ใน dataset ของ modal
        modal.dataset.promiseDetails = JSON.stringify(promiseDetails);
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching promise details:', error);
        alert('ไม่สามารถดึงข้อมูลรายละเอียดสัญญาได้: ' + error.message);
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

// =============================================
// Print Functions
// =============================================

// ฟังก์ชันสำหรับพิมพ์รายละเอียดสัญญา
const printPromiseDetails = () => {
    // ดึงข้อมูลจาก modal dataset
    const modal = document.getElementById('promiseDetailsModal');
    const promiseDetails = JSON.parse(modal.dataset.promiseDetails);
    
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
                        document.getElementById('amount').textContent = '${promiseDetails.amount}';
                        document.getElementById('startDate').textContent = '${new Date(promiseDetails.Datepromise).toLocaleDateString()}';
                        document.getElementById('dueDate').textContent = '${new Date(promiseDetails.DueDate).toLocaleDateString()}';
                        
                        // สั่งพิมพ์
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

// Event Listener สำหรับการคลิกนอก modal
window.onclick = (event) => {
    const modal = document.getElementById('promiseDetailsModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
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

// =============================================
// Export (if needed)
// =============================================

// ฟังก์ชันสำหรับสร้างสัญญาเงินกู้ใหม่
const createNewPromise = async (formData) => {
    try {
        console.log('ข้อมูลที่ส่งไป API:', formData);
        const response = await fetch('/api/staff/promise', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        console.log('ข้อมูลที่ได้รับจาก API:', data);

        if (!response.ok) {
            throw new Error(data.message || 'ไม่สามารถสร้างสัญญาเงินกู้ได้');
        }

        return data;
    } catch (error) {
        console.error('Error in createNewPromise:', error);
        throw new Error(error.message || 'เกิดข้อผิดพลาดในการสร้างสัญญาเงินกู้');
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