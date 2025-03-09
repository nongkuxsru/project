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
    try {
        // ตรวจสอบการล็อกอิน
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        // เริ่มต้นการทำงานหลัก
        initializeFinancialReports();
        
        // เริ่มการสังเกตการณ์ DOM สำหรับ sidebar
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('ไม่สามารถโหลดข้อมูลได้');
    }
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
        // เริ่มต้นตัวเลือกปีก่อน
        initializeYearSelect();
        
        // รอให้ DOM elements พร้อม
        const reportPeriod = document.getElementById('reportPeriod');
        const yearSelect = document.getElementById('yearSelect');
        const monthSelect = document.getElementById('monthSelect');
        
        if (!reportPeriod || !yearSelect || !monthSelect) {
            throw new Error('ไม่พบ elements ที่จำเป็น');
        }

        // ซ่อนตัวเลือกเดือนเมื่อเริ่มต้น เพราะจะแสดงข้อมูลรวมก่อน
        monthSelect.style.display = 'none';
        
        // ดึงข้อมูลรวมทั้งหมดก่อน
        const data = await fetchFinancialData('total');
        
        // อัพเดตการแสดงผล
        updateSummaryCards(data);
        renderMonthlySavingsChart(data);
        renderTransactionTypeChart(data);
        renderTransactionTable(data);

        // เพิ่ม event listeners
        setupEventListeners(reportPeriod, yearSelect, monthSelect);
    } catch (error) {
        console.error('Error initializing financial reports:', error);
        showError('ไม่สามารถโหลดข้อมูลรายงานการเงินได้');
    }
};

const fetchFinancialData = async (period = 'total', year = new Date().getFullYear(), month = null) => {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        let url = `/api/admin/financial-reports`;
        
        // ถ้าไม่ใช่การดูข้อมูลรวม ให้ส่งพารามิเตอร์ตามช่วงเวลาที่เลือก
        if (period !== 'total') {
            url += `/${period}/${year}`;
            if (period === 'monthly' && month) {
                url += `/${month}`;
            }
        }

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`ไม่สามารถดึงข้อมูลรายงานได้: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching financial data:', error);
        throw error;
    }
};

// เพิ่มตัวแปรสำหรับเก็บ chart instances
let monthlySavingsChartInstance = null;
let transactionTypeChartInstance = null;

const renderMonthlySavingsChart = (data) => {
    const ctx = document.getElementById('monthlySavingsChart').getContext('2d');
    
    // ทำลาย chart เดิมถ้ามีอยู่
    if (monthlySavingsChartInstance) {
        monthlySavingsChartInstance.destroy();
    }

    monthlySavingsChartInstance = new Chart(ctx, {
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
    try {
        const ctx = document.getElementById('transactionTypeChart').getContext('2d');
        
        if (!data || !data.transactionTypes || !Array.isArray(data.transactionTypes)) {
            console.error('ข้อมูลธุรกรรมไม่ถูกต้อง');
            return;
        }
        
        // ทำลาย chart เดิมถ้ามีอยู่
        if (transactionTypeChartInstance) {
            transactionTypeChartInstance.destroy();
        }

        // กำหนดสีและชื่อประเภทธุรกรรม
        const getTransactionInfo = (type) => {
            if (!type || typeof type !== 'string') {
                return {
                    color: '#6B7280',
                    label: 'ไม่ระบุประเภท'
                };
            }
            
            switch (type.toLowerCase()) {
                case 'deposit':
                    return {
                        color: '#22C55E', // สีเขียวสดใส
                        label: 'เงินฝาก'
                    };
                case 'withdraw':
                    return {
                        color: '#EF4444', // สีแดงสดใส
                        label: 'เงินถอน'
                    };
                case 'transfer':
                    return {
                        color: '#3B82F6', // สีฟ้าสดใส
                        label: 'โอนเงิน'
                    };
                case 'loan':
                    return {
                        color: '#F59E0B', // สีส้มสดใส
                        label: 'เงินกู้'
                    };
                case 'payment':
                    return {
                        color: '#8B5CF6', // สีม่วงสดใส
                        label: 'ชำระเงิน'
                    };
                default:
                    return {
                        color: '#6B7280', // สีเทา
                        label: type
                    };
            }
        };

        // แปลงข้อมูลและจัดเรียงตามจำนวนธุรกรรม
        const sortedData = data.transactionTypes
            .sort((a, b) => b.count - a.count)
            .map(item => {
                const info = getTransactionInfo(item.type);
                return {
                    ...item,
                    color: info.color,
                    label: info.label
                };
            });

        // สร้างข้อมูลสำหรับกราฟวงกลม
        const chartData = {
            labels: sortedData.map(item => item.label),
            datasets: [{
                data: sortedData.map(item => item.count || 0),
                backgroundColor: sortedData.map(item => item.color),
                borderColor: sortedData.map(item => item.color),
                borderWidth: 1
            }]
        };

        transactionTypeChartInstance = new Chart(ctx, {
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
                                family: 'IBM Plex Sans Thai',
                                size: 14
                            },
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value.toLocaleString()} รายการ (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%',
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    } catch (error) {
        console.error('Error rendering transaction type chart:', error);
    }
};

const renderTransactionTable = (data) => {
    try {
        const tableBody = document.getElementById('transactionTableBody');
        if (!tableBody || !data.transactionTypes) return;

        const rows = data.transactionTypes.map(item => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="p-2 rounded-full" style="background-color: ${item.bgColor}">
                            <i class="fas ${item.icon}" style="color: ${item.color}"></i>
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

        tableBody.innerHTML = rows;
    } catch (error) {
        console.error('Error rendering transaction table:', error);
    }
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
        if (!data || !data.summary) {
            console.error('ข้อมูลสรุปไม่ถูกต้อง');
            return;
        }

        // อัพเดตเงินฝากรวม
        const totalDeposits = document.getElementById('totalDeposits');
        if (totalDeposits) {
            totalDeposits.textContent = `฿${data.summary.totalAmount.toLocaleString()}`;
        }

        // อัพเดตจำนวนธุรกรรม
        const totalTransactions = document.getElementById('totalTransactions');
        if (totalTransactions) {
            totalTransactions.textContent = data.summary.totalTransactions.toLocaleString();
        }

        // อัพเดตอัตราการเติบโต
        const growthRate = document.getElementById('growthRate');
        if (growthRate) {
            const value = data.summary.growthRate || 0;
            const isPositive = value >= 0;
            growthRate.innerHTML = `
                <i class="fas fa-${isPositive ? 'arrow-up' : 'arrow-down'} mr-1"></i>
                ${Math.abs(value).toFixed(2)}%
            `;
            growthRate.className = `text-2xl font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`;
        }
    } catch (error) {
        console.error('Error updating summary cards:', error);
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

// ฟังก์ชันสำหรับเตรียมตัวเลือกปี
const initializeYearSelect = () => {
    const yearSelect = document.getElementById('yearSelect');
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5; // แสดง 5 ปีย้อนหลัง

    for (let year = currentYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `พ.ศ. ${year + 543}`; // แปลงเป็นปี พ.ศ.
        yearSelect.appendChild(option);
    }
};

// ฟังก์ชันสำหรับจัดการการแสดงผลตัวเลือกเดือน
const toggleMonthSelect = (show) => {
    const monthSelect = document.getElementById('monthSelect');
    monthSelect.style.display = show ? 'block' : 'none';
};

// ฟังก์ชันสำหรับโหลดข้อมูลรายงานตามช่วงเวลา
const loadReportData = async (period, year, month = null) => {
    try {
        // แสดง loading state
        Swal.fire({
            title: 'กำลังโหลดข้อมูล',
            text: 'กรุณารอสักครู่...',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });

        const data = await fetchFinancialData(period, year, month);
        
        Swal.close();
        
        // อัพเดตการแสดงผล
        updateSummaryCards(data);
        renderMonthlySavingsChart(data);
        renderTransactionTypeChart(data);
        renderTransactionTable(data);

    } catch (error) {
        console.error('Error loading report data:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถโหลดข้อมูลรายงานได้'
        });
    }
};

// ฟังก์ชันสำหรับ Export เป็น PDF
const exportToPDF = async () => {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const period = document.getElementById('reportPeriod').value;
        const year = document.getElementById('yearSelect').value;
        const month = period === 'monthly' ? document.getElementById('monthSelect').value : null;

        let url = `/api/admin/reports/export/pdf/${period}/${year}`;
        if (month) url += `/${month}`;

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to export PDF');
        }

        // สร้าง Blob จาก response และดาวน์โหลด
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `financial_report_${period}_${year}${month ? '_' + month : ''}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);

        Swal.fire({
            icon: 'success',
            title: 'ส่งออกรายงานสำเร็จ',
            text: 'ไฟล์ PDF ได้ถูกดาวน์โหลดเรียบร้อยแล้ว'
        });
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showError('ไม่สามารถส่งออกไฟล์ PDF ได้');
    }
};

// ฟังก์ชันสำหรับ Export เป็น Excel
const exportToExcel = async () => {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const period = document.getElementById('reportPeriod').value;
        const year = document.getElementById('yearSelect').value;
        const month = period === 'monthly' ? document.getElementById('monthSelect').value : null;

        let url = `/api/admin/reports/export/excel/${period}/${year}`;
        if (month) url += `/${month}`;

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to export Excel');
        }

        // สร้าง Blob จาก response และดาวน์โหลด
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `financial_report_${period}_${year}${month ? '_' + month : ''}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);

        Swal.fire({
            icon: 'success',
            title: 'ส่งออกรายงานสำเร็จ',
            text: 'ไฟล์ Excel ได้ถูกดาวน์โหลดเรียบร้อยแล้ว'
        });
    } catch (error) {
        console.error('Error exporting Excel:', error);
        showError('ไม่สามารถส่งออกไฟล์ Excel ได้');
    }
};

const setupEventListeners = (reportPeriod, yearSelect, monthSelect) => {
    // จัดการการเปลี่ยนแปลงช่วงเวลา
    reportPeriod.addEventListener('change', (e) => {
        const selectedPeriod = e.target.value;
        
        // ซ่อน/แสดงตัวเลือกเดือนตามช่วงเวลาที่เลือก
        toggleMonthSelect(selectedPeriod === 'monthly');
        
        if (selectedPeriod === 'total') {
            // ถ้าเลือกดูข้อมูลรวม
            loadReportData('total');
        } else {
            // ถ้าเลือกดูข้อมูลรายเดือนหรือรายปี
            loadReportData(
                selectedPeriod,
                yearSelect.value,
                selectedPeriod === 'monthly' ? monthSelect.value : null
            );
        }
    });

    // จัดการการเปลี่ยนแปลงปี
    yearSelect.addEventListener('change', () => {
        const selectedPeriod = reportPeriod.value;
        if (selectedPeriod !== 'total') {
            loadReportData(
                selectedPeriod,
                yearSelect.value,
                selectedPeriod === 'monthly' ? monthSelect.value : null
            );
        }
    });

    // จัดการการเปลี่ยนแปลงเดือน
    monthSelect.addEventListener('change', () => {
        const selectedPeriod = reportPeriod.value;
        if (selectedPeriod === 'monthly') { 
            loadReportData('monthly', yearSelect.value, monthSelect.value);
        }
    });

    // จัดการปุ่ม Export
    const exportPDFBtn = document.getElementById('exportPDF');
    const exportExcelBtn = document.getElementById('exportExcel');
    
    if (exportPDFBtn) {
        exportPDFBtn.addEventListener('click', exportToPDF);
    }
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', exportToExcel);
    }
};