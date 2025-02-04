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

// ฟังก์ชันสำหรับ Logout
const logout = async () => {
    try {
        // ✅ เรียก API logout ไปที่ backend
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            // ✅ ลบข้อมูล LocalStorage
            localStorage.removeItem("currentUser");
            localStorage.removeItem("selectedTheme");

            alert("Logout successful! Redirecting to login page...");
            window.location.href = "/"; // ✅ เปลี่ยนเส้นทางไปหน้า Login
        } else {
            alert("Logout failed. Please try again.");
        }
    } catch (error) {
        console.error("Error during logout:", error);
        alert("An error occurred while logging out.");
    }
};

// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
window.onload = () => {

    // เพิ่ม Event Listener สำหรับปุ่ม Logout
    document.getElementById('logoutButton').addEventListener('click', logout);
};

// ฟังก์ชันสำหรับ Toggle Sidebar
const toggleSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('collapsed');
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
                    <td>${account._id}</td>
                    <td>${userName}</td>
                    <td>${formatCurrency(account.balance)}</td>
                    <td>${staffName}</td>
                    <td>${convertToBuddhistYear(account.createdAt)}</td>
                    <td>
                        <button class="deposit-btn" data-user-id="${account.id_member}" onclick="openTransactionModal('${account.id_member}', 'deposit')">
                            <i class="fa fa-bank"></i> Action
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

    modal.style.display = 'block';  // แสดง modal

    // เติมค่า Staff ID ลงในฟอร์มโดยอัตโนมัติ
    const staffId = getStaffIdFromLocalStorage();
    if (staffId) document.getElementById('addStaffId').value = staffId;

    // ดึงรายชื่อจาก API
    const fetchNames = async () => {
        try {
            const response = await fetch('/api/admin/users');
            const users = await response.json();

            if (response.ok && Array.isArray(users)) {
                nameSelect.innerHTML = '';  // ลบ option เก่าทั้งหมด
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user._id;
                    option.textContent = user.name;
                    nameSelect.appendChild(option);
                });
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
    
    nameSelect.addEventListener('click', (event) => {
        selectedUserIdInput.value = event.target.value;
    });

    // ปิด modal เมื่อคลิกปุ่ม close หรือคลิกนอก modal
    document.querySelector('#addUserModal .close').onclick = () => modal.style.display = 'none';
    window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };

    // ฟังก์ชันสำหรับการล้างฟอร์ม
    const resetForm = () => {
        form.reset();  // ล้างค่าฟอร์ม
        selectedUserIdInput.value = '';  // ล้างค่า userId
    };

     // ฟังก์ชันตรวจสอบข้อมูลซ้ำ
     const checkDuplicateUser = async (id_member) => {
        try {
            const response = await fetch(`/api/staff/saving/check/${id_member}`);
            const result = await response.json();

            if (response.ok && result.exists) {
                return true;  // ถ้ามีผู้ใช้นั้นอยู่แล้ว
            }
            return false;  // ถ้าไม่มีผู้ใช้นั้น
        } catch (error) {
            console.error('Error checking for duplicate user:', error);
            return false;
        }
    };

    // ส่งฟอร์ม
    form.onsubmit = async (e) => {
        e.preventDefault();

        const id_member = selectedUserIdInput.value;
        const balance = document.getElementById('addBalance').value;
        const id_staff = document.getElementById('addStaffId').value;

        if (!id_member) {
            alert('Please select a valid name.');
            return;
        }

        // ตรวจสอบข้อมูลซ้ำ
        const isDuplicate = await checkDuplicateUser(id_member);
        if (isDuplicate) {
            alert('This user already exists in the system.');
            return;
        }

        const newUser = { id_member, balance, id_staff };

        try {
            const response = await fetch('/api/staff/saving', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to add user');

            console.log('User added successfully');
            await fetchAccount();  // รีเฟรชข้อมูลบัญชี
            modal.style.display = 'none';
            alert('User added successfully');
            resetForm();  // ล้างฟอร์มหลังการบันทึก
        } catch (error) {
            console.error('Error adding user:', error);
            alert(error.message || 'Failed to add user. Please try again.');
        }
    };
};

const openEditModal = async (userId) => {
    const modal = document.getElementById('editUserModal');
    const form = document.getElementById('editUserForm');

    if (!modal || !form) {
        console.error('Modal or form not found');
        return;
    }

    modal.style.display = 'block';
    try {
        const response = await fetch(`/api/staff/saving/${userId}`);
        const account = await response.json();

        if (!response.ok || !account) {
            throw new Error('Failed to fetch account data');
        }

        document.getElementById('editUserId').value = account._id;
        document.getElementById('editName').value = await fetchUserName(account.id_member);
        document.getElementById('editBalance').value = formatNumber(account.balance);
        document.getElementById('editStaffId').value = await fetchUserName(account.id_staff);
    } catch (error) {
        console.error('Error fetching account data:', error);
        alert('Failed to load user data for editing');
        modal.style.display = 'none';
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const balance = parseFloat(document.getElementById('editBalance').value.replace(/,/g, ''));

        if (isNaN(balance) || balance < 0) {
            alert('Please enter a valid balance.');
            return;
        }

        try {
            const response = await fetch(`/api/staff/saving/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ balance }),
            });

            if (!response.ok) throw new Error('Failed to save user data');

            alert('User data updated successfully!');
            modal.style.display = 'none';
            fetchAccount();
        } catch (error) {
            console.error('Error saving user data:', error);
            alert('Failed to save user data. Please try again.');
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
        document.getElementById('transactionUserId').value = account._id;
        document.getElementById('transactionName').value = await fetchUserName(account.id_member);
        document.getElementById('transactionBalance').value = account.balance;
        document.getElementById('transactionStaffId').value = await fetchStaffName(account.id_staff);

    } catch (error) {
        console.error('Error fetching account data:', error);
        alert('Failed to load user data for transaction');
        modal.style.display = 'none';
    }

    // เมื่อฟอร์มถูกส่ง
    form.onsubmit = async (e) => {
        e.preventDefault();

        const transactionType = document.querySelector('input[name="transactionType"]:checked').value; // ฝากหรือถอน
        const transactionAmount = parseFloat(document.getElementById('transactionAmount').value); // ปรับให้เป็นเลขทศนิยม

        if (!transactionAmount || transactionAmount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        // ดึงยอดเงินปัจจุบันจากฟอร์ม
        const currentBalance = parseFloat(document.getElementById('transactionBalance').value);

        let newBalance = 0;
        if (transactionType === 'deposit') {
            // หากฝาก เงินต้องเพิ่มยอดเข้าไป
            newBalance = currentBalance + transactionAmount;
        } else if (transactionType === 'withdraw') {
            // หากถอน เงินต้องลดยอดออก
            if (currentBalance < transactionAmount) {
                alert('Insufficient balance for withdrawal.');
                return;
            }
            newBalance = currentBalance - transactionAmount;
        }

        // สร้างข้อมูลการทำธุรกรรม
        const transactionData = {
            amount: transactionAmount,
            type: transactionType, // 'deposit' หรือ 'withdraw'
            newBalance: newBalance, // ยอดเงินใหม่
        };

        try {
            // ส่งข้อมูลการทำธุรกรรมไปยัง API เพื่อบันทึกการทำธุรกรรม
            const transactionResponse = await fetch(`/api/staff/saving/transaction/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
            });

            if (!transactionResponse.ok) {
                throw new Error('Failed to process transaction');
            }

            // ข้อมูลการทำธุรกรรมที่ใช้บันทึกประวัติ
            const transactionHistory = {
                user: await fetchUserName(userId),
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
                console.log(transactionHistory)
                throw new Error('Failed to save transaction history');
            }

            alert('Transaction processed and history saved successfully!');
            modal.style.display = 'none';  // ปิด modal
            await fetchAccount();  // รีเฟรชข้อมูลบัญชี

            // ล้างฟอร์มหลังการทำธุรกรรม
            form.reset();

        } catch (error) {
            console.error('Error processing transaction:', error);
            alert('Failed to process transaction. Please try again.');
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


document.getElementById('addUserButton').addEventListener('click', openAddUserModal);

// แก้ไขที่นี่
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

// เพิ่ม Event Listener สำหรับปุ่ม Toggle Sidebar
document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
