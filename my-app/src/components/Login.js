import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ใช้ Hook สำหรับการเปลี่ยนเส้นทาง
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // ใช้สำหรับเปลี่ยนหน้า

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // ตรวจสอบสถานะการตอบกลับ
      if (!response.ok) {
        const errorResult = await response.json();
        alert(errorResult.error || "Something went wrong!");
        return;
      }

      const result = await response.json();

      // ตรวจสอบว่ามี user และ permission หรือไม่
      if (result && result.user && result.user.permission) {
        alert(result.message); // แสดงข้อความที่ได้รับจาก API

        const { permission } = result.user;
        switch (permission) {
          case "admin":
            navigate("/admin-dashboard"); // เปลี่ยนหน้าไป Admin Dashboard
            break;
          case "staff":
            navigate("/staff-dashboard"); // เปลี่ยนหน้าไป Staff Dashboard
            break;
          default:
            navigate("/user-dashboard"); // เปลี่ยนหน้าไป User Dashboard
        }
      } else {
        alert("User or permission data is missing!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    }
  };

  return (
    <div className="container">
      <div className="login-container">
        <div className="circle circle-one"></div>
        <div className="form-container">
          <img
            src="https://raw.githubusercontent.com/hicodersofficial/glassmorphism-login-form/master/assets/illustration.png"
            alt="Login Illustration"
            className="illustration"
          />
          <h1 className="opacity">LOGIN</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">SUBMIT</button>
          </form>
        </div>
        <div className="circle circle-two"></div>
      </div>
    </div>
  );
};

export default Login;
