// ===============================
// Event Listeners
// ===============================
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

// ===============================
// Form Handling
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(localStorage.getItem('currentUser'));

    if (!userData) {
        Swal.fire({
            icon: 'error',
            title: 'No user data found',
            text: 'Please log in again.'
        }).then(() => {
            window.location.href = '/login';
        });
        return;
    }

    populateForm(userData);

    document.getElementById('personalInfoForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const updatedData = {
            _id: userData._id,
            name: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            phone: document.getElementById('phone').value,
            birthday: convertToAD(document.getElementById('birthday').value),
            permission: userData.permission
        };

        try {
            const response = await fetch(`/api/admin/users/${updatedData._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            const result = await response.json();
            if (response.ok) {
                localStorage.setItem('currentUser', JSON.stringify(updatedData));

                await Swal.fire({
                    icon: 'success',
                    title: 'อัพเดทข้อมูลผู้ใช้เสร็จสิ้น !',
                    text: 'กำลังเปลี่ยนเส้นทางไปยังแดชบอร์ด...',
                    timer: 2000,
                    showConfirmButton: false
                });

                window.location.href = '/staff';
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'อัพเดทข้อมูลผู้ใช้ไม่สำเร็จ !',
                    text: result.error
                });
            }
        } catch (error) {
            console.error('Update failed:', error);
            await Swal.fire({
                icon: 'error',
                title: 'An error occurred',
                text: 'มีข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้'
            });
        }
    });
});

// ===============================
// Date Conversion Functions
// ===============================
function convertToAD(dateString) {
    if (!dateString) return '';
    const dateParts = dateString.split('-');
    const yearAD = parseInt(dateParts[0]) - 543;
    return `${yearAD}-${dateParts[1]}-${dateParts[2]}`;
}

function convertToBE(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const yearBE = date.getFullYear() + 543;
    return `${yearBE}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getDate()).slice(-2)}`;
}

// ===============================
// Form Utility Functions
// ===============================
function populateForm(userData) {
    document.getElementById('userId').value = userData._id || '';
    document.getElementById('fullName').value = userData.name || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('address').value = userData.address || '';
    document.getElementById('phone').value = userData.phone || '';
    document.getElementById('birthday').value = userData.birthday ? 
        convertToBE(userData.birthday.split('T')[0]) : '';
    document.getElementById('permission').value = userData.permission || '';
}

function resetForm() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        populateForm(userData);
    } else {
        alert('No user data found to reset.');
    }
}

// ===============================
// User Info Display
// ===============================
document.addEventListener('DOMContentLoaded', () => {
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

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                const logoutButton = document.getElementById('logoutButton');
                if (logoutButton) {
                    logoutButton.addEventListener('click', logout);
                    observer.disconnect();
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// ===============================
// Authentication Functions
// ===============================
const logout = async () => {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('selectedTheme');

            await Swal.fire({
                icon: 'success',
                title: 'Logout successful!',
                text: 'You have been logged out. Redirecting to login page...',
                timer: 1000,
                showConfirmButton: false
            });

            window.location.href = '/';
        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Logout failed!',
                text: 'Please try again.'
            });
        }
    } catch (error) {
        console.error('Error during logout:', error);
        await Swal.fire({
            icon: 'error',
            title: 'An error occurred',
            text: 'There was an error while logging out.'
        });
    }
};
