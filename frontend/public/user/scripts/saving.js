window.onload = () => {
    // เพิ่ม Event Listener สำหรับปุ่ม Logout
    document.getElementById('logoutButton').addEventListener('click', logout);
};

document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

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
// Sidebar Observer
// ===============================
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

const getUserIdFromLocalStorage = () => {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        console.error('User data not found in localStorage.');
        return null;
    }

    try {
        const user = JSON.parse(userData);
        return user?._id || null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};

// ฟังก์ชันดึงข้อมูลบัญชีเฉพาะของผู้ใช้ที่ล็อกอิน
const fetchUserAccount = async () => {
    const userId = getUserIdFromLocalStorage();
    if (!userId) {
        document.getElementById('accountContainer').innerHTML = '<p class="error">User not found. Please login again.</p>';
        return;
    }

    try {
        const response = await fetch(`/api/staff/saving/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch account data');

        const account = await response.json();

        if (account && account.balance != null && account.createdAt) {
            // อัปเดตข้อมูลบัญชีใน UI
            document.getElementById('accountId').textContent = account.id_account;
            document.getElementById('accountBalance').textContent = account.balance.toFixed(2);
            document.getElementById('accountCreatedAt').textContent = new Date(account.createdAt).toLocaleDateString();
            document.getElementById('accountStaffName').textContent = await fetchUserName(account.id_staff);
        } else {
            document.getElementById('accountContainer').innerHTML = '<p class="error">Account data is incomplete.</p>';
        }
    } catch (error) {
        console.error('Error fetching user account:', error);
        document.getElementById('accountContainer').innerHTML = '<p class="error">Failed to load account data.</p>';
    }
};



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

document.addEventListener("DOMContentLoaded", function() {
    const storedUserName = localStorage.getItem('currentUser');
    const localStorageName = JSON.parse(storedUserName).name;

    // ดึงข้อมูลประวัติการทำรายการจาก API
    fetch('/api/staff/transactions')
        .then(response => response.json())
        .then(data => {
            const filteredTransactions = data.filter(transaction => String(transaction.userName) === localStorageName);
                populateTransactionTable(filteredTransactions);
            })
        .catch(error => {
            console.error("Error fetching transactions:", error);
        });
});

// ฟังก์ชั่นในการแสดงข้อมูลในตาราง
function populateTransactionTable(transactions) {
    const tableBody = document.querySelector("#transactionTable tbody");
    tableBody.innerHTML = "";

    transactions.forEach(transaction => {
        const row = document.createElement("tr");
        row.classList.add("hover:bg-green-50", "transition-colors", "duration-150");

        // จัดรูปแบบวันที่
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // สร้างและจัดรูปแบบเซลล์วันที่
        const dateCell = document.createElement("td");
        dateCell.classList.add("px-4", "py-3", "text-sm", "text-gray-700", "border-b", "border-green-200");
        dateCell.textContent = formattedDate;

        // สร้างและจัดรูปแบบเซลล์ประเภทรายการ
        const typeCell = document.createElement("td");
        typeCell.classList.add("px-4", "py-3", "text-sm", "border-b", "border-green-200");
        const typeSpan = document.createElement("span");
        typeSpan.classList.add("px-3", "py-1", "rounded-full", "text-sm", "font-medium");
        
        if (transaction.type === "deposit") {
            typeSpan.classList.add("bg-green-100", "text-green-800");
            typeSpan.textContent = "ฝากเงิน";
        } else {
            typeSpan.classList.add("bg-red-100", "text-red-800");
            typeSpan.textContent = "ถอนเงิน";
        }
        typeCell.appendChild(typeSpan);

        // สร้างและจัดรูปแบบเซลล์จำนวนเงิน
        const amountCell = document.createElement("td");
        amountCell.classList.add("px-4", "py-3", "text-sm", "border-b", "border-green-200", "font-medium");
        const amount = transaction.type === "deposit" ? 
            `+${transaction.amount.toLocaleString('th-TH')}` : 
            `-${transaction.amount.toLocaleString('th-TH')}`;
        amountCell.classList.add(transaction.type === "deposit" ? "text-green-600" : "text-red-600");
        amountCell.textContent = `${amount} บาท`;

        // เพิ่มเซลล์ทั้งหมดลงในแถว
        row.appendChild(dateCell);
        row.appendChild(typeCell);
        row.appendChild(amountCell);
        tableBody.appendChild(row);
    });

    // ถ้าไม่มีข้อมูล
    if (transactions.length === 0) {
        const emptyRow = document.createElement("tr");
        const emptyCell = document.createElement("td");
        emptyCell.colSpan = 3;
        emptyCell.classList.add("px-4", "py-4", "text-center", "text-gray-500", "border-b", "border-green-200");
        emptyCell.textContent = "ไม่พบรายการธุรกรรม";
        emptyRow.appendChild(emptyCell);
        tableBody.appendChild(emptyRow);
    }
}

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

// ฟังก์ชันเรียกใช้เมื่อต้องการโหลดข้อมูลบัญชี
document.addEventListener('DOMContentLoaded', () => {
    fetchUserAccount();
});
