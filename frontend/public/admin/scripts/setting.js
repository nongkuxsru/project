window.onload = () => {
    document.getElementById('logoutButton').addEventListener('click', logout);
};

// ===============================
// Constants & Configurations
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

document.addEventListener('DOMContentLoaded', async () => {
    // เริ่มการสังเกตการณ์ DOM
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // ดึงข้อมูลผู้ใช้
    const userData = JSON.parse(localStorage.getItem("currentUser"));
    if (!userData) {
        await Swal.fire({
            icon: 'error',
            title: 'ไม่พบข้อมูลผู้ใช้',
            text: 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
            confirmButtonText: 'ตกลง'
        });
        window.location.href = "/login";
        return;
    }

    // แสดงข้อมูลในฟอร์ม
    populateForm(userData);

    // Event listener สำหรับการ logout
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    // Event listener สำหรับการอัปเดตข้อมูล
    const form = document.getElementById("personalInfoForm");
    if (form) {
        form.addEventListener("submit", handleFormSubmit);
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
// Form Management Functions
// ===============================
const handleFormSubmit = async (event) => {
    event.preventDefault();

    // ดึงข้อมูลผู้ใช้
    const userData = JSON.parse(localStorage.getItem("currentUser"));
    if (!userData) {
        showError('ไม่พบข้อมูลผู้ใช้');
        return;
    }

    // แปลงวันเกิดเป็นรูปแบบที่ถูกต้อง
    const birthdayInput = document.getElementById("birthday").value;
    const birthdayDate = new Date(birthdayInput);
    const gregorianYear = birthdayDate.getFullYear() - 543;
    const formattedBirthday = `${gregorianYear}-${(birthdayDate.getMonth() + 1).toString().padStart(2, '0')}-${birthdayDate.getDate().toString().padStart(2, '0')}`;

    // รวบรวมข้อมูลที่จะอัปเดต
    const updatedData = {
        _id: userData._id,
        name: document.getElementById("fullName").value,
        email: document.getElementById("email").value,
        address: document.getElementById("address").value,
        phone: document.getElementById("phone").value,
        birthday: formattedBirthday,
        permission: userData.permission
    };

    try {
        // แสดง Loading
        await showLoading('กำลังบันทึกข้อมูล');

        // อัปเดตข้อมูลไปยัง Database
        const response = await fetch(`/api/admin/users/${updatedData._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to update user information');
        }

        // บันทึกข้อมูลใหม่ลง LocalStorage
        localStorage.setItem("currentUser", JSON.stringify(updatedData));

        // แสดงข้อความสำเร็จ
        await showSuccess('บันทึกข้อมูลสำเร็จ', 'ข้อมูลของคุณได้รับการอัปเดตแล้ว');
        window.location.href = '/admin/';

        // อัปเดตการแสดงผล
        updateUserDisplay(updatedData);

    } catch (error) {
        console.error("Update failed:", error);
        showError('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    }
};

const populateForm = (userData) => {
    // กรอกข้อมูลพื้นฐาน
    document.getElementById("userId").value = userData._id || "";
    document.getElementById("fullName").value = userData.name || "";
    document.getElementById("email").value = userData.email || "";
    document.getElementById("address").value = userData.address || "";
    document.getElementById("phone").value = userData.phone || "";
    document.getElementById("permission").value = userData.permission || "";
    
    // จัดการวันเกิด
    if (userData.birthday) {
        const birthdayDate = new Date(userData.birthday);
        const buddhistYear = birthdayDate.getFullYear() + 543;
        const formattedBirthday = `${buddhistYear}-${(birthdayDate.getMonth() + 1).toString().padStart(2, '0')}-${birthdayDate.getDate().toString().padStart(2, '0')}`;
        document.getElementById("birthday").value = formattedBirthday;
    } else {
        document.getElementById("birthday").value = "";
    }

    // อัปเดตการแสดงผลผู้ใช้
    updateUserDisplay(userData);
};

const resetForm = async () => {
    const result = await Swal.fire({
        title: 'ยืนยันการยกเลิก',
        text: 'คุณต้องการยกเลิกการแก้ไขข้อมูลใช่หรือไม่?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ยกเลิกการแก้ไข',
        cancelButtonText: 'ไม่, ทำต่อ'
    });

    if (result.isConfirmed) {
        const userData = JSON.parse(localStorage.getItem("currentUser"));
        if (userData) {
            populateForm(userData);
            showSuccess('รีเซ็ตฟอร์มสำเร็จ', 'ข้อมูลได้ถูกคืนค่าเดิมแล้ว');
        } else {
            showError('ไม่พบข้อมูลผู้ใช้สำหรับรีเซ็ต');
        }
    }
};

// ===============================
// User Management Functions
// ===============================
const updateUserDisplay = (userData) => {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    if (userName && userAvatar) {
        userName.textContent = 'ยินดีต้อนรับ ' + (userData.name || 'ผู้ดูแลระบบ');
        userAvatar.textContent = userData.name ? userData.name.charAt(0).toUpperCase() : 'A';
    }
};

const logout = async () => {
    try {
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

        if (result.isConfirmed) {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('selectedTheme');

                await showSuccess('ออกจากระบบสำเร็จ', 'กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...', 1500);
                window.location.href = '/';
            } else {
                throw new Error('Logout failed');
            }
        }
    } catch (error) {
        console.error('Error during logout:', error);
        showError('ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง');
    }
};

// ===============================
// Utility Functions
// ===============================
const showError = (message) => {
    return Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: message,
        confirmButtonText: 'ตกลง'
    });
};

const showSuccess = (title, text, timer = 0) => {
    return Swal.fire({
        icon: 'success',
        title: title,
        text: text,
        timer: timer,
        showConfirmButton: !timer
        
    });
};

const showLoading = (message) => {
    return Swal.fire({
        title: message,
        text: 'กรุณารอสักครู่...',
        allowOutsideClick: false,
        showConfirmButton: false,
        timer: 1000,
        willOpen: () => {
            Swal.showLoading();
        }
    });
};