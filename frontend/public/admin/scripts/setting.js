window.onload = () => {
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

document.addEventListener("DOMContentLoaded", () => {
    // ดึงข้อมูลจาก LocalStorage
    const userData = JSON.parse(localStorage.getItem("currentUser"));

    if (!userData) {
        Swal.fire({
            icon: 'error',
            title: 'ไม่พบข้อมูลผู้ใช้',
            text: 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
            confirmButtonText: 'ตกลง'
        }).then(() => {
            window.location.href = "/login";
        });
        return;
    }

    // แสดงข้อมูลในฟอร์ม
    populateForm(userData);

    // Event listener สำหรับอัปเดตข้อมูล
    document.getElementById("personalInfoForm").addEventListener("submit", async (event) => {
        event.preventDefault();
    
        // ดึงข้อมูลจากฟอร์ม
        const birthdayInput = document.getElementById("birthday").value;
        const birthdayDate = new Date(birthdayInput);
        const gregorianYear = birthdayDate.getFullYear() - 543;
        const formattedBirthday = `${gregorianYear}-${(birthdayDate.getMonth() + 1).toString().padStart(2, '0')}-${birthdayDate.getDate().toString().padStart(2, '0')}`;
    
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
            Swal.fire({
                title: 'กำลังบันทึกข้อมูล',
                text: 'กรุณารอสักครู่...',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading();
                }
            });

            // อัปเดตข้อมูลไปยัง Database
            const response = await fetch(`/api/admin/users/${updatedData._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });
    
            const result = await response.json();
            if (response.ok) {
                // บันทึกข้อมูลใหม่ลง LocalStorage
                localStorage.setItem("currentUser", JSON.stringify(updatedData));
    
                await Swal.fire({
                    icon: 'success',
                    title: 'บันทึกข้อมูลสำเร็จ',
                    text: 'ข้อมูลของคุณได้รับการอัปเดตแล้ว',
                    confirmButtonText: 'ตกลง'
                });

                // อัปเดตชื่อผู้ใช้และอวาตาร์
                const userName = document.getElementById('userName');
                const userAvatar = document.getElementById('userAvatar');
                if (userName && userAvatar) {
                    userName.textContent = 'ยินดีต้อนรับ ' + updatedData.name;
                    userAvatar.textContent = updatedData.name.charAt(0).toUpperCase();
                }
            } else {
                throw new Error(result.error || 'Failed to update user information');
            }
        } catch (error) {
            console.error("Update failed:", error);
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
                confirmButtonText: 'ตกลง'
            });
        }
    });
});

// ฟังก์ชันแสดงข้อมูลในฟอร์ม
function populateForm(userData) {
    document.getElementById("userId").value = userData._id || "";
    document.getElementById("fullName").value = userData.name || "";
    document.getElementById("email").value = userData.email || "";
    document.getElementById("address").value = userData.address || "";
    document.getElementById("phone").value = userData.phone || "";
    
    // แปลงวันเกิดจาก ค.ศ. เป็น พ.ศ.
    if (userData.birthday) {
        const birthdayDate = new Date(userData.birthday);
        const buddhistYear = birthdayDate.getFullYear() + 543;
        const formattedBirthday = `${buddhistYear}-${(birthdayDate.getMonth() + 1).toString().padStart(2, '0')}-${birthdayDate.getDate().toString().padStart(2, '0')}`;
        document.getElementById("birthday").value = formattedBirthday;
    } else {
        document.getElementById("birthday").value = "";
    }
    
    document.getElementById("permission").value = userData.permission || "";

    // อัปเดตชื่อผู้ใช้และอวาตาร์
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    if (userName && userAvatar) {
        userName.textContent = 'ยินดีต้อนรับ ' + (userData.name || 'ผู้ดูแลระบบ');
        userAvatar.textContent = userData.name ? userData.name.charAt(0).toUpperCase() : 'A';
    }
}

// ฟังก์ชันรีเซ็ตฟอร์ม
function resetForm() {
    Swal.fire({
        title: 'ยืนยันการยกเลิก',
        text: 'คุณต้องการยกเลิกการแก้ไขข้อมูลใช่หรือไม่?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ยกเลิกการแก้ไข',
        cancelButtonText: 'ไม่, ทำต่อ'
    }).then((result) => {
        if (result.isConfirmed) {
            const userData = JSON.parse(localStorage.getItem("currentUser"));
            if (userData) {
                populateForm(userData);
                Swal.fire({
                    icon: 'success',
                    title: 'รีเซ็ตฟอร์มสำเร็จ',
                    text: 'ข้อมูลได้ถูกคืนค่าเดิมแล้ว',
                    confirmButtonText: 'ตกลง'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: 'ไม่พบข้อมูลผู้ใช้สำหรับรีเซ็ต',
                    confirmButtonText: 'ตกลง'
                });
            }
        }
    });
}

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