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

// เพิ่มตัวแปรสำหรับจัดการ pagination
let currentPage = 1;
const rowsPerPage = 8;
let totalPages = 1;
let allTransactions = []; // เก็บข้อมูลธุรกรรมทั้งหมด

document.addEventListener("DOMContentLoaded", function() {
    const storedUserName = localStorage.getItem('currentUser');
    const localStorageName = JSON.parse(storedUserName).name;

    // ดึงข้อมูลประวัติการทำรายการจาก API
    fetch('/api/staff/transactions')
        .then(response => response.json())
        .then(data => {
            allTransactions = data.filter(transaction => String(transaction.userName) === localStorageName);
            populateTransactionTable(allTransactions);
        })
        .catch(error => {
            console.error("Error fetching transactions:", error);
        });
});

// ฟังก์ชั่นในการแสดงข้อมูลในตาราง
function populateTransactionTable(transactions) {
    const tableBody = document.querySelector("#transactionTable tbody");
    tableBody.innerHTML = "";

    if (!transactions || transactions.length === 0) {
        // ถ้าไม่มีข้อมูล
        const emptyRow = document.createElement("tr");
        const emptyCell = document.createElement("td");
        emptyCell.colSpan = 3;
        emptyCell.classList.add("px-4", "py-8", "text-center", "text-gray-500", "border-b", "border-gray-200");
        emptyCell.innerHTML = `
            <div class="flex flex-col items-center justify-center">
                <i class="fas fa-inbox text-gray-400 text-4xl mb-3"></i>
                <p class="text-lg">ไม่พบรายการธุรกรรม</p>
            </div>
        `;
        emptyRow.appendChild(emptyCell);
        tableBody.appendChild(emptyRow);
        return;
    }

    // คำนวณจำนวนหน้าทั้งหมด
    totalPages = Math.ceil(transactions.length / rowsPerPage);

    // คำนวณ index เริ่มต้นและสิ้นสุดของข้อมูลที่จะแสดงในหน้าปัจจุบัน
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    
    // กรองข้อมูลที่จะแสดงในหน้าปัจจุบัน
    const transactionsToDisplay = transactions.slice(startIndex, endIndex);

    transactionsToDisplay.forEach(transaction => {
        const row = document.createElement("tr");
        row.classList.add("hover:bg-gray-50", "transition-colors", "duration-150");

        // จัดรูปแบบวันที่
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        // สร้างและจัดรูปแบบเซลล์วันที่
        const dateCell = document.createElement("td");
        dateCell.classList.add("px-4", "py-3", "text-sm", "text-gray-700", "border-b", "border-gray-200");
        dateCell.innerHTML = `
            <div class="flex items-center">
                <i class="far fa-calendar-alt text-green-500 mr-2"></i>
                ${formattedDate}
            </div>
        `;

        // สร้างและจัดรูปแบบเซลล์ประเภทรายการ
        const typeCell = document.createElement("td");
        typeCell.classList.add("px-4", "py-3", "text-sm", "border-b", "border-gray-200", "text-center");
        
        // ตรวจสอบประเภทรายการและกำหนดไอคอนและสี
        const isDeposit = transaction.type.toLowerCase() === 'deposit';
        const typeSpan = document.createElement("span");
        typeSpan.classList.add("px-3", "py-1", "rounded-full", "text-sm", "font-medium", "inline-flex", "items-center");
        
        if (isDeposit) {
            typeSpan.classList.add("bg-green-100", "text-green-800");
            typeSpan.innerHTML = `
                <i class="fas fa-arrow-up text-green-600 mr-2"></i>
                ฝากเงิน
            `;
        } else {
            typeSpan.classList.add("bg-red-100", "text-red-800");
            typeSpan.innerHTML = `
                <i class="fas fa-arrow-down text-red-600 mr-2"></i>
                ถอนเงิน
            `;
        }
        typeCell.appendChild(typeSpan);

        // สร้างและจัดรูปแบบเซลล์จำนวนเงิน
        const amountCell = document.createElement("td");
        amountCell.classList.add("px-4", "py-3", "text-sm", "border-b", "border-gray-200", "font-medium", "text-right");
        
        const amount = isDeposit ? 
            `+${transaction.amount.toLocaleString('th-TH')}` : 
            `-${transaction.amount.toLocaleString('th-TH')}`;
        
        amountCell.innerHTML = `
            <span class="${isDeposit ? 'text-green-600' : 'text-red-600'}">
                ${amount} บาท
            </span>
        `;

        // เพิ่มเซลล์ทั้งหมดลงในแถว
        row.appendChild(dateCell);
        row.appendChild(typeCell);
        row.appendChild(amountCell);
        tableBody.appendChild(row);
    });

    // สร้าง pagination controls
    renderPagination();
}

// เพิ่มฟังก์ชันสำหรับสร้าง pagination controls
const renderPagination = () => {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) {
        // สร้าง container สำหรับ pagination ถ้ายังไม่มี
        const container = document.createElement('div');
        container.id = 'pagination';
        container.className = 'flex justify-center items-center space-x-2 mt-4';
        document.querySelector('#transactionTable').parentNode.appendChild(container);
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
        populateTransactionTable(allTransactions);
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
