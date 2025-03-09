// ===============================
// Authentication Functions
// ===============================

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
            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });

                if (response.ok) {
                    localStorage.clear();
                    sessionStorage.clear();

                    await Swal.fire({
                        icon: 'success',
                        title: 'ออกจากระบบสำเร็จ',
                        text: 'กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...',
                        timer: 1500,
                        showConfirmButton: false
                    });

                    window.location.replace('/');
                } else {
                    throw new Error('ไม่สามารถออกจากระบบได้');
                }
            } catch (error) {
                throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
            }
        }
    } catch (error) {
        console.error('Error during logout:', error);
        await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง'
        });
    }
};

// ===============================
// Event Listeners Setup
// ===============================

const setupAuthEventListeners = () => {
    const setupLogoutButton = () => {
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton && !logoutButton.hasListener) {
            logoutButton.addEventListener('click', logout);
            logoutButton.hasListener = true;
        }
        const quickActionLogoutButton = document.getElementById('quickActionLogoutButton');
        if (quickActionLogoutButton && !quickActionLogoutButton.hasListener) {
            quickActionLogoutButton.addEventListener('click', logout);
            quickActionLogoutButton.hasListener = true;
        }
    };

    // เรียกใช้ฟังก์ชันตั้งแต่เริ่มต้น
    setupLogoutButton();

    // ใช้ MutationObserver เพื่อตรวจจับการเปลี่ยนแปลงของ DOM
    const logoutObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                setupLogoutButton();
            }
        });
    });

    // เริ่มการสังเกตการณ์ DOM
    logoutObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
};

// เริ่มต้นการทำงานเมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', setupAuthEventListeners); 