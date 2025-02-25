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

const fetchAccount = async () => {
    try {
        const response = await fetch('/api/staff/saving');
        const data = await response.json();
        const tableBody = document.getElementById('accountTableBody');
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No accounts available.</td></tr>';
        } else {
            for (const account of data) {
                const userName = await fetchUserName(account.id_member);
                const staffName = await fetchUserName(account.id_staff);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${account.id_account}</td>
                    <td>${userName}</td>
                    <td>${formatCurrency(account.balance)}</td>
                    <td>${staffName}</td>
                    <td>${convertToBuddhistYear(account.createdAt)}</td>
                    <td>
                        <button class="deposit-btn bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50" 
                                data-user-id="${account.id_member}" 
                                onclick="openTransactionModal('${account.id_member}', 'deposit')">
                            <i class="fa fa-bank"></i> ทำรายการ
                        </button>
                    </td>
                    <td>
                        <button class="delete-btn bg-red-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-red-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50"
                                data-user-id="${account.id_member}"
                                onclick="deleteAccount('${account.id_member}', 'withdraw')">
                            <i class="fa fa-bank"></i> ลบบัญชี
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            }
        }
    } catch (error) {
        console.error('Error fetching account data:', error);
        const tableBody = document.getElementById('accountTableBody');
        tableBody.innerHTML = '<tr><td colspan="6">Failed to load data.</td></tr>';
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

const openTransactionModal = async (userId) => {
    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');

    if (!modal || !form) {
        console.error('Modal or form not found');
        return;
    }

    modal.style.display = 'block'; // แสดง modal

    // ดึงข้อมูลผู้ใช้จาก API
    try {
        const response = await fetch(`/api/staff/saving/${userId}`);
        const account = await response.json();

        if (!response.ok || !account) {
            throw new Error('Failed to fetch account data');
        }

        // แสดงข้อมูลในฟอร์ม
        document.getElementById('transactionAccountId').value = account.id_account;
        document.getElementById('transactionUserId').value = account._id;
        document.getElementById('transactionName').value = await fetchUserName(account.id_member);
        document.getElementById('transactionBalance').value = account.balance;

    } catch (error) {
        console.error('Error fetching account data:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด!',
            text: 'ไม่สามารถโหลดข้อมูลบัญชีได้',
        });
        modal.style.display = 'none';
        return;
    }

    // เมื่อฟอร์มถูกส่ง
    form.onsubmit = async (e) => {
        e.preventDefault();

        const transactionType = document.querySelector('input[name="transactionType"]:checked').value; // ฝากหรือถอน
        const transactionAmount = parseFloat(document.getElementById('transactionAmount').value); // ปรับให้เป็นเลขทศนิยม

        if (!transactionAmount || transactionAmount <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ถูกต้อง',
                text: 'กรุณากรอกจำนวนเงินที่ถูกต้อง',
            });
            return;
        }

        // ดึงยอดเงินปัจจุบันจากฟอร์ม
        const currentBalance = parseFloat(document.getElementById('transactionBalance').value);

        let newBalance = 0;
        if (transactionType === 'deposit') {
            newBalance = currentBalance + transactionAmount;
        } else if (transactionType === 'withdraw') {
            if (currentBalance < transactionAmount) {
                Swal.fire({
                    icon: 'error',
                    title: 'ยอดเงินไม่พอ',
                    text: 'ไม่สามารถถอนเงินเกินยอดเงินที่มีได้',
                });
                return;
            }
            newBalance = currentBalance - transactionAmount;
        }

        // ยืนยันก่อนทำธุรกรรม
        const confirmTransaction = await Swal.fire({
            title: 'ยืนยันการทำธุรกรรม?',
            text: `คุณต้องการ ${transactionType === 'deposit' ? 'ฝาก' : 'ถอน'} เงินจำนวน ${transactionAmount} หรือไม่?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#d33',
            confirmButtonText: 'ใช่, ดำเนินการ!',
            cancelButtonText: 'ยกเลิก',
        });

        if (!confirmTransaction.isConfirmed) {
            console.log('❌ ผู้ใช้ยกเลิกการทำธุรกรรม');
            return;
        }

        // สร้างข้อมูลการทำธุรกรรม
        const transactionData = {
            amount: transactionAmount,
            type: transactionType, // 'deposit' หรือ 'withdraw'
            balance: newBalance, // ยอดเงินใหม่
        };

        try {
            // ส่งข้อมูลการทำธุรกรรมไปยัง API เพื่อบันทึกการทำธุรกรรม
            const transactionResponse = await fetch(`/api/staff/saving/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
            });

            if (!transactionResponse.ok) {
                throw new Error('Failed to process transaction');
            }

            // ข้อมูลการทำธุรกรรมที่ใช้บันทึกประวัติ
            const transactionHistory = {
                user: userId,
                type: transactionType === 'deposit' ? 'Deposit' : 'Withdraw',
                amount: transactionAmount,
                status: 'Completed', // ใช้สถานะนี้เป็นตัวอย่าง
                date: new Date().toISOString(),
            };

            // ส่งข้อมูลการทำธุรกรรมไปยัง API เพื่อบันทึกประวัติ
            const historyResponse = await fetch('/api/staff/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionHistory),
            });

            if (!historyResponse.ok) {
                throw new Error('Failed to save transaction history');
            }

            Swal.fire({
                icon: 'success',
                title: 'ทำรายการสำเร็จ!',
                text: 'ธุรกรรมของคุณได้รับการบันทึกแล้ว',
            });

            modal.style.display = 'none';  // ปิด modal
            await fetchAccount();  // รีเฟรชข้อมูลบัญชี
            form.reset();  // ล้างฟอร์มหลังการทำธุรกรรม

        } catch (error) {
            console.error('Error processing transaction:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด!',
                text: 'ไม่สามารถทำธุรกรรมได้ กรุณาลองใหม่อีกครั้ง',
            });
        }
    };

    // ปิด modal เมื่อคลิกปุ่ม close (×)
    document.querySelector('#transactionModal .close').onclick = () => {
        modal.style.display = 'none';
    };

    // ปิด modal เมื่อคลิกนอก modal
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
};


const deleteAccount = async (userId) => {
    const confirmDelete = await Swal.fire({
        title: 'คุณแน่ใจหรือไม่?',
        text: 'บัญชีนี้จะถูกลบถาวรและไม่สามารถกู้คืนได้!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ลบเลย!',
        cancelButtonText: 'ยกเลิก',
    });

    if (!confirmDelete.isConfirmed) {
        console.log('❌ User cancelled the deletion.');
        return; // ยกเลิกการลบถ้าผู้ใช้ไม่ยืนยัน
    }

    try {
        const response = await fetch(`/api/staff/saving/${userId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete account');
        }

        await Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ!',
            text: 'บัญชีถูกลบเรียบร้อยแล้ว',
        });

        // เรียกใช้ฟังก์ชันรีเฟรชข้อมูลบัญชี
        await fetchAccount();
    } catch (error) {
        console.error('Error deleting account:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด!',
            text: 'ไม่สามารถลบบัญชีได้ กรุณาลองใหม่อีกครั้ง',
        });
    }
};

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

const logout = async () => {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            // ลบข้อมูลจาก LocalStorage
            localStorage.removeItem("currentUser");
            localStorage.removeItem("selectedTheme");

             // แสดงข้อความด้วย SweetAlert2
            await Swal.fire({
                icon: 'success',
                title: 'Logout successful!',
                text: 'You have been logged out. Redirecting to login page...',
                timer: 1000, // ตั้งเวลาแสดง 2 วินาที
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
document.getElementById('addUserButton').addEventListener('click', openAddUserModal);

document.addEventListener('DOMContentLoaded', () => {
    // เพิ่ม event listener สำหรับปุ่ม "แก้ไข" ภายใน DOMContentLoaded
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const userId = event.target.closest('button').getAttribute('data-user-id');
            openTransactionModal(userId); // เรียกใช้ openEditModal
        });
    });
    // รีเฟรชข้อมูลบัญชี
    fetchAccount();
});

document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);

