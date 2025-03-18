// ===============================
// Event Listeners
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    fetchTransactions();
});

// ตัวแปรสำหรับระบบ pagination
const ITEMS_PER_PAGE = 6;
let currentPage = 1;
let allTransactions = [];

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

// ===============================
// Data Fetching Functions
// ===============================
const fetchTransactions = async () => {
    try {
        const response = await fetch('/api/staff/transactions');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();

        // เก็บข้อมูลทั้งหมด
        allTransactions = data;
        
        // แสดงข้อมูลหน้าแรก
        displayTransactions(currentPage);
        
        // แสดง pagination
        renderPagination();
    } catch (error) {
        console.error('Error:', error);
        const tableBody = document.getElementById('transactionTableBody');
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

// แสดงข้อมูลธุรกรรมตามหน้าที่เลือก
const displayTransactions = (page) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const transactionsToShow = allTransactions.slice(startIndex, endIndex);
    
    const tableBody = document.getElementById('transactionTableBody');
    tableBody.innerHTML = '';

    if (transactionsToShow.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-gray-500">
                    <div class="flex flex-col items-center justify-center space-y-2">
                        <i class="fas fa-history text-4xl"></i>
                        <p>ไม่พบประวัติการทำรายการ</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    transactionsToShow.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors duration-200';

        // กำหนดสีและไอคอนตามประเภทธุรกรรม
        const transactionType = transaction.type === 'Deposit' 
            ? `<span class="flex items-center justify-center gap-1">
                 <i class="fas fa-arrow-up text-green-500"></i>
                 <span class="text-green-600">ฝากเงิน</span>
               </span>`
            : `<span class="flex items-center justify-center gap-1">
                 <i class="fas fa-arrow-down text-red-500"></i>
                 <span class="text-red-600">ถอนเงิน</span>
               </span>`;

        // กำหนดสีและสถานะการแสดงผล
        const statusDisplay = getStatusDisplay(transaction.status);

        // กำหนดรูปแบบการแสดงจำนวนเงิน
        const amountDisplay = `
            <span class="font-semibold ${transaction.type === 'Deposit' ? 'text-green-600' : 'text-red-600'}">
                ${transaction.type === 'Deposit' ? '+' : '-'}
                ${transaction.amount.toLocaleString()} บาท
            </span>`;

        row.innerHTML = `
            <td class="border px-4 py-2 text-center text-sm text-gray-600">${transaction._id}</td>
            <td class="border px-4 py-2 text-center">
                <div class="flex flex-col">
                    <span class="font-medium">
                        ${new Date(transaction.date).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                    <span class="text-sm text-gray-500">
                        ${new Date(transaction.date).toLocaleTimeString('th-TH')}
                    </span>
                </div>
            </td>
            <td class="border px-4 py-2 text-center font-medium">${transaction.userName}</td>
            <td class="border px-4 py-2 text-center">${transactionType}</td>
            <td class="border px-4 py-2 text-center">${amountDisplay}</td>
            <td class="border px-4 py-2 text-center">${statusDisplay}</td>
        `;
        tableBody.appendChild(row);
    });
};

// สร้างปุ่มเลื่อนหน้า
const renderPagination = () => {
    const totalPages = Math.ceil(allTransactions.length / ITEMS_PER_PAGE);
    const paginationContainer = document.getElementById('transactionPagination');
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = '';
    
    // สร้าง pagination controls แม้มีข้อมูลแค่หน้าเดียว
    // เพิ่ม container div สำหรับปุ่ม pagination
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'flex justify-center items-center space-x-3 mt-6 glass-card p-3 rounded-lg mx-auto max-w-md';
    
    // สร้างปุ่มย้อนกลับ
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.className = 'px-4 py-2 rounded-lg bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-600 transition-all duration-300 shadow-sm';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayTransactions(currentPage);
            renderPagination();
        }
    });
    paginationDiv.appendChild(prevButton);
    
    // แสดงข้อความหน้าปัจจุบันจากทั้งหมด
    const pageInfo = document.createElement('div');
    pageInfo.className = 'px-4 py-2 text-white font-medium bg-white/10 rounded-lg';
    pageInfo.innerText = `หน้า ${currentPage} จาก ${totalPages || 1}`;
    paginationDiv.appendChild(pageInfo);
    
    // สร้างปุ่มหมายเลขหน้าเฉพาะเมื่อมีมากกว่า 1 หน้า
    if (totalPages > 1) {
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4 && totalPages > 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = i === currentPage 
                ? 'px-4 py-2 rounded-lg bg-green-600 text-white font-bold shadow-md transform scale-105 transition-all duration-300'
                : 'px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-green-600 hover:scale-105 transition-all duration-300';
            pageButton.addEventListener('click', () => {
                currentPage = i;
                displayTransactions(currentPage);
                renderPagination();
            });
            paginationDiv.appendChild(pageButton);
        }
    }
    
    // สร้างปุ่มถัดไป
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.className = 'px-4 py-2 rounded-lg bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-600 transition-all duration-300 shadow-sm';
    nextButton.disabled = currentPage === totalPages || totalPages === 0;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayTransactions(currentPage);
            renderPagination();
        }
    });
    paginationDiv.appendChild(nextButton);
    
    paginationContainer.appendChild(paginationDiv);
};

// เพิ่มฟังก์ชันสำหรับกำหนดการแสดงผลสถานะ
const getStatusDisplay = (status) => {
    const statusConfig = {
        'Completed': {
            color: 'bg-green-100 text-green-800',
            icon: 'fas fa-check-circle',
            text: 'สำเร็จ'
        },
        'Pending': {
            color: 'bg-yellow-100 text-yellow-800',
            icon: 'fas fa-clock',
            text: 'รอดำเนินการ'
        },
        'Failed': {
            color: 'bg-red-100 text-red-800',
            icon: 'fas fa-times-circle',
            text: 'ไม่สำเร็จ'
        }
    };

    const config = statusConfig[status] || statusConfig['Completed'];
    return `
        <span class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${config.color}">
            <i class="${config.icon}"></i>
            ${config.text}
        </span>`;
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