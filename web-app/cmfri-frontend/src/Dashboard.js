import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import bgImage from "./assets/dashboard.jpg";
import { jwtDecode } from "jwt-decode";

export default function Dashboard() {
  const navigate = useNavigate();

  // Redirect if user is not logged in
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      jwtDecode(token); // validate token
    } catch {
      localStorage.removeItem("jwtToken");
      navigate("/login");
    }
  }, []);

  return (
    <div
      className="dashboard-wrapper"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div className="dashboard-container">
        <div className="dashboard-buttons">
          <button onClick={() => navigate("/search")}>Search</button>
          <button onClick={() => navigate("/upload")}>Upload</button>
        </div>
      </div>
    </div>
  );
}
