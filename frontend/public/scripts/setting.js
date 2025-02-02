document.addEventListener("DOMContentLoaded", () => {
    // ✅ ดึงข้อมูลจาก LocalStorage
    const userData = JSON.parse(localStorage.getItem("currentUser"));

    if (!userData) {
        alert("No user data found. Please log in again.");
        window.location.href = "/login"; // Redirect ไปหน้า Login ถ้าไม่มีข้อมูลผู้ใช้
        return;
    }

    // ✅ แสดงข้อมูลในฟอร์ม
    populateForm(userData);

    // ✅ Event listener สำหรับอัปเดตข้อมูล
    document.getElementById("personalInfoForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        // ✅ ดึงข้อมูลจากฟอร์ม
        const updatedData = {
            _id: userData._id, // ใช้ _id จาก LocalStorage
            name: document.getElementById("fullName").value,
            email: document.getElementById("email").value,
            address: document.getElementById("address").value,
            phone: document.getElementById("phone").value,
            birthday: document.getElementById("birthday").value,
            permission: userData.permission // ไม่ให้แก้ไข permission
        };

        try {
            // ✅ อัปเดตข้อมูลไปยัง Database ผ่าน API
            const response = await fetch(`/api/admin/users/${updatedData._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });

            const result = await response.json();
            if (response.ok) {
                // ✅ บันทึกข้อมูลใหม่ลง LocalStorage
                localStorage.setItem("currentUser", JSON.stringify(updatedData));

                alert("User information updated successfully!");
                window.location.href = "/staff-dashboard.html"; // ส่งกลับไปหน้า Staff Dashboard
            } else {
                alert("Error updating data: " + result.error);
            }
        } catch (error) {
            console.error("Update failed:", error);
            alert("An error occurred while updating user information.");
        }
    });
});


// ฟังก์ชันแสดงข้อมูลในฟอร์ม
function populateForm(userData) {
  document.getElementById("userId").value = userData._id || ""; // ใช้ _id แทน id
  document.getElementById("fullName").value = userData.name || "";
  document.getElementById("email").value = userData.email || "";
  document.getElementById("address").value = userData.address || "";
  document.getElementById("phone").value = userData.phone || "";
  document.getElementById("birthday").value = userData.birthday ? userData.birthday.split('T')[0] : ""; // แปลงรูปแบบวันที่
  document.getElementById("permission").value = userData.permission || "";
}

// ฟังก์ชันรีเซ็ตฟอร์ม
function resetForm() {
  const userData = JSON.parse(localStorage.getItem("userData"));
  if (userData) {
      populateForm(userData); // นำข้อมูลเดิมกลับมาแสดงในฟอร์ม
  } else {
      alert("No user data found to reset.");
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

// เพิ่ม Event Listener สำหรับปุ่ม Logout
document.getElementById("logoutButton").addEventListener("click", logout);