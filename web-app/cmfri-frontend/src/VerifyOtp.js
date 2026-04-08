import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function VerifyOtp() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");

  const verifyOtp = async () => {
    try {
      await axios.post("http://3.212.143.4:5000/api/auth/verify-otp", {
        email: state.email,
        otp,
        purpose: state.purpose,
      });

      if (state.purpose === "forgot_password") {
        navigate("/reset-password", { state });
      } else {
        navigate("/login");
      }
    } catch (e) {
      alert(e.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <>
      <h2>Verify OTP</h2>
      <input
        placeholder="Enter OTP"
        onChange={(e) => setOtp(e.target.value)}
      />
      <button onClick={verifyOtp}>Verify</button>
    </>
  );
}
