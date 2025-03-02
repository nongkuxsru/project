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

const fetchPromiseAccount = async () => {
    const userId = getUserIdFromLocalStorage();
    if (!userId) {
        console.error('ไม่พบข้อมูลผู้ใช้');
        return;
    }

    try {
        // ดึงข้อมูลบัญชีออมทรัพย์ก่อนเพื่อใช้ id_saving
        const savingResponse = await fetch(`/api/staff/saving/${userId}`);
        if (!savingResponse.ok) {
            throw new Error('ไม่สามารถดึงข้อมูลบัญชีออมทรัพย์ได้');
        }
        const savingData = await savingResponse.json();
        
        // แก้ไข endpoint ให้ถูกต้อง - ใช้ id_saving ในการดึงข้อมูลสัญญาเงินกู้
        const promiseResponse = await fetch(`/api/staff/promise/${savingData.id_account}`);
        if (!promiseResponse.ok) {
            throw new Error('ไม่สามารถดึงข้อมูลสัญญาเงินกู้ได้');
        }

        const promiseData = await promiseResponse.json();

        // ตรวจสอบว่า elements มีอยู่จริงก่อนที่จะอัพเดต
        const promiseId = document.getElementById('promiseId');
        const promiseBalance = document.getElementById('promiseBalance');
        const promiseCreatedAt = document.getElementById('promiseCreatedAt');
        const promiseDueDate = document.getElementById('promiseDueDate');

        if (promiseData && promiseId && promiseBalance && promiseCreatedAt && promiseDueDate) {
            // อัปเดตข้อมูลสัญญาเงินกู้ใน UI
            promiseId.textContent = promiseData._id || 'ไม่มีข้อมูล';
            promiseBalance.textContent = 
                promiseData.amount ? `${promiseData.amount.toLocaleString()} บาท` : 'ไม่มีข้อมูล';
            promiseCreatedAt.textContent = 
                promiseData.Datepromise ? new Date(promiseData.Datepromise).toLocaleDateString('th-TH') : 'ไม่มีข้อมูล';
            promiseDueDate.textContent = 
                promiseData.DueDate ? new Date(promiseData.DueDate).toLocaleDateString('th-TH') : 'ไม่มีข้อมูล';
        } else {
            console.error('ไม่พบ elements ที่ต้องการอัพเดตหรือไม่มีข้อมูลสัญญาเงินกู้');
        }
    } catch (error) {
        console.error('Error fetching promise account:', error);
        // ตรวจสอบว่า element มีอยู่จริงก่อนที่จะอัพเดต error message
        const container = document.querySelector('.promise-details') || document.body;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-center text-red-500 my-4';
        errorDiv.innerHTML = `
            <p>เกิดข้อผิดพลาดในการโหลดข้อมูลสัญญาเงินกู้</p>
            <p class="text-sm">${error.message}</p>
        `;
        container.appendChild(errorDiv);
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

// ลบ event listener ที่ซ้ำซ้อน - เหลือแค่อันเดียว
document.addEventListener('DOMContentLoaded', () => {
    fetchPromiseAccount();
});
