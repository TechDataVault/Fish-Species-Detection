import React, { useState, useEffect } from "react";
import axios from "axios";
import backgroundImg from "./assets/dashboard.jpg";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

export default function UploadPhoto() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const navigate = useNavigate();

  // 🔐 Get logged-in user info
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const decoded = jwtDecode(token);
      setUserId(decoded.id);
      setUserName(decoded.name);
    } catch {
      localStorage.removeItem("jwtToken");
      navigate("/login");
    }
  }, [navigate]);

  // 🔹 Convert description to bullet points
  const formatPoints = (text) => {
    if (!text) return [];
    return text
      .split(/\d+\.\s+/)
      .filter((point) => point.trim() !== "");
  };

  // 📂 File validation
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = ["image/png", "image/jpeg"];
    if (!validTypes.includes(selectedFile.type)) {
      alert("Only PNG and JPG files are allowed!");
      e.target.value = null;
      return;
    }
    setFile(selectedFile);
  };

  // 🚀 Upload handler
  const handleUpload = async () => {
    if (!file) return alert("Please select a file!");
    if (!userId || !userName) return alert("User not identified!");

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("user_id", userId);
    formData.append("name", userName);

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(
       "http://localhost:5000/upload-photo",
       //"http://3.212.143.4:5000/upload-photo",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setResult({
        type: res.data.status === "matched" ? "success" : "info",
        title: res.data.title,
        message: res.data.message,
        imageBase64: res.data.imageBase64,
      });
    } catch (err) {
      console.error(err);
      setResult({
        type: "error",
        title: "❌ Upload failed",
        message: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🎨 UI colors (BLUE for success)
  const getColors = (type) => {
    switch (type) {
      case "success":
        return {
          border: "#007bff",   // 🔵 blue
          bg: "#ffffff",
          color: "#004085",
        };
      case "info":
        return {
          border: "#17a2b8",
          bg: "#ffffff",
          color: "#0c5460",
        };
      case "error":
      default:
        return {
          border: "#dc3545",
          bg: "#ffffff",
          color: "#721c24",
        };
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          backgroundColor: "rgba(255,255,255,0.95)",
          borderRadius: "14px",
          padding: "40px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* 🔙 Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            position: "absolute",
            top: "18px",
            left: "18px",
            padding: "8px 14px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#6c757d",
            color: "#fff",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          ← Back
        </button>

        <h2
          style={{
            textAlign: "center",
            marginBottom: "25px",
            fontSize: "26px",
          }}
        >
          Upload Species Image
        </h2>

        <input
          type="file"
          accept=".png,.jpg,.jpeg"
          onChange={handleFileChange}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginBottom: "20px",
          }}
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#007bff",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Uploading..." : "Upload Photo"}
        </button>

        {result && (
          <div
            style={{
              marginTop: "25px",
              padding: "25px",
              borderRadius: "14px",
              borderLeft: `6px solid ${getColors(result.type).border}`,
              backgroundColor: getColors(result.type).bg,
              color: getColors(result.type).color,
              overflowY: "auto",
              flex: "1",
              fontSize: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <h3 style={{ fontSize: "20px", marginBottom: "15px" }}>
              {result.title}
            </h3>

            {/* 🖼 Image FIRST */}
            {result.imageBase64 && (
              <img
                src={result.imageBase64}
                alt="Species"
                style={{
                  marginBottom: "20px",
                  width: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                  borderRadius: "12px",
                  border: "1px solid #ccc",
                }}
              />
            )}

            {/* 📄 Description */}
            <ul style={{ paddingLeft: "22px", lineHeight: "1.7" }}>
              {formatPoints(result.message).map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
