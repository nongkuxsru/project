// ===============================
// Event Listeners
// ===============================
window.onload = () => {
    document.getElementById('logoutButton').addEventListener('click', logout);
    fetchNews();
};

document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    initializeNewsModal();
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
// News Management Functions
// ===============================

// Modal Management
const initializeNewsModal = () => {
    const modal = document.getElementById('newsModal');
    const addButton = document.getElementById('addNewsBtn');
    const closeButton = document.getElementById('closeModal');
    const form = document.getElementById('newsForm');

    addButton.addEventListener('click', () => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    });

    closeButton.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        form.reset();
    });

    form.addEventListener('submit', handleNewsSubmit);
};

// Fetch and Display News
const fetchNews = async () => {
    try {
        const response = await fetch('/api/news');
        const news = await response.json();
        renderNewsTable(news);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลข่าว:', error);
        Swal.fire({
            icon: 'error',
            title: 'ไม่สามารถดึงข้อมูลข่าวได้',
            text: 'กรุณาลองใหม่อีกครั้ง'
        });
    }
};

const renderNewsTable = (news) => {
    const tbody = document.getElementById('newsTableBody');
    tbody.innerHTML = '';

    if (news.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                    ไม่พบข้อมูลข่าวสาร
                </td>
            </tr>
        `;
        return;
    }

    news.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <img src="${item.image || '/images/default-news.jpg'}" 
                     alt="${item.title}" 
                     class="h-12 w-12 object-cover rounded">
            </td>
            <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">${item.title}</div>
                <div class="text-sm text-gray-500">${item.content.substring(0, 100)}...</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                    ${new Date(item.createdAt).toLocaleDateString('th-TH')}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editNews('${item._id}')" 
                        class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteNews('${item._id}')" 
                        class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
};

// Handle Form Submit
const handleNewsSubmit = async (event) => {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const newsId = form.dataset.newsId;
    const isEdit = !!newsId;

    try {
        const url = isEdit ? `/api/news/${newsId}` : '/api/news';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            body: formData // ส่ง FormData โดยตรงเพื่อรองรับการอัพโหลดไฟล์
        });

        if (!response.ok) throw new Error(isEdit ? 'การแก้ไขข่าวไม่สำเร็จ' : 'การเพิ่มข่าวไม่สำเร็จ');

        await Swal.fire({
            icon: 'success',
            title: isEdit ? 'แก้ไขข่าวสำเร็จ' : 'เพิ่มข่าวสำเร็จ',
            showConfirmButton: false,
            timer: 1500
        });

        document.getElementById('newsModal').classList.add('hidden');
        form.reset();
        form.removeAttribute('data-news-id');
        document.getElementById('modalTitle').textContent = 'เพิ่มข่าวสาร';
        fetchNews();
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการจัดการข่าว:', error);
        Swal.fire({
            icon: 'error',
            title: isEdit ? 'ไม่สามารถแก้ไขข่าวได้' : 'ไม่สามารถเพิ่มข่าวได้',
            text: 'กรุณาลองใหม่อีกครั้ง'
        });
    }
};

// Edit News
const editNews = async (newsId) => {
    try {
        const response = await fetch(`/api/news/${newsId}`);
        if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลข่าวได้');
        
        const news = await response.json();
        
        // เตรียมฟอร์มสำหรับแก้ไข
        const form = document.getElementById('newsForm');
        form.dataset.newsId = newsId;
        
        document.getElementById('newsTitle').value = news.title;
        document.getElementById('newsContent').value = news.content;
        
        // แสดง preview รูปภาพเดิม ถ้ามี
        if (news.image) {
            const previewContainer = document.createElement('div');
            previewContainer.id = 'currentImagePreview';
            previewContainer.className = 'mt-2';
            previewContainer.innerHTML = `
                <p class="text-sm text-gray-500 mb-1">รูปภาพปัจจุบัน:</p>
                <img src="${news.image}" alt="Current image" class="h-32 object-cover rounded">
            `;
            
            const imageInput = document.getElementById('newsImage');
            const existingPreview = document.getElementById('currentImagePreview');
            if (existingPreview) {
                existingPreview.remove();
            }
            imageInput.parentNode.insertBefore(previewContainer, imageInput.nextSibling);
        }

        // เปลี่ยนหัวข้อ modal
        document.getElementById('modalTitle').textContent = 'แก้ไขข่าวสาร';
        
        // เปิด modal
        const modal = document.getElementById('newsModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลข่าว:', error);
        Swal.fire({
            icon: 'error',
            title: 'ไม่สามารถโหลดข้อมูลข่าวได้',
            text: 'กรุณาลองใหม่อีกครั้ง'
        });
    }
};

// Preview Image
const previewImage = (input) => {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewContainer = document.createElement('div');
            previewContainer.id = 'imagePreview';
            previewContainer.className = 'mt-2';
            previewContainer.innerHTML = `
                <p class="text-sm text-gray-500 mb-1">ตัวอย่างรูปภาพ:</p>
                <img src="${e.target.result}" alt="Preview" class="h-32 object-cover rounded">
            `;
            
            const existingPreview = document.getElementById('imagePreview');
            const currentPreview = document.getElementById('currentImagePreview');
            if (existingPreview) {
                existingPreview.remove();
            }
            if (currentPreview) {
                currentPreview.remove();
            }
            input.parentNode.insertBefore(previewContainer, input.nextSibling);
        };
        reader.readAsDataURL(file);
    }
};

// Delete News
const deleteNews = async (newsId) => {
    try {
        const result = await Swal.fire({
            title: 'ยืนยันการลบข่าว',
            text: 'คุณต้องการลบข่าวนี้ใช่หรือไม่?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            const response = await fetch(`/api/news/${newsId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('การลบข่าวไม่สำเร็จ');

            await Swal.fire({
                icon: 'success',
                title: 'ลบข่าวสำเร็จ',
                showConfirmButton: false,
                timer: 1500
            });

            fetchNews();
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบข่าว:', error);
        Swal.fire({
            icon: 'error',
            title: 'ไม่สามารถลบข่าวได้',
            text: 'กรุณาลองใหม่อีกครั้ง'
        });
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