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
            // คำนวณยอดเงินและดอกเบี้ย
            const amount = promiseData.amount || 0;
            const interestRate = promiseData.interestRate || 0;
            const interestAmount = (amount * interestRate) / 100;
            const totalAmount = amount + interestAmount;
            const totalPaid = promiseData.totalPaid || 0;
            const remainingBalance = totalAmount - totalPaid;

            // อัปเดตข้อมูลสัญญาเงินกู้ใน UI
            promiseId.innerHTML = `
                <div class="flex items-center space-x-2">
                    <i class="fas fa-file-contract text-green-600"></i>
                    <span>${promiseData._id || 'ไม่มีข้อมูล'}</span>
                </div>
            `;

            // สร้าง Progress Bar สำหรับการชำระเงิน
            const progressPercentage = (totalPaid / totalAmount) * 100;
            
            promiseBalance.innerHTML = `
                <div class="bg-white rounded-lg p-6 shadow-md space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="flex items-center space-x-2 text-gray-600 mb-2">
                                <i class="fas fa-money-bill-wave"></i>
                                <span class="font-semibold">เงินต้น</span>
                            </div>
                            <p class="text-2xl font-bold text-gray-800">${amount.toLocaleString()} บาท</p>
                        </div>
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="flex items-center space-x-2 text-gray-600 mb-2">
                                <i class="fas fa-percentage"></i>
                                <span class="font-semibold">ดอกเบี้ย (${interestRate}%)</span>
                            </div>
                            <p class="text-2xl font-bold text-gray-800">${interestAmount.toLocaleString()} บาท</p>
                        </div>
                    </div>

                    <div class="border-t border-gray-200 pt-4">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-lg font-semibold">ความคืบหน้าการชำระเงิน</span>
                            <span class="text-sm text-gray-600">${progressPercentage.toFixed(1)}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-4 mb-4">
                            <div class="bg-green-600 h-4 rounded-full transition-all duration-500" 
                                 style="width: ${progressPercentage}%"></div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div class="p-3 bg-gray-50 rounded-lg">
                                <p class="text-sm text-gray-600 mb-1">ยอดรวมทั้งสิ้น</p>
                                <p class="text-lg font-bold text-gray-800">${totalAmount.toLocaleString()} บาท</p>
                            </div>
                            <div class="p-3 bg-blue-50 rounded-lg">
                                <p class="text-sm text-blue-600 mb-1">ชำระแล้ว</p>
                                <p class="text-lg font-bold text-blue-600">${totalPaid.toLocaleString()} บาท</p>
                            </div>
                            <div class="p-3 bg-red-50 rounded-lg">
                                <p class="text-sm text-red-600 mb-1">ยอดคงเหลือ</p>
                                <p class="text-lg font-bold text-red-600">${remainingBalance.toLocaleString()} บาท</p>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-center mt-4">
                        <button onclick="openPaymentHistoryModal('${encodeURIComponent(JSON.stringify(promiseData.payments || []))}')"
                                class="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            <i class="fas fa-history mr-2"></i>
                            <span>ดูประวัติการชำระเงิน</span>
                        </button>
                    </div>
                </div>
            `;

            // อัพเดตวันที่ด้วยการจัดรูปแบบที่สวยงาม
            const dateOptions = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
            };

            promiseCreatedAt.innerHTML = `
                <div class="flex items-center space-x-2">
                    <i class="fas fa-calendar-plus text-green-600"></i>
                    <span>${promiseData.Datepromise ? new Date(promiseData.Datepromise).toLocaleDateString('th-TH', dateOptions) : 'ไม่มีข้อมูล'}</span>
                </div>
            `;

            promiseDueDate.innerHTML = `
                <div class="flex items-center space-x-2">
                    <i class="fas fa-calendar-check text-green-600"></i>
                    <span>${promiseData.DueDate ? new Date(promiseData.DueDate).toLocaleDateString('th-TH', dateOptions) : 'ไม่มีข้อมูล'}</span>
                </div>
            `;

        } else {
            console.error('ไม่พบ elements ที่ต้องการอัพเดตหรือไม่มีข้อมูลสัญญาเงินกู้');
        }
    } catch (error) {
        console.error('Error fetching promise account:', error);
        const container = document.querySelector('.promise-details') || document.body;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-50 border-l-4 border-red-500 p-4 my-4';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <i class="fas fa-exclamation-circle text-red-500 text-xl"></i>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-red-700">เกิดข้อผิดพลาดในการโหลดข้อมูลสัญญาเงินกู้</p>
                    <p class="text-xs text-red-500 mt-1">${error.message}</p>
                </div>
            </div>
        `;
        container.appendChild(errorDiv);
    }
};

const openPaymentHistoryModal = (paymentsJson) => {
    try {
        const payments = JSON.parse(decodeURIComponent(paymentsJson));
        const modal = document.getElementById('paymentHistoryModal');
        const contentDiv = document.getElementById('paymentHistoryContent');

        let content = `
            <h2 class="text-2xl font-bold text-primary mb-6 flex items-center">
                <i class="fas fa-history mr-3"></i>
                ประวัติการชำระเงิน
            </h2>
        `;

        if (payments && payments.length > 0) {
            content += `
                <div class="overflow-x-auto">
                    <table class="min-w-full bg-white rounded-lg overflow-hidden">
                        <thead class="bg-green-500 text-white">
                            <tr>
                                <th class="py-3 px-4 text-left">วันที่ชำระ</th>
                                <th class="py-3 px-4 text-center">งวดที่</th>
                                <th class="py-3 px-4 text-right">จำนวนเงิน</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            let totalPaid = 0;
            payments.forEach((payment, index) => {
                // แก้ไขการจัดการวันที่ - ตรวจสอบทั้ง payment_date และ paymentDate
                let formattedDate = 'ไม่ระบุวันที่';
                const paymentDateValue = payment.payment_date || payment.paymentDate || payment.date;
                
                if (paymentDateValue) {
                    try {
                        const paymentDate = new Date(paymentDateValue);
                        if (!isNaN(paymentDate.getTime())) {
                            formattedDate = paymentDate.toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long'
                            });
                        }
                    } catch (dateError) {
                        console.error('Error formatting date:', dateError, payment);
                    }
                }

                content += `
                    <tr class="hover:bg-gray-50 border-b border-gray-200">
                        <td class="py-3 px-4">
                            <i class="far fa-calendar-alt text-green-500 mr-2"></i>
                            ${formattedDate}
                        </td>
                        <td class="py-3 px-4 text-center">
                            <span class="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded">
                                งวดที่ ${index + 1}
                            </span>
                        </td>
                        <td class="py-3 px-4 text-right font-medium">
                            ${payment.amount.toLocaleString('th-TH', {
                                style: 'currency',
                                currency: 'THB'
                            })}
                        </td>
                    </tr>
                `;
                totalPaid += payment.amount;
            });

            content += `
                        </tbody>
                        <tfoot class="bg-gray-50">
                            <tr>
                                <td colspan="2" class="py-3 px-4 text-right font-bold">รวมเงินที่ชำระทั้งหมด:</td>
                                <td class="py-3 px-4 text-right font-bold text-green-600">
                                    ${totalPaid.toLocaleString('th-TH', {
                                        style: 'currency',
                                        currency: 'THB'
                                    })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;

            // เพิ่ม console.log เพื่อดูข้อมูลที่ได้รับ
        } else {
            content += `
                <div class="text-center py-8">
                    <i class="fas fa-history text-gray-400 text-5xl mb-4"></i>
                    <p class="text-gray-500 text-lg">ยังไม่มีประวัติการชำระเงิน</p>
                </div>
            `;
        }

        contentDiv.innerHTML = content;
        modal.style.display = 'block';

        // Close modal when clicking outside
        modal.onclick = function(event) {
            if (event.target === modal) {
                closePaymentHistoryModal();
            }
        };
    } catch (error) {
        console.error('Error opening payment history modal:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถแสดงประวัติการชำระเงินได้',
            confirmButtonText: 'ตกลง'
        });
    }
};

const closePaymentHistoryModal = () => {
    const modal = document.getElementById('paymentHistoryModal');
    modal.style.display = 'none';
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
