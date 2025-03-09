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
// Financial Reports Functions
// ===============================
const initializeFinancialReports = async () => {
    try {
        const data = await fetchFinancialData();
        updateSummaryCards(data);
        renderMonthlySavingsChart(data);
        renderTransactionTypeChart(data);
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

const renderTransactionTypeChart = (data) => {
    const ctx = document.getElementById('transactionTypeChart').getContext('2d');
    
    // กำหนดสีตามประเภทธุรกรรม
    const getTransactionColor = (type) => {
        switch (type.toLowerCase()) {
            case 'deposit':
                return '#1B8F4C'; // สีเขียว
            case 'withdraw':
                return '#DC2626'; // สีแดง
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
    // อัปเดตเงินฝากรวมเดือนนี้
    document.getElementById('totalDeposits').textContent = `฿${data.summary[0].amount.toLocaleString()}`;
    
    // อัปเดตจำนวนธุรกรรมทั้งหมด
    document.getElementById('totalTransactions').textContent = data.summary[2].amount.toLocaleString();
    
    // อัปเดตอัตราการเติบโต
    const growthRate = document.getElementById('growthRate');
    const growthValue = data.summary[0].change;
    growthRate.textContent = `${Math.abs(growthValue).toFixed(2)}%`;
    
    // เพิ่ม class สีตามค่าการเติบโต
    growthRate.classList.remove('text-green-600', 'text-red-600');
    growthRate.classList.add(growthValue >= 0 ? 'text-green-600' : 'text-red-600');
    
    // เพิ่มไอคอนแสดงทิศทาง
    const growthIcon = growthValue >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    growthRate.innerHTML = `<i class="fas ${growthIcon} mr-1"></i>${Math.abs(growthValue).toFixed(2)}%`;
};