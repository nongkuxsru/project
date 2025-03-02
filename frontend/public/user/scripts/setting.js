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

document.addEventListener("DOMContentLoaded", () => {
    // ✅ ดึงข้อมูลจาก LocalStorage
    const userData = JSON.parse(localStorage.getItem("currentUser"));

    if (!userData) {
        Swal.fire({
            icon: 'error',
            title: 'No user data found',
            text: 'Please log in again.',
        }).then(() => {
            window.location.href = "/"; // Redirect ไปหน้า Login ถ้าไม่มีข้อมูลผู้ใช้
        });
        return;
    }

    // ✅ แสดงข้อมูลในฟอร์ม
    populateForm(userData);

    // ✅ Event listener สำหรับอัปเดตข้อมูล
    document.getElementById("personalInfoForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
            // เก็บชื่อเดิมก่อนอัพเดท
            const oldUsername = userData.name;
            
            // ดึงข้อมูลจากฟอร์ม
            const updatedData = {
                _id: userData._id,
                name: document.getElementById("fullName").value,
                email: document.getElementById("email").value,
                address: document.getElementById("address").value,
                phone: document.getElementById("phone").value,
                birthday: document.getElementById("birthday").value,
                permission: userData.permission
            };

            // อัพเดทข้อมูลผู้ใช้
            const response = await fetch(`/api/admin/users/${updatedData._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });

            const result = await response.json();
            
            if (response.ok) {
                // บันทึกข้อมูลใหม่ลง LocalStorage
                localStorage.setItem("currentUser", JSON.stringify(updatedData));

                // อัพเดทธุรกรรมถ้าชื่อมีการเปลี่ยนแปลง
                if (oldUsername !== updatedData.name) {
                    await updateUserTransactions(oldUsername, updatedData.name);
                }

                await Swal.fire({
                    icon: 'success',
                    title: 'อัพเดทข้อมูลสำเร็จ',
                    text: 'กำลังนำคุณไปยังหน้าแดชบอร์ด...',
                    timer: 1500,
                    showConfirmButton: false
                });

                window.location.href = "/user";
            } else {
                throw new Error(result.error || 'Failed to update user data');
            }
        } catch (error) {
            console.error("Update failed:", error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถอัพเดทข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
            });
        }
    });

    // ✅ ฟังก์ชันสำหรับอัปเดต Transaction
    async function updateUserTransactions(oldUsername, newUsername) {
        try {
            if (!oldUsername || !newUsername) {
                return;
            }

            const response = await fetch('/api/staff/transactions/update-username', {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    oldUsername: oldUsername.trim(),
                    newUsername: newUsername.trim()
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 404) {
                    return;
                }
                throw new Error(data.message || 'ไม่สามารถอัพเดทธุรกรรมได้');
            }

        } catch (error) {
            // ไม่ต้องแสดง alert เมื่อเกิดข้อผิดพลาด เพราะข้อมูลผู้ใช้ถูกบันทึกแล้ว
            console.error('Error updating transactions:', error);
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