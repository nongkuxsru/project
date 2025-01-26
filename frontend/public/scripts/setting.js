document.addEventListener("DOMContentLoaded", () => {
  // ตรวจสอบว่ามีข้อมูลใน LocalStorage หรือไม่
  const userData = JSON.parse(localStorage.getItem("currentUser"));

  if (!userData) {
      alert("No user data found. Please log in again.");
      window.location.href = "/login"; // Redirect ไปหน้า Login ถ้าไม่มีข้อมูลผู้ใช้
      return;
  }

  // บันทึกข้อมูลผู้ใช้ใน LocalStorage (ถ้ายังไม่มี)
  if (!localStorage.getItem("userData")) {
      localStorage.setItem("userData", JSON.stringify(userData));
  }

  // แสดงข้อมูลในฟอร์ม
  populateForm(userData);

  // ฟังก์ชันบันทึกข้อมูลใหม่ลง LocalStorage
  document.getElementById("personalInfoForm").addEventListener("submit", (event) => {
      event.preventDefault();

      // อัปเดตข้อมูล
      const updatedData = {
          _id: document.getElementById("userId").value, // ใช้ _id แทน id
          name: document.getElementById("fullName").value,
          email: document.getElementById("email").value,
          address: document.getElementById("address").value,
          phone: document.getElementById("phone").value,
          birthday: document.getElementById("birthday").value,
          permission: document.getElementById("permission").value,
      };

      // บันทึกข้อมูลใหม่ลง LocalStorage
      localStorage.setItem("userData", JSON.stringify(updatedData));
      alert("User information updated successfully!");
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
          alert('น้องบ่าวติออกจริงๆใช่ม้าย?');
          window.location.href = '/';
          
      } else {
          alert('Logout failed. Please try again.');
      }
  } catch (error) {
      console.error('Error during logout:', error);
  }
};

// เพิ่ม Event Listener สำหรับปุ่ม Logout
document.getElementById("logoutButton").addEventListener("click", logout);