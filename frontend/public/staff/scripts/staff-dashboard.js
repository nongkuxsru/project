// ===============================
// Event Listeners
// ===============================
window.onload = () => {
    document.getElementById('logoutButton').addEventListener('click', logout);
};

document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    fetchTransactions();
    initializeUserInfo();
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

// ===============================
// Data Fetching Functions
// ===============================
const fetchTransactions = async () => {
    try {
        const response = await fetch('/api/staff/transactions');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();

        const tableBody = document.getElementById('transactionTableBody');
        tableBody.innerHTML = '';

        if (data.length === 0) {
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

        data.forEach(transaction => {
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

    const config = statusConfig[status] || statusConfig['Pending'];
    return `
        <span class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${config.color}">
            <i class="${config.icon}"></i>
            ${config.text}
        </span>`;
};

// ===============================
// User Management Functions
// ===============================
const initializeUserInfo = () => {
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
};

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


