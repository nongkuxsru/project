// ฟังก์ชันสำหรับ Logout
const logout = async () => {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            // ลบข้อมูลจาก LocalStorage
            localStorage.removeItem("currentUser");
            localStorage.removeItem("selectedTheme");

            alert("Logout successful! Redirecting to login page...");
            window.location.href = "/";
        } else {
            alert("Logout failed. Please try again.");
        }
    } catch (error) {
        console.error("Error during logout:", error);
        alert("An error occurred while logging out.");
    }
};

// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
window.onload = () => {
    // เพิ่ม Event Listener สำหรับปุ่ม Logout
    document.getElementById('logoutButton').addEventListener('click', logout);
};

// ฟังก์ชันสำหรับ Toggle Sidebar
const toggleSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('collapsed');
};

// เพิ่ม Event Listener สำหรับปุ่ม Toggle Sidebar เมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', function () {
    // เพิ่ม Event Listener สำหรับปุ่ม Toggle Sidebar
    document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);

    // ฟังก์ชันแสดงข่าว
    const newsList = document.getElementById("newsList");
    
    fetch("/api/news")
        .then(response => response.json())
        .then(data => {
            newsList.innerHTML = "";
            data.forEach(news => {
                const li = document.createElement("li");
                li.textContent = news.title + " - " + news.content;
                li.classList.add("news-item");
                newsList.appendChild(li);
            });
        })
        .catch(error => {
            console.error("Error fetching news:", error);
            newsList.innerHTML = "<li class='error-message'>Failed to load news.</li>";
        });
});
