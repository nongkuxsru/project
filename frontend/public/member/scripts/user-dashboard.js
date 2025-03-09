// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
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

// เพิ่ม Event Listener สำหรับปุ่ม Toggle Sidebar เมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', function () {
    // ฟังก์ชันแสดงข่าว
    const newsList = document.getElementById("newsList");
    
    fetch("/api/news")
        .then(response => response.json())
        .then(data => {
            newsList.innerHTML = "";
            data.forEach(news => {
                const newsCard = document.createElement("div");
                newsCard.className = "bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 transition-transform duration-300 hover:transform hover:scale-105";
                
                // สร้าง HTML สำหรับการ์ดข่าว
                newsCard.innerHTML = `
                    <div class="relative">
                        <img src="${news.image || '/images/default-news.jpg'}" 
                             alt="${news.title}"
                             class="w-full h-48 object-cover">
                        <div class="absolute top-0 right-0 bg-green-500 text-white px-2 py-1 text-sm rounded-bl-lg">
                            ${new Date(news.createdAt).toLocaleDateString('th-TH')}
                        </div>
                    </div>
                    <div class="p-4">
                        <h3 class="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                            ${news.title}
                        </h3>
                        <p class="text-gray-600 text-sm line-clamp-3 mb-4">
                            ${news.content}
                        </p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center text-sm text-gray-500">
                                <i class="fas fa-user-edit mr-2"></i>
                                <span>${news.author || 'ผู้ดูแลระบบ'}</span>
                            </div>
                            ${news.link ? `
                                <a href="${news.link}" target="_blank" 
                                   class="text-primary hover:text-green-600 text-sm flex items-center">
                                    อ่านเพิ่มเติม
                                    <i class="fas fa-arrow-right ml-1"></i>
                                </a>
                            ` : ''}
                        </div>
                    </div>
                `;

                newsList.appendChild(newsCard);
            });

            // ถ้าไม่มีข่าว
            if (data.length === 0) {
                newsList.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-8 text-gray-500">
                        <i class="fas fa-newspaper text-4xl mb-2"></i>
                        <p>ไม่มีข่าวสารในขณะนี้</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error("Error fetching news:", error);
            newsList.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-8 text-red-500">
                    <i class="fas fa-exclamation-circle text-4xl mb-2"></i>
                    <p>ไม่สามารถโหลดข่าวสารได้</p>
                </div>
            `;
        });
});

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