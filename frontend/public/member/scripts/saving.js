document.addEventListener('DOMContentLoaded', () => {
    // Observer สำหรับ sidebar
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
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
        
        // ดึงข้อมูลบัญชีผู้ใช้
        fetchUserAccount();
        
        // ดึงข้อมูลประวัติการทำรายการจาก API
        fetch('/api/staff/transactions')
            .then(response => response.json())
            .then(data => {
                allTransactions = data.filter(transaction => String(transaction.userName) === userName);
                filteredTransactions = [...allTransactions]; // เก็บข้อมูลทั้งหมดไว้ก่อนกรอง
                populateTransactionTable(filteredTransactions);
                calculateTotalAmounts(filteredTransactions); // คำนวณยอดรวม
                
                // เพิ่ม event listener สำหรับการค้นหา
                const searchInput = document.getElementById('searchTransaction');
                if (searchInput) {
                    searchInput.addEventListener('input', handleSearch);
                }
            })
            .catch(error => {
                console.error("Error fetching transactions:", error);
            });
    } else {
        // หากไม่มีข้อมูลผู้ใช้ใน localStorage
        document.getElementById('userName').textContent = 'ไม่พบข้อมูลผู้ใช้';
        document.getElementById('userAvatar').textContent = 'N/A';
    }
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
            document.getElementById('accountCreatedAt').textContent = new Date(account.createdAt).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('accountStaffName').textContent = await fetchUserName(account.id_staff);
            
            // แสดงข้อมูลหุ้น
            const shares = account.shares || 0;
            document.getElementById('accountShares').textContent = shares;
            
            // คำนวณมูลค่าหุ้น (1 หุ้น = 100 บาท)
            const sharesValue = shares * 100;
            document.getElementById('sharesValue').textContent = sharesValue.toLocaleString('th-TH') + ' บาท';
            
            // เพิ่มเอฟเฟกต์เล็กๆ น้อยๆ
            animateValue('accountShares', 0, shares, 1000);
            animateValue('accountBalance', 0, account.balance, 1000);
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

// ฟังก์ชันสำหรับทำ animation ตัวเลข
const animateValue = (elementId, start, end, duration, isTotal = false) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        
        if (isTotal) {
            element.textContent = value.toLocaleString('th-TH') + ' บาท';
        } else if (elementId === 'accountBalance') {
            element.textContent = value.toFixed(2);
        } else {
            element.textContent = value;
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
};

// ตัวแปรสำหรับเก็บข้อมูลธุรกรรมทั้งหมด
let allTransactions = []; // เก็บข้อมูลธุรกรรมทั้งหมด
let filteredTransactions = []; // เก็บข้อมูลธุรกรรมที่กรองแล้ว

// ตัวแปรสำหรับจัดการ pagination
let currentPage = 1;
const rowsPerPage = 8;
let totalPages = 1;

// ฟังก์ชันสำหรับค้นหาธุรกรรม
const handleSearch = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    
    if (searchTerm.trim() === '') {
        filteredTransactions = [...allTransactions]; // คืนค่าข้อมูลทั้งหมดเมื่อไม่มีคำค้นหา
    } else {
        filteredTransactions = allTransactions.filter(transaction => {
            const date = new Date(transaction.date).toLocaleDateString('th-TH').toLowerCase();
            const type = transaction.type.toLowerCase();
            const amount = transaction.amount.toString();
            
            return date.includes(searchTerm) || 
                   type.includes(searchTerm) || 
                   amount.includes(searchTerm);
        });
    }
    
    populateTransactionTable(filteredTransactions);
    calculateTotalAmounts(filteredTransactions);
};

// ฟังก์ชันคำนวณยอดรวมของแต่ละประเภทธุรกรรม
const calculateTotalAmounts = (transactions) => {
    let totalDeposit = 0;
    let totalWithdraw = 0;
    let totalBuyShares = 0;
    
    transactions.forEach(transaction => {
        const transactionType = transaction.type.toLowerCase();
        if (transactionType === 'deposit') {
            totalDeposit += transaction.amount;
        } else if (transactionType === 'withdraw') {
            totalWithdraw += transaction.amount;
        } else if (transactionType === 'buyshares') {
            totalBuyShares += transaction.amount;
        }
    });
    
    // แสดงยอดรวมในหน้าเว็บ
    document.getElementById('totalDeposit').textContent = totalDeposit.toLocaleString('th-TH') + ' บาท';
    document.getElementById('totalWithdraw').textContent = totalWithdraw.toLocaleString('th-TH') + ' บาท';
    document.getElementById('totalBuyShares').textContent = totalBuyShares.toLocaleString('th-TH') + ' บาท';
    
    // เพิ่ม animation สำหรับการแสดงยอดรวม
    animateValue('totalDeposit', 0, totalDeposit, 1000, true);
    animateValue('totalWithdraw', 0, totalWithdraw, 1000, true);
    animateValue('totalBuyShares', 0, totalBuyShares, 1000, true);
};

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
        
        // รีเซ็ตค่า pagination
        totalPages = 1;
        currentPage = 1;
        renderPagination();
        return;
    }

    // คำนวณจำนวนหน้าทั้งหมด
    totalPages = Math.ceil(transactions.length / rowsPerPage);

    // ถ้าหน้าปัจจุบันมากกว่าจำนวนหน้าทั้งหมด ให้กลับไปที่หน้าแรก
    if (currentPage > totalPages) {
        currentPage = 1;
    }

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
        const transactionType = transaction.type.toLowerCase();
        const typeSpan = document.createElement("span");
        typeSpan.classList.add("px-3", "py-1", "rounded-full", "text-sm", "font-medium", "inline-flex", "items-center");
        
        if (transactionType === 'deposit') {
            typeSpan.classList.add("bg-green-100", "text-green-800");
            typeSpan.innerHTML = `
                <i class="fas fa-arrow-up text-green-600 mr-2"></i>
                ฝากเงิน
            `;
        } else if (transactionType === 'buyshares') {
            typeSpan.classList.add("bg-yellow-100", "text-yellow-800");
            typeSpan.innerHTML = `
                <i class="fas fa-coins text-yellow-600 mr-2"></i>
                ซื้อหุ้น
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
        
        let amountDisplay;
        let textColorClass;
        
        if (transactionType === 'deposit') {
            amountDisplay = `+${transaction.amount.toLocaleString('th-TH')}`;
            textColorClass = 'text-green-600';
        } else if (transactionType === 'buyshares') {
            amountDisplay = `${transaction.amount.toLocaleString('th-TH')}`;
            textColorClass = 'text-yellow-600';
        } else {
            amountDisplay = `-${transaction.amount.toLocaleString('th-TH')}`;
            textColorClass = 'text-red-600';
        }
        
        amountCell.innerHTML = `
            <span class="${textColorClass}">
                ${amountDisplay} บาท
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
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = '';
    
    // ไม่ต้องแสดง pagination ถ้ามีข้อมูลแค่หน้าเดียว
    if (totalPages <= 1) return;
    
    // สร้าง pagination div ใหม่
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'flex justify-center items-center space-x-2 mt-6 p-3 rounded-lg mx-auto max-w-md';
    
    // สร้างปุ่มย้อนกลับ
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.className = 'px-3 py-2 rounded-md ' + 
                          (currentPage === 1 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-green-500 text-white hover:bg-green-600 transition-colors');
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => changePage(currentPage - 1);
    paginationDiv.appendChild(prevButton);

    // แสดงข้อความหน้าปัจจุบัน/ทั้งหมด
    const pageInfo = document.createElement('span');
    pageInfo.className = 'px-3 py-2 bg-gray-100 rounded-md font-medium text-gray-700';
    pageInfo.textContent = `หน้า ${currentPage} จาก ${totalPages}`;
    paginationDiv.appendChild(pageInfo);
    
    // สร้างปุ่มถัดไป
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.className = 'px-3 py-2 rounded-md ' + 
                          (currentPage === totalPages 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-green-500 text-white hover:bg-green-600 transition-colors');
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => changePage(currentPage + 1);
    paginationDiv.appendChild(nextButton);
    
    paginationContainer.appendChild(paginationDiv);
};

// เพิ่มฟังก์ชันสำหรับเปลี่ยนหน้า
const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        populateTransactionTable(filteredTransactions); // ใช้ filteredTransactions แทน allTransactions
    }
};

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