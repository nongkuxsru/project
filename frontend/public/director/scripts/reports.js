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
    initializeFinancialReports();
    
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

// ===============================
// Financial Reports Functions
// ===============================
const initializeFinancialReports = async () => {
    try {
        const data = await fetchFinancialData();
        updateSummaryCards(data);
        renderMonthlySavingsChart(data);
        renderMonthlyLoansChart(data);
        renderTransactionTypeChart(data);
        renderMemberGrowthChart(data);
        renderTransactionTable(data);
    } catch (error) {
        console.error('Error initializing financial reports:', error);
        showError('ไม่สามารถโหลดข้อมูลรายงานการเงินได้');
    }
};

const fetchFinancialData = async () => {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const response = await fetch('/api/admin/financial-reports', {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch financial reports');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching financial data:', error);
        throw error;
    }
};

const renderMonthlySavingsChart = (data) => {
    const ctx = document.getElementById('monthlySavingsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.monthlySavings.map(item => item.month),
            datasets: [{
                label: 'ยอดเงินรายเดือน',
                data: data.monthlySavings.map(item => item.amount),
                backgroundColor: '#1B8F4C',
                borderColor: '#264C3B',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '฿' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
};

// เพิ่มฟังก์ชันสำหรับแสดงกราฟการกู้ยืมรายเดือน
const renderMonthlyLoansChart = (data) => {
    if (!data.monthlyLoans || !document.getElementById('monthlyLoansChart')) {
        console.warn('Monthly loans data or chart element not found');
        return;
    }

    const ctx = document.getElementById('monthlyLoansChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.monthlyLoans.map(item => item.month),
            datasets: [{
                label: 'ยอดกู้รายเดือน',
                data: data.monthlyLoans.map(item => item.amount),
                backgroundColor: '#6366F1', // สีม่วง-น้ำเงิน
                borderColor: '#4F46E5',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '฿' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
};

const renderTransactionTypeChart = (data) => {
    const ctx = document.getElementById('transactionTypeChart').getContext('2d');
    
    // กำหนดสีตามประเภทธุรกรรม
    const getTransactionColor = (type) => {
        switch (type.toLowerCase()) {
            case 'deposit':
                return '#1B8F4C'; // สีเขียว
            case 'withdraw':
                return '#DC2626'; // สีแดง
            case 'loan':
                return '#6366F1'; // สีม่วง-น้ำเงิน
            case 'payment':
                return '#F59E0B'; // สีส้ม
            default:
                return '#1B8F4C'; // สีเขียวเป็นค่าเริ่มต้น
        }
    };

    // สร้างข้อมูลสำหรับกราฟวงกลม
    const chartData = {
        labels: data.transactionTypes.map(item => item.type),
        datasets: [{
            data: data.transactionTypes.map(item => item.count),
            backgroundColor: data.transactionTypes.map(item => getTransactionColor(item.type)),
            borderColor: data.transactionTypes.map(item => getTransactionColor(item.type)),
            borderWidth: 1
        }]
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: 'IBM Plex Sans Thai'
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
};

// เพิ่มฟังก์ชันสำหรับแสดงกราฟการเติบโตของสมาชิก
const renderMemberGrowthChart = (data) => {
    if (!data.memberGrowth || !document.getElementById('memberGrowthChart')) {
        console.warn('Member growth data or chart element not found');
        return;
    }

    const ctx = document.getElementById('memberGrowthChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.memberGrowth.map(item => item.month),
            datasets: [
                {
                    label: 'สมาชิกออมทรัพย์',
                    data: data.memberGrowth.map(item => item.savingMembers),
                    borderColor: '#1B8F4C',
                    backgroundColor: 'rgba(27, 143, 76, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'สมาชิกที่กู้',
                    data: data.memberGrowth.map(item => item.loanMembers),
                    borderColor: '#6366F1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: 'IBM Plex Sans Thai'
                        }
                    }
                }
            }
        }
    });
};

const renderTransactionTable = (data) => {
    const tableBody = document.getElementById('transactionTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = data.transactionTypes.map(item => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="p-2 rounded-full" style="background-color: ${item.bgColor || '#E3F5E9'}">
                        <i class="fas ${item.icon}" style="color: ${item.color || '#1B8F4C'}"></i>
                    </div>
                    <span class="ml-2">${item.type}</span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
                ${item.count.toLocaleString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
                ฿${item.amount.toLocaleString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
                <span class="${item.amountChange >= 0 ? 'text-green-600' : 'text-red-600'}">
                    <i class="fas fa-${item.amountChange >= 0 ? 'arrow-up' : 'arrow-down'} mr-1"></i>
                    ${Math.abs(item.amountChange).toFixed(2)}%
                </span>
            </td>
        </tr>
    `).join('');
};

const showError = (message) => {
    Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: message,
        confirmButtonText: 'ตกลง'
    });
};

// ฟังก์ชันสำหรับอัปเดต Summary Cards
const updateSummaryCards = (data) => {
    try {
        console.log('Financial data received:', data);
        
        // อัปเดตจำนวนสมาชิกออมทรัพย์
        if (data.memberStats && data.memberStats.savingMembers !== undefined) {
            document.getElementById('totalSavingMembers').textContent = data.memberStats.savingMembers.toLocaleString();
        } else if (data.savingMembers !== undefined) {
            document.getElementById('totalSavingMembers').textContent = data.savingMembers.toLocaleString();
        } else {
            console.warn('ไม่พบข้อมูลจำนวนสมาชิกออมทรัพย์');
        }
        
        // อัปเดตจำนวนสมาชิกที่กู้
        if (data.memberStats && data.memberStats.loanMembers !== undefined) {
            document.getElementById('totalLoanMembers').textContent = data.memberStats.loanMembers.toLocaleString();
        } else if (data.loanMembers !== undefined) {
            document.getElementById('totalLoanMembers').textContent = data.loanMembers.toLocaleString();
        } else {
            console.warn('ไม่พบข้อมูลจำนวนสมาชิกที่กู้');
        }
        
        // อัปเดตจำนวนธุรกรรมทั้งหมด
        if (data.transactionCount !== undefined) {
            document.getElementById('totalTransactions').textContent = data.transactionCount.toLocaleString();
        } else if (data.summary && data.summary.transactionCount !== undefined) {
            document.getElementById('totalTransactions').textContent = data.summary.transactionCount.toLocaleString();
        } else if (data.summary && Array.isArray(data.summary) && data.summary[2] && data.summary[2].amount !== undefined) {
            document.getElementById('totalTransactions').textContent = data.summary[2].amount.toLocaleString();
        } else {
            console.warn('ไม่พบข้อมูลจำนวนธุรกรรมทั้งหมด');
        }
        
        // อัปเดตเงินฝากรวมทั้งหมด
        if (data.totalDeposits !== undefined) {
            document.getElementById('totalDeposits').textContent = `฿${data.totalDeposits.toLocaleString()}`;
        } else if (data.summary && data.summary.totalDeposits !== undefined) {
            document.getElementById('totalDeposits').textContent = `฿${data.summary.totalDeposits.toLocaleString()}`;
        } else if (data.summary && Array.isArray(data.summary) && data.summary[0] && data.summary[0].amount !== undefined) {
            document.getElementById('totalDeposits').textContent = `฿${data.summary[0].amount.toLocaleString()}`;
        } else {
            console.warn('ไม่พบข้อมูลเงินฝากรวมทั้งหมด');
        }
        
        // อัปเดตยอดกู้เงินทั้งหมด
        if (data.totalLoans !== undefined) {
            document.getElementById('totalLoans').textContent = `฿${data.totalLoans.toLocaleString()}`;
        } else if (data.loanStats && data.loanStats.totalLoans !== undefined) {
            document.getElementById('totalLoans').textContent = `฿${data.loanStats.totalLoans.toLocaleString()}`;
        } else {
            console.warn('ไม่พบข้อมูลยอดกู้เงินทั้งหมด');
        }
        
        // อัปเดตรายได้จากการกู้เงิน
        if (data.loanIncome !== undefined) {
            document.getElementById('loanIncome').textContent = `฿${data.loanIncome.toLocaleString()}`;
        } else if (data.loanStats && data.loanStats.loanIncome !== undefined) {
            document.getElementById('loanIncome').textContent = `฿${data.loanStats.loanIncome.toLocaleString()}`;
        } else {
            console.warn('ไม่พบข้อมูลรายได้จากการกู้เงิน');
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดต Summary Cards:', error);
    }
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