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

document.addEventListener('DOMContentLoaded', () => {
    // เริ่มต้นการทำงานหลัก
    initializeUserInfo();
    fetchStats();
    
    // เริ่มการสังเกตการณ์ DOM
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

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

// User Management Functions
// ===============================
const initializeUserInfo = () => {
    try {
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
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการแสดงข้อมูลผู้ใช้:', error);
    }
};

// ===============================
// Data Fetching Functions
// ===============================
const fetchStats = async () => {
    try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();

        // อัปเดตข้อมูลสถิติในหน้าเว็บ
        const totalUsers = document.getElementById('totalUsers');
        const activeUsers = document.getElementById('activeUsers');
        const totalSavings = document.getElementById('totalSavings');

        if (totalUsers) totalUsers.textContent = data.totalUsers?.toLocaleString() || '0';
        if (activeUsers) activeUsers.textContent = data.activeUsers?.toLocaleString() || '0';
        if (totalSavings) totalSavings.textContent = data.totalSavings?.toLocaleString('th-TH', {
            style: 'currency',
            currency: 'THB'
        }) || '฿0.00';

    } catch (error) {
        console.error('Error fetching stats:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถดึงข้อมูลสถิติได้',
            confirmButtonText: 'ตกลง'
        });
    }
};