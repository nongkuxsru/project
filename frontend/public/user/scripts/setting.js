document.addEventListener("DOMContentLoaded", () => {
    // ✅ ดึงข้อมูลจาก LocalStorage
    const userData = JSON.parse(localStorage.getItem("currentUser"));

    if (!userData) {
        alert("No user data found. Please log in again.");
        window.location.href = "/"; // Redirect ไปหน้า Login ถ้าไม่มีข้อมูลผู้ใช้
        return;
    }

    // ✅ แสดงข้อมูลในฟอร์ม
    populateForm(userData);

    // ✅ Event listener สำหรับอัปเดตข้อมูล
    document.getElementById("personalInfoForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        // ✅ ดึงข้อมูลจากฟอร์มและแปลงปีจาก พ.ศ. เป็น ค.ศ.
        const updatedData = {
            _id: userData._id, // ใช้ _id จาก LocalStorage
            name: document.getElementById("fullName").value,
            email: document.getElementById("email").value,
            address: document.getElementById("address").value,
            phone: document.getElementById("phone").value,
            birthday: (document.getElementById("birthday").value), // แปลงเป็นปี ค.ศ.
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

                console.log("User data updated successfully.");

                // ✅ อัปเดต Transaction พร้อมกัน
                await updateUserTransactions(updatedData.name);

                alert("User information updated successfully!");
                // window.location.href = "/user"; 
            } else {
                alert("Error updating data: " + result.error);
            }
        } catch (error) {
            console.error("Update failed:", error);
            alert("An error occurred while updating user information.");
        }
    });

    // ✅ ฟังก์ชันสำหรับอัปเดต Transaction
    async function updateUserTransactions(userName) {
        console.log(`Updating transactions for user: ${userName}`);
        try {
            const response = await fetch(`/api/staff/transactions/${userName}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ updated: true }),
            });

            if (!response.ok) {
                throw new Error("Failed to update transactions.");
            }

            console.log(`Transactions updated successfully for user: ${userName}`);
        } catch (error) {
            console.error("Error updating transactions:", error);
        }
    }
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

// เพิ่ม Event Listener สำหรับปุ่ม Logout
document.getElementById("logoutButton").addEventListener("click", logout);