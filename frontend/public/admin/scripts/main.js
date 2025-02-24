document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // ดึงค่าจากฟอร์ม
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // ส่งข้อมูลไปยัง Back-end
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const result = await response.json();
    if (response.ok) {
        // ใช้ SweetAlert2 แสดงข้อความสำเร็จ
        await Swal.fire({
            icon: 'success',
            title: 'Login Successful!',
            text: result.message,
            timer: 2000, // ตั้งเวลาแสดง 2 วินาที
            showConfirmButton: false,  // ไม่แสดงปุ่ม "OK"
        });

        // ✅ บันทึกข้อมูลผู้ใช้ลง localStorage
        localStorage.setItem('currentUser', JSON.stringify(result.user));

        // ตรวจสอบสิทธิ์และ redirect ไปยังหน้าที่เหมาะสม
        const { permission } = result.user;
        switch (permission) {
            case 'admin':
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                window.location.href = '/admin'; // หน้า Admin
                break;
            case 'staff':
                window.location.href = '/staff'; // หน้า Staff
                break;
            default:
                window.location.href = '/user'; // หน้า User
        }
    } else {
        // ใช้ SweetAlert2 แสดงข้อความข้อผิดพลาด
        await Swal.fire({
            icon: 'error',
            title: 'Login Failed!',
            text: result.error,
        });
    }
});


const themes = [
    {
        background: "#1A1A2E",
        color: "#FFFFFF",
        primaryColor: "#0F3460"
    },
    {
        background: "#461220",
        color: "#FFFFFF",
        primaryColor: "#E94560"
    },
    {
        background: "#192A51",
        color: "#FFFFFF",
        primaryColor: "#967AA1"
    },
    {
        background: "#F7B267",
        color: "#000000",
        primaryColor: "#F4845F"
    },
    {
        background: "#F25F5C",
        color: "#000000",
        primaryColor: "#642B36"
    },
    {
        background: "#231F20",
        color: "#FFF",
        primaryColor: "#BB4430"
    }
];

// 🔹 ตั้งค่าธีม
const setTheme = (theme) => {
    const root = document.querySelector(":root");
    root.style.setProperty("--background", theme.background);
    root.style.setProperty("--color", theme.color);
    root.style.setProperty("--primary-color", theme.primaryColor);

    // ✅ บันทึกธีมที่เลือกลง localStorage
    localStorage.setItem("selectedTheme", JSON.stringify(theme));
};

// 🔹 แสดงปุ่มเลือกธีม
const displayThemeButtons = () => {
    const btnContainer = document.querySelector(".theme-btn-container");
    themes.forEach((theme) => {
        const div = document.createElement("div");
        div.className = "theme-btn";
        div.style.cssText = `background: ${theme.background}; width: 25px; height: 25px`;
        btnContainer.appendChild(div);
        div.addEventListener("click", () => setTheme(theme));
    });
};

// ✅ โหลดธีมที่เลือกไว้ก่อนหน้า (ถ้ามี)
document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = JSON.parse(localStorage.getItem("selectedTheme"));
    if (savedTheme) {
        setTheme(savedTheme);
    }
});

displayThemeButtons();