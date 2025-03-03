document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // เพิ่ม event listener สำหรับปุ่ม "เพิ่มผู้ใช้"
    const addUserButton = document.getElementById('addUserButton');
    if (addUserButton) {
        addUserButton.addEventListener('click', openAddUserModal);
    }

    // เพิ่ม event listener สำหรับปุ่ม "แก้ไข"
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const userId = event.target.closest('button').getAttribute('data-user-id');
            openTransactionModal(userId);
        });
    });

    // รีเฟรชข้อมูลบัญชี
    fetchAccount();

    // เรียกใช้ฟังก์ชันการค้นหา
    setupSearch();
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


const getStaffIdFromLocalStorage = () => {
    const staffData = localStorage.getItem('currentUser');
    if (!staffData) {
        console.error('Staff data not found in localStorage. Make sure to set it correctly.');
        return null;
    }
    
    try {
        const staff = JSON.parse(staffData);
        if (staff && staff._id) {
            return staff._id;
        } else {
            console.error('Staff ID not found in stored data');
            return null;
        }
    } catch (error) {
        console.error('Error parsing staff data from localStorage:', error);
        return null;
    }
};

// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
window.onload = () => {

    // เพิ่ม Event Listener สำหรับปุ่ม Logout
    document.getElementById('logoutButton').addEventListener('click', logout);
};

const convertToBuddhistYear = (dateString) => {
    const date = new Date(dateString);
    const buddhistYear = date.getFullYear() + 543;
    return `${date.getDate()}/${date.getMonth() + 1}/${buddhistYear}`;
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0 }).format(amount);
};

// เพิ่มตัวแปรสำหรับจัดการ pagination
let currentPage = 1;
const rowsPerPage = 8;
let totalPages = 1;

const fetchAccount = async () => {
    try {
        const response = await fetch('/api/staff/saving');
        if (!response.ok) {
            throw new Error('Failed to fetch account data');
        }
        
        const data = await response.json();
        const tableBody = document.getElementById('accountTableBody');
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-gray-500">
                        <div class="flex flex-col items-center justify-center space-y-2">
                            <i class="fas fa-inbox text-4xl"></i>
                            <p>ไม่พบข้อมูลบัญชี</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        // คำนวณจำนวนหน้าทั้งหมด
        totalPages = Math.ceil(data.length / rowsPerPage);

        // คำนวณ index เริ่มต้นและสิ้นสุดของข้อมูลที่จะแสดงในหน้าปัจจุบัน
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        
        // กรองข้อมูลที่จะแสดงในหน้าปัจจุบัน
        const accountsToDisplay = data.slice(startIndex, endIndex);

        for (const account of accountsToDisplay) {
            const userName = await fetchUserName(account.id_member);
            const staffName = await fetchUserName(account.id_staff);
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors duration-200';

            // สร้าง cells พร้อม classes
            const cells = [
                { content: account.id_account, class: 'border px-4 py-2' },
                { content: userName, class: 'border px-4 py-2' },
                { 
                    content: formatCurrency(account.balance), 
                    class: 'border px-4 py-2 text-right font-semibold text-gray-700' 
                },
                { content: staffName, class: 'border px-4 py-2' },
                { 
                    content: convertToBuddhistYear(account.createdAt), 
                    class: 'border px-4 py-2' 
                }
            ];

            // เพิ่ม cells ปกติ
            cells.forEach(cell => {
                const td = document.createElement('td');
                td.className = cell.class;
                td.textContent = cell.content;
                row.appendChild(td);
            });

            // เพิ่ม cell สำหรับปุ่มดำเนินการ
            const actionsCell = document.createElement('td');
            actionsCell.className = 'border px-4 py-2';
            const actionWrapper = document.createElement('div');
            actionWrapper.className = 'flex justify-center gap-2';
            actionWrapper.innerHTML = `
                <button 
                    class="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition duration-200 ease-in-out flex items-center gap-1 text-sm"
                    onclick="openTransactionModal('${account.id_member}', 'deposit')"
                    title="ฝากเงิน">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>ฝาก</span>
                </button>
                <button 
                    class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition duration-200 ease-in-out flex items-center gap-1 text-sm"
                    onclick="openTransactionModal('${account.id_member}', 'withdraw')"
                    title="ถอนเงิน">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>ถอน</span>
                </button>
            `;
            actionsCell.appendChild(actionWrapper);
            row.appendChild(actionsCell);
            tableBody.appendChild(row);
        }

        // สร้าง pagination controls
        renderPagination();
    } catch (error) {
        console.error('Error fetching account data:', error);
        const tableBody = document.getElementById('accountTableBody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="flex flex-col items-center justify-center space-y-2 text-red-500">
                        <i class="fas fa-exclamation-circle text-4xl"></i>
                        <p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                    </div>
                </td>
            </tr>`;
    }
};

// เพิ่มฟังก์ชันสำหรับสร้าง pagination controls
const renderPagination = () => {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) {
        // สร้าง container สำหรับ pagination ถ้ายังไม่มี
        const container = document.createElement('div');
        container.id = 'pagination';
        container.className = 'flex justify-center items-center space-x-2 mt-4';
        document.querySelector('section.bg-white').appendChild(container);
    }

    paginationContainer.innerHTML = `
        <button 
            class="px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}"
            ${currentPage === 1 ? 'disabled' : ''}
            onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
        <span class="px-4 py-1">หน้า ${currentPage} จาก ${totalPages}</span>
        <button 
            class="px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}"
            ${currentPage === totalPages ? 'disabled' : ''}
            onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
};

// เพิ่มฟังก์ชันสำหรับเปลี่ยนหน้า
const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        fetchAccount();
    }
};

const fetchUserName = async (userId) => {
    try {
        const response = await fetch(`/api/admin/users/${userId}`); // เรียก API เพื่อดึงข้อมูลผู้ใช้
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        const userData = await response.json();
        return userData.name; // ส่งกลับชื่อผู้ใช้
    } catch (error) {
        console.error('Error fetching user data:', error);
        return 'Unknown'; // หากเกิดข้อผิดพลาด ให้ส่งกลับค่า 'Unknown'
    }
};

const fetchStaffName = async (userId) => {
    try {
        const response = await fetch(`/api/admin/users/${userId}`); // เรียก API เพื่อดึงข้อมูลผู้ใช้
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        const userData = await response.json();
        return userData.name; // ส่งกลับชื่อผู้ใช้
    } catch (error) {
        console.error('Error fetching user data:', error);
        return 'Unknown'; // หากเกิดข้อผิดพลาด ให้ส่งกลับค่า 'Unknown'
    }
};

const openAddUserModal = () => {
    const modal = document.getElementById('addUserModal');
    const form = document.getElementById('addUserForm');
    const nameSelect = document.getElementById('addName');
    const selectedUserIdInput = document.getElementById('selectedUserId');

    modal.style.display = 'block'; // แสดง modal

    generateAccountId = () => {
        return Math.floor(1000000000 + Math.random() * 9000000000); // สุ่มเลขบัญชี 10 หลัก
    };

    // สุ่มหมายเลขบัญชีใหม่ทุกครั้งที่เปิดฟอร์ม
    document.getElementById('addAccountId').value = generateAccountId();

    // เติมค่า Staff ID ลงในฟอร์มโดยอัตโนมัติ
    const staffId = getStaffIdFromLocalStorage();
    if (staffId) document.getElementById('addStaffId').value = staffId;

    // ดึงรายชื่อจาก API
    const fetchNames = async () => {
        try {
            const response = await fetch('/api/admin/users');
            const users = await response.json();

            if (response.ok && Array.isArray(users)) {
                nameSelect.innerHTML = ''; // ลบ option เก่าทั้งหมด
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user._id;
                    option.textContent = user.name;
                    nameSelect.appendChild(option);
                });
                selectedUserIdInput.value = users.length > 0 ? users[0]._id : ''; // กำหนดค่าเริ่มต้น
            } else {
                console.error('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching user names:', error);
        }
    };
    fetchNames();

    // เมื่อเลือกชื่อผู้ใช้
    nameSelect.addEventListener('change', (event) => {
        selectedUserIdInput.value = event.target.value;
    });

    // ปิด modal เมื่อคลิกปุ่ม close หรือคลิกนอก modal
    document.querySelector('#addUserModal .close').onclick = () => modal.style.display = 'none';
    window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };

    // ฟังก์ชันสำหรับการล้างฟอร์ม
    const resetForm = () => {
        form.reset(); // ล้างค่าฟอร์ม
        selectedUserIdInput.value = ''; // ล้างค่า userId
    };

    // ฟังก์ชันตรวจสอบข้อมูลซ้ำ
    const checkDuplicateUser = async (id_member) => {
        try {
            const response = await fetch(`/api/staff/saving/check/${id_member}`);
            const result = await response.json();

            if (response.ok && result.exists) {
                const confirmAdd = await Swal.fire({
                    title: 'ผู้ใช้นี้มีบัญชีอยู่แล้ว!',
                    text: 'ต้องการเพิ่มบัญชีใหม่หรือไม่?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'ใช่, เพิ่มบัญชีใหม่',
                    cancelButtonText: 'ยกเลิก',
                });

                return confirmAdd.isConfirmed; // ถ้าผู้ใช้กด "OK" ให้ดำเนินการต่อ
            }
            return true; // ถ้าไม่มีบัญชี ให้ดำเนินการต่อได้
        } catch (error) {
            console.error('Error checking for duplicate user:', error);
            return false;
        }
    };

    // ส่งฟอร์ม
    form.onsubmit = async (e) => {
        e.preventDefault();

        const id_account = document.getElementById('addAccountId').value;
        const id_member = selectedUserIdInput.value;
        const balance = document.getElementById('addBalance').value;
        const id_staff = document.getElementById('addStaffId').value;

        if (!id_member) {
            Swal.fire({
                icon: 'error',
                title: 'กรุณาเลือกชื่อผู้ใช้ที่ถูกต้อง',
                text: 'คุณต้องเลือกชื่อผู้ใช้ก่อนดำเนินการต่อ',
            });
            return;
        }

        const canProceed = await checkDuplicateUser(id_member);
        if (!canProceed) {
            console.log('❌ User cancelled the account creation.');
            return; // ยกเลิกการสร้างบัญชีถ้าผู้ใช้ไม่ยืนยัน
        }

        const newUser = { id_account, id_member, balance, id_staff };
        try {
            const response = await fetch('/api/staff/saving', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to add user');

            await fetchAccount(); // รีเฟรชข้อมูลบัญชี
            modal.style.display = 'none';

            Swal.fire({
                icon: 'success',
                title: 'เพิ่มผู้ใช้สำเร็จ!',
                text: 'บัญชีใหม่ถูกสร้างเรียบร้อยแล้ว',
            });

            resetForm(); // ล้างฟอร์มหลังการบันทึก
        } catch (error) {
            console.error('Error adding user:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด!',
                text: error.message || 'ไม่สามารถเพิ่มบัญชีได้ กรุณาลองใหม่',
            });
        }
    };
};

const openTransactionModal = async (userId, type) => {
    // เลือก modal ตามประเภทธุรกรรม
    const modalId = type === 'deposit' ? 'depositModal' : 'withdrawModal';
    const modal = document.getElementById(modalId);
    const form = document.getElementById(`transactionForm${type.charAt(0).toUpperCase() + type.slice(1)}`);

    if (!modal || !form) {
        console.error('Modal or form not found');
        return;
    }

    // แสดง modal
    modal.style.display = 'block';

    // ดึงข้อมูลผู้ใช้จาก API
    try {
        const response = await fetch(`/api/staff/saving/${userId}`);
        const account = await response.json();
        const userName = await fetchUserName(account.id_member);

        if (!response.ok || !account) {
            throw new Error('Failed to fetch account data');
        }

        // กำหนดค่าให้กับฟอร์ม
        document.getElementById(`transactionAccountId${type.charAt(0).toUpperCase() + type.slice(1)}`).value = account.id_account;
        document.getElementById(`transactionUserId${type.charAt(0).toUpperCase() + type.slice(1)}`).value = account._id;
        document.getElementById(`transactionName${type.charAt(0).toUpperCase() + type.slice(1)}`).value = userName;
        document.getElementById(`transactionBalance${type.charAt(0).toUpperCase() + type.slice(1)}`).value = account.balance;
        
        // ล้างค่าและ focus ที่ช่องจำนวนเงิน
        const amountInput = document.getElementById(`transactionAmount${type.charAt(0).toUpperCase() + type.slice(1)}`);
        amountInput.value = '';
        
        // ใช้ setTimeout เพื่อให้แน่ใจว่า modal แสดงเรียบร้อยแล้ว
        setTimeout(() => {
            amountInput.focus();
        }, 100);

        // จัดการการส่งฟอร์ม
        form.onsubmit = async (e) => {
            e.preventDefault();
            await handleTransaction(e, type, account);
        };

    } catch (error) {
        console.error('Error fetching account data:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด!',
            text: 'ไม่สามารถโหลดข้อมูลบัญชีได้',
        });
        modal.style.display = 'none';
    }

    // ปิด modal
    document.querySelector(`#${modalId} .close`).onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
};

// เพิ่มฟังก์ชันใหม่สำหรับจัดการการทำธุรกรรม
const handleTransaction = async (event, type, account) => {
    const modalId = type === 'deposit' ? 'depositModal' : 'withdrawModal';
    const modal = document.getElementById(modalId);
    const amount = parseFloat(document.getElementById(`transactionAmount${type.charAt(0).toUpperCase() + type.slice(1)}`).value);
    const currentBalance = parseFloat(account.balance);

    if (!amount || amount <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'ข้อมูลไม่ถูกต้อง',
            text: 'กรุณากรอกจำนวนเงินที่ถูกต้อง',
        });
        return;
    }

    // ตรวจสอบการถอนเงิน
    if (type === 'withdraw' && currentBalance < amount) {
        Swal.fire({
            icon: 'error',
            title: 'ยอดเงินไม่พอ',
            text: 'ไม่สามารถถอนเงินเกินยอดเงินที่มีได้',
        });
        return;
    }

    // ตรวจสอบว่าต้องใช้ PIN ของ admin หรือไม่
    if (amount > 50000) {
        try {
            const { value: adminPin } = await Swal.fire({
                title: 'ต้องการการอนุมัติจาก Admin',
                text: 'กรุณากรอก PIN ของ Admin เพื่อดำเนินการ',
                input: 'password',
                inputAttributes: {
                    maxlength: 4,
                    pattern: '[0-9]*',
                    inputmode: 'numeric',
                    autocomplete: 'new-password',
                    placeholder: 'กรอก PIN 4 หลัก'
                },
                showCancelButton: true,
                confirmButtonText: 'ยืนยัน',
                cancelButtonText: 'ยกเลิก',
                inputValidator: (value) => {
                    if (!value) {
                        return 'กรุณากรอก PIN!';
                    }
                    if (value.length !== 4 || !/^\d+$/.test(value)) {
                        return 'PIN ต้องเป็นตัวเลข 4 หลัก!';
                    }
                }
            });

            if (!adminPin) {
                return; // ผู้ใช้กดยกเลิก
            }

            // ตรวจสอบ PIN กับ API
            const verifyResponse = await fetch('/api/admin/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: adminPin })
            });

            if (!verifyResponse.ok) {
                throw new Error('PIN ไม่ถูกต้อง');
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'การยืนยันล้มเหลว',
                text: error.message || 'ไม่สามารถยืนยัน PIN ได้ กรุณาลองใหม่อีกครั้ง',
            });
            return;
        }
    }

    const newBalance = type === 'deposit' ? currentBalance + amount : currentBalance - amount;

    // ยืนยันการทำธุรกรรม
    const confirmResult = await Swal.fire({
        title: 'ยืนยันการทำธุรกรรม?',
        text: `คุณต้องการ${type === 'deposit' ? 'ฝาก' : 'ถอน'}เงินจำนวน ${formatCurrency(amount)} บาท หรือไม่?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ใช่, ดำเนินการ!',
        cancelButtonText: 'ยกเลิก',
    });

    if (!confirmResult.isConfirmed) return;

    try {
        // ดึงชื่อผู้ใช้ก่อนทำธุรกรรม
        let userName = 'ไม่ระบุชื่อ';
        try {
            userName = await fetchUserName(account.id_member);
        } catch (error) {
            console.warn('Unable to fetch user name:', error);
        }

        // อัปเดตข้อมูลบัญชี
        const transactionResponse = await fetch(`/api/staff/saving/${account.id_member}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_account: account.id_account,
                balance: newBalance,
                id_member: account.id_member,
                id_staff: account.id_staff
            }),
        });

        if (!transactionResponse.ok) {
            const errorData = await transactionResponse.json();
            throw new Error(errorData.message || 'Failed to process transaction');
        }

        // บันทึกประวัติธุรกรรม
        const historyResponse = await fetch('/api/staff/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user: account._id,
                userName: userName,
                type: type === 'deposit' ? 'Deposit' : 'Withdraw',
                amount: amount,
                status: 'Completed',
                date: new Date().toISOString()
            }),
        });

        if (!historyResponse.ok) {
            const errorData = await historyResponse.json();
            console.error('Transaction history error:', errorData);
            throw new Error('Failed to save transaction history');
        }

        // ถามผู้ใช้ว่าต้องการพิมพ์สลิปหรือไม่
        const printSlip = await Swal.fire({
            icon: 'success',
            title: 'ทำรายการสำเร็จ!',
            text: 'คุณต้องการพิมพ์สลิปหรือไม่?',
            showCancelButton: true,
            confirmButtonText: 'พิมพ์สลิป',
            cancelButtonText: 'ไม่ต้องการ'
        });

        if (printSlip.isConfirmed) {
            // สร้างสลิปในรูปแบบ HTML
            const slip = document.createElement('div');
            slip.innerHTML = `
                <div class="slip-container" style="font-family: 'Sarabun', sans-serif; max-width: 210mm; margin: 0 auto; padding: 20px;">
                    <!-- หัวสลิป -->
                    <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 20px;">
                        <img src="/images/logo.png" alt="Logo" style="max-width: 100px; margin-bottom: 15px;">
                        <h2 style="font-size: 28px; font-weight: bold; margin: 8px 0;">ระบบออมทรัพย์</h2>
                        <h3 style="font-size: 22px; margin: 8px 0;">สลิป${type === 'deposit' ? 'ฝาก' : 'ถอน'}เงิน</h3>
                    </div>

                    <!-- ข้อมูลธุรกรรม -->
                    <div style="margin-bottom: 20px; font-size: 16px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 6px 0; width: 180px;">วันที่:</td>
                                <td style="text-align: left;">${new Date().toLocaleDateString('th-TH')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0;">เวลา:</td>
                                <td style="text-align: left;">${new Date().toLocaleTimeString('th-TH')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0;">เลขที่บัญชี:</td>
                                <td style="text-align: left;">${account.id_account}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0;">ชื่อบัญชี:</td>
                                <td style="text-align: left;">${userName}</td>
                            </tr>
                        </table>
                    </div>

                    <!-- รายละเอียดการทำรายการ -->
                    <div style="border: 2px solid #000; padding: 15px; margin: 20px 0; border-radius: 8px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-size: 18px; font-weight: bold;">ประเภทรายการ:</td>
                                <td style="text-align: right; font-size: 18px; font-weight: bold;">${type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'}</td>
                            </tr>
                            <tr style="border-top: 1px solid #ddd;">
                                <td style="padding: 12px 0; font-size: 20px; font-weight: bold;">จำนวนเงิน:</td>
                                <td style="text-align: right; font-size: 20px; font-weight: bold; color: ${type === 'deposit' ? '#28a745' : '#dc3545'}">
                                    ${formatCurrency(amount)} บาท
                                </td>
                            </tr>
                            <tr style="border-top: 1px solid #ddd;">
                                <td style="padding: 8px 0; font-size: 18px;">ยอดเงินคงเหลือ:</td>
                                <td style="text-align: right; font-size: 18px;">${formatCurrency(newBalance)} บาท</td>
                            </tr>
                        </table>
                    </div>

                    <!-- ข้อมูลผู้ทำรายการ -->
                    <div style="margin: 20px 0; font-size: 16px;">
                        <p style="margin: 8px 0;">ผู้ทำรายการ: ${await fetchStaffName(account.id_staff)}</p>
                    </div>

                    <!-- ลายเซ็นและการรับรอง -->
                    <div style="margin: 40px 0; display: flex; justify-content: space-between;">
                        <div style="text-align: center; flex: 1;">
                            <div style="border-top: 1px solid #000; margin-top: 60px; padding-top: 8px; width: 180px; display: inline-block;">
                                <p style="margin: 4px 0;">ลายมือชื่อผู้ทำรายการ</p>
                            </div>
                        </div>
                        <div style="text-align: center; flex: 1;">
                            <div style="border-top: 1px solid #000; margin-top: 60px; padding-top: 8px; width: 180px; display: inline-block;">
                                <p style="margin: 4px 0;">ลายมือชื่อผู้รับเงิน</p>
                            </div>
                        </div>
                    </div>

                    <!-- QR Code -->
                    <div style="text-align: center; margin: 20px 0;">
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" 
                             alt="QR Code" style="width: 120px; height: 120px;">
                    </div>

                    <!-- หมายเหตุ -->
                    <div style="text-align: center; font-size: 14px; color: #666; margin-top: 20px; border-top: 2px dashed #000; padding-top: 15px;">
                        <p style="margin: 4px 0;">เอกสารนี้เป็นหลักฐานการทำรายการ</p>
                        <p style="margin: 4px 0;">กรุณาเก็บไว้เพื่อการตรวจสอบ</p>
                        <p style="margin: 4px 0;">ขอบคุณที่ใช้บริการ</p>
                    </div>
                </div>
            `;

            // อัปเดตส่วนของการเปิดหน้าต่างพิมพ์
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>สลิป${type === 'deposit' ? 'ฝาก' : 'ถอน'}เงิน</title>
                        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
                        <style>
                            @page {
                                size: A4;
                                margin: 0;
                            }
                            body {
                                font-family: 'Sarabun', sans-serif;
                                margin: 0;
                                padding: 0;
                                background: #fff;
                            }
                            .slip-container {
                                width: 210mm;
                                height: 297mm;
                                padding: 15mm;
                                margin: 0 auto;
                                background: #fff;
                                box-sizing: border-box;
                                display: flex;
                                flex-direction: column;
                            }
                            @media print {
                                html, body {
                                    width: 210mm;
                                    height: 297mm;
                                }
                                .slip-container {
                                    page-break-after: always;
                                }
                            }
                        </style>
                    </head>
                    <body>${slip.innerHTML}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
            printWindow.close();
        }

        modal.style.display = 'none';
        await fetchAccount();
        event.target.reset();

    } catch (error) {
        console.error('Error processing transaction:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด!',
            text: error.message || 'ไม่สามารถทำธุรกรรมได้ กรุณาลองใหม่อีกครั้ง',
        });
    }
};

// const deleteAccount = async (userId) => {
//     const confirmDelete = await Swal.fire({
//         title: 'คุณแน่ใจหรือไม่?',
//         text: 'บัญชีนี้จะถูกลบถาวรและไม่สามารถกู้คืนได้!',
//         icon: 'warning',
//         showCancelButton: true,
//         confirmButtonColor: '#d33',
//         cancelButtonColor: '#3085d6',
//         confirmButtonText: 'ใช่, ลบเลย!',
//         cancelButtonText: 'ยกเลิก',
//     });

//     if (!confirmDelete.isConfirmed) {
//         console.log('❌ User cancelled the deletion.');
//         return; // ยกเลิกการลบถ้าผู้ใช้ไม่ยืนยัน
//     }

//     try {
//         const response = await fetch(`/api/staff/saving/${userId}`, {
//             method: 'DELETE',
//         });

//         if (!response.ok) {
//             throw new Error('Failed to delete account');
//         }

//         await Swal.fire({
//             icon: 'success',
//             title: 'ลบสำเร็จ!',
//             text: 'บัญชีถูกลบเรียบร้อยแล้ว',
//         });

//         // เรียกใช้ฟังก์ชันรีเฟรชข้อมูลบัญชี
//         await fetchAccount();
//     } catch (error) {
//         console.error('Error deleting account:', error);
//         Swal.fire({
//             icon: 'error',
//             title: 'เกิดข้อผิดพลาด!',
//             text: 'ไม่สามารถลบบัญชีได้ กรุณาลองใหม่อีกครั้ง',
//         });
//     }
// };

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

// เพิ่มฟังก์ชันการค้นหา
const setupSearch = () => {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', async function() {
        const searchTerm = this.value.toLowerCase();
        const tableBody = document.getElementById('accountTableBody');
        const rows = tableBody.getElementsByTagName('tr');

        for (const row of rows) {
            const accountId = row.cells[0]?.textContent || '';
            const userName = row.cells[1]?.textContent || '';
            
            // ค้นหาทั้งจากเลขบัญชีและชื่อผู้ใช้
            const matchesSearch = accountId.toLowerCase().includes(searchTerm) || 
                                userName.toLowerCase().includes(searchTerm);

            row.style.display = matchesSearch ? '' : 'none';
        }

        // แสดงข้อความเมื่อไม่พบข้อมูล
        let visibleRows = 0;
        for (const row of rows) {
            if (row.style.display !== 'none') {
                visibleRows++;
            }
        }

        if (visibleRows === 0) {
            const noDataRow = document.createElement('tr');
            noDataRow.id = 'noDataRow';
            noDataRow.innerHTML = `
                <td colspan="6" class="text-center py-4">
                    ไม่พบข้อมูลที่ค้นหา
                </td>
            `;
            // ลบข้อความ "ไม่พบข้อมูล" เก่าออกก่อน (ถ้ามี)
            const existingNoDataRow = document.getElementById('noDataRow');
            if (existingNoDataRow) {
                existingNoDataRow.remove();
            }
            tableBody.appendChild(noDataRow);
        } else {
            // ลบข้อความ "ไม่พบข้อมูล" ถ้ามีข้อมูลแสดง
            const noDataRow = document.getElementById('noDataRow');
            if (noDataRow) {
                noDataRow.remove();
            }
        }
    });
};