import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const sendOtp = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/send-otp", {
        email,
        purpose: "forgot_password",
      });

      navigate("/verify-otp", {
        state: { email, purpose: "forgot_password" },
      });
    } catch (e) {
      alert(e.response?.data?.message || "Error sending OTP");
    }
  };

  return (
    <>
      <h2>Forgot Password</h2>
      <input
        placeholder="Enter email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={sendOtp}>Send OTP</button>
    </>
  );
}
