document.addEventListener('DOMContentLoaded', function() {
    // ค้นหา element ที่จะใส่ topbar
    const topbarContainer = document.getElementById('topbarContainer');
    
    if (topbarContainer) {
        // โหลด topbar component
        fetch('/member/components/topbar.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('ไม่สามารถโหลด topbar ได้');
                }
                return response.text();
            })
            .then(html => {
                topbarContainer.innerHTML = html;
                
                // เพิ่ม active class ให้กับลิงก์ปัจจุบัน
                const currentPath = window.location.pathname;
                const links = topbarContainer.querySelectorAll('a');
                
                links.forEach(link => {
                    if (link.getAttribute('href') === currentPath || 
                        (currentPath.includes(link.getAttribute('href')) && link.getAttribute('href') !== '/member/')) {
                        link.classList.add('bg-white/40');
                        link.classList.add('font-semibold');
                    }
                });
            })
            .catch(error => {
                console.error('เกิดข้อผิดพลาดในการโหลด topbar:', error);
            });
    }
});