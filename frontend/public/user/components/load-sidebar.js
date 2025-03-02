document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/user/components/sidebar.html');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const sidebarHtml = await response.text();
        // แทรก sidebar ก่อน main element
        document.querySelector('main').insertAdjacentHTML('beforebegin', sidebarHtml);
        
        // เพิ่ม event listener สำหรับปุ่ม logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
            });
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการโหลด sidebar:', error);
    }
}); 