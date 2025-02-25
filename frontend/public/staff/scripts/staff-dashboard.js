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
        if (!response.ok) {
            throw new Error(`Failed to fetch transactions. Status: ${response.status}`);
        }
        const data = await response.json();

        const tableBody = document.getElementById('transactionTableBody');
        tableBody.innerHTML = ''; 

        data.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction._id}</td>
                <td>${transaction.date}</td>
                <td>${transaction.user}</td>
                <td>${transaction.type}</td>
                <td>${transaction.amount}</td>
                <td>${transaction.status}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        alert('Error fetching transactions: ' + error.message);
    }
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


