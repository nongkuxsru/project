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

        // เพิ่ม event listener สำหรับปุ่ม toggle
        const toggleButton = document.getElementById('toggleSidebar');
        if (toggleButton && !toggleButton.hasListener) {
            toggleButton.addEventListener('click', toggleSidebar);
            toggleButton.hasListener = true;
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
            }
        }
    });
});

// เริ่มการสังเกตการณ์ DOM
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// เรียกใช้ initializeSidebar เมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', () => {
    initializeSidebar();
    
    // เริ่มต้นโหลดข้อมูลประวัติการปันผล
    fetchDividendHistory();

    // Event Listeners
    document.getElementById('calculateDividendBtn').addEventListener('click', openCalculateModal);
    document.querySelectorAll('.close').forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById('calculateDividendModal').style.display = 'none';
            document.getElementById('dividendDetailsModal').style.display = 'none';
        });
    });

    document.getElementById('calculateDividendForm').addEventListener('submit', handleCalculateDividend);
});

// ฟังก์ชันดึงข้อมูลประวัติการปันผล
const fetchDividendHistory = async () => {
    try {
        const response = await fetch('/api/staff/dividend/history');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'ไม่สามารถดึงข้อมูลประวัติการปันผลได้');
        }

        updateDividendSummary(data.dividends[0]); // อัพเดทสรุปข้อมูลล่าสุด
        renderDividendHistory(data.dividends);
    } catch (error) {
        console.error('Error fetching dividend history:', error);
        showError('ไม่สามารถดึงข้อมูลประวัติการปันผลได้');
    }
};

// ฟังก์ชันอัพเดทข้อมูลสรุปการปันผล
const updateDividendSummary = (latestDividend) => {
    if (!latestDividend) return;

    document.getElementById('totalInterest').textContent = 
        formatCurrency(latestDividend.totalInterest) + ' บาท';
    document.getElementById('totalShares').textContent = 
        formatNumber(latestDividend.totalShares) + ' หุ้น';
    document.getElementById('dividendPerShare').textContent = 
        formatCurrency(latestDividend.dividendPerShare) + ' บาท/หุ้น';
};

// ฟังก์ชันแสดงข้อมูลประวัติการปันผลในตาราง
const renderDividendHistory = (dividends) => {
    const tableBody = document.getElementById('dividendTableBody');
    tableBody.innerHTML = '';

    if (!dividends || dividends.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    ไม่พบข้อมูลการปันผล
                </td>
            </tr>
        `;
        return;
    }

    dividends.forEach(dividend => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${dividend.year}</td>
            <td class="px-6 py-4 whitespace-nowrap">${formatCurrency(dividend.totalInterest)} บาท</td>
            <td class="px-6 py-4 whitespace-nowrap">${formatNumber(dividend.totalShares)} หุ้น</td>
            <td class="px-6 py-4 whitespace-nowrap">${formatCurrency(dividend.dividendPerShare)} บาท</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${getStatusColor(dividend.status)}">
                    ${getStatusText(dividend.status)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="viewDividendDetails('${dividend._id}')" 
                    class="text-blue-600 hover:text-blue-800 mr-3">
                    <i class="fas fa-eye"></i>
                </button>
                ${dividend.status === 'pending' ? `
                    <button onclick="distributeDividend('${dividend._id}')"
                        class="text-green-600 hover:text-green-800">
                        <i class="fas fa-share-alt"></i>
                    </button>
                ` : ''}
            </td>
        `;
        tableBody.appendChild(row);
    });
};

// ฟังก์ชันเปิด Modal คำนวณปันผล
const openCalculateModal = () => {
    const modal = document.getElementById('calculateDividendModal');
    modal.style.display = 'flex';
    
    // ตั้งค่าปีปัจจุบันเป็นค่าเริ่มต้น
    document.getElementById('dividendYear').value = new Date().getFullYear();
};

// ฟังก์ชันจัดการการคำนวณปันผล
const handleCalculateDividend = async (event) => {
    event.preventDefault();
    
    const year = document.getElementById('dividendYear').value;
    
    try {
        const response = await fetch('/api/staff/dividend/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ year: parseInt(year) })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'ไม่สามารถคำนวณเงินปันผลได้');
        }

        // ปิด Modal
        document.getElementById('calculateDividendModal').style.display = 'none';

        // แสดงผลสำเร็จ
        Swal.fire({
            icon: 'success',
            title: 'คำนวณปันผลสำเร็จ',
            text: 'ระบบได้คำนวณเงินปันผลประจำปีเรียบร้อยแล้ว'
        });

        // รีเฟรชข้อมูล
        fetchDividendHistory();
    } catch (error) {
        console.error('Error calculating dividend:', error);
        showError(error.message);
    }
};

// ฟังก์ชันแสดงรายละเอียดการปันผล
const viewDividendDetails = async (dividendId) => {
    try {
        const response = await fetch(`/api/staff/dividend/${dividendId}`);
        
        const responseText = await response.text();
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            throw new Error('ข้อมูลที่ได้รับจาก server ไม่ถูกต้อง');
        }

        if (!data.success) {
            console.error('API returned error:', data);
            throw new Error(data.message || 'ไม่สามารถดึงข้อมูลรายละเอียดการปันผลได้');
        }

        const dividend = data.dividend;
        const modal = document.getElementById('dividendDetailsModal');
        const content = document.getElementById('dividendDetailsContent');

        if (!modal || !content) {
            console.error('Modal elements not found:', { modal, content });
            throw new Error('ไม่พบ elements ที่จำเป็นในหน้าเว็บ');
        }

        content.innerHTML = `
            <div class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-semibold text-gray-600">ปีที่จ่ายปันผล</h4>
                        <p class="text-lg">${dividend.year}</p>
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-600">สถานะ</h4>
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${getStatusColor(dividend.status)}">
                            ${getStatusText(dividend.status)}
                        </span>
                    </div>
                </div>

                <div class="border-t pt-4">
                    <h4 class="font-semibold text-gray-600 mb-3">รายละเอียดการจ่ายปันผล</h4>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">เลขที่บัญชี</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อสมาชิก</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จำนวนหุ้น</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">เงินปันผล</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่จ่าย</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${dividend.distributions.map(dist => `
                                    <tr>
                                        <td class="px-6 py-4">${dist.saving_id}</td>
                                        <td class="px-6 py-4">${dist.member_name}</td>
                                        <td class="px-6 py-4">${formatNumber(dist.shares)} หุ้น</td>
                                        <td class="px-6 py-4">${formatCurrency(dist.amount)} บาท</td>
                                        <td class="px-6 py-4">${dist.distributed_at ? new Date(dist.distributed_at).toLocaleDateString('th-TH') : '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error in viewDividendDetails:', error);
        console.error('Error stack:', error.stack);
        showError(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียดการปันผล');
    }
};

// ฟังก์ชันจ่ายเงินปันผล
const distributeDividend = async (dividendId) => {
    try {
        const result = await Swal.fire({
            title: 'ยืนยันการจ่ายปันผล',
            text: 'คุณต้องการดำเนินการจ่ายเงินปันผลให้กับสมาชิกหรือไม่?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก'
        });

        if (!result.isConfirmed) return;

        const response = await fetch(`/api/staff/dividend/distribute/${dividendId}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'ไม่สามารถจ่ายเงินปันผลได้');
        }

        Swal.fire({
            icon: 'success',
            title: 'จ่ายเงินปันผลสำเร็จ',
            text: 'ระบบได้ดำเนินการจ่ายเงินปันผลให้กับสมาชิกเรียบร้อยแล้ว'
        });

        fetchDividendHistory();
    } catch (error) {
        console.error('Error distributing dividend:', error);
        showError(error.message);
    }
};

// Utility Functions
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

const formatNumber = (number) => {
    return new Intl.NumberFormat('th-TH').format(number);
};

const getStatusColor = (status) => {
    switch (status) {
        case 'distributed':
            return 'bg-green-100 text-green-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getStatusText = (status) => {
    switch (status) {
        case 'distributed':
            return 'จ่ายแล้ว';
        case 'pending':
            return 'รอจ่าย';
        case 'cancelled':
            return 'ยกเลิก';
        default:
            return 'ไม่ระบุ';
    }
};

const showError = (message) => {
    Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: message
    });
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