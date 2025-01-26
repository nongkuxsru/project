document.addEventListener("DOMContentLoaded", () => {
    // ตรวจสอบว่ามีข้อมูลใน LocalStorage หรือไม่
    let userData = JSON.parse(localStorage.getItem("currentUser"));
  
    localStorage.setItem("userData", JSON.stringify(userData));
  
    // ใส่ข้อมูลในฟอร์ม
    document.getElementById("userId").value = userData.id;
    document.getElementById("fullName").value = userData.name;
    document.getElementById("email").value = userData.email || "";
    document.getElementById("permission").value = userData.permission;
  
    // ฟังก์ชันบันทึกข้อมูลใหม่ลง LocalStorage
    document.getElementById("personalInfoForm").addEventListener("submit", (event) => {
      event.preventDefault();
  
      const updatedData = {
        id: document.getElementById("userId").value,
        name: document.getElementById("fullName").value,
        email: document.getElementById("email").value,
        permission: document.getElementById("permission").value,
      };
  
      localStorage.setItem("userData", JSON.stringify(updatedData));
      alert("User information updated successfully!");
    });
  });
  
  // ฟังก์ชันรีเซ็ตฟอร์ม
  function resetForm() {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (userData) {
      document.getElementById("userId").value = userData.id;
      document.getElementById("fullName").value = userData.name;
      document.getElementById("email").value = userData.email || "";
      document.getElementById("permission").value = userData.permission;
    }
  }

// ฟังก์ชันสำหรับ Logout
const logout = async () => {
    try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (response.ok) {
            window.location.href = '/'; // Redirect ไปยังหน้า Login หลังจาก Logout สำเร็จ
        } else {
            alert('Logout failed. Please try again.');
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
};

