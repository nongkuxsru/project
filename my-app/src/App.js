import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login"; // หน้า Login
import AdminDashboard from "./components/AdminDashboard"; // สร้าง Component สำหรับหน้า Admin
import StaffDashboard from "./components/StaffDashboard"; // สร้าง Component สำหรับหน้า Staff
import UserDashboard from "./components/UserDashboard"; // สร้าง Component สำหรับหน้า User


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
