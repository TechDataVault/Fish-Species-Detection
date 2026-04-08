import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function ResetPassword() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  const resetPassword = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        email: state.email,
        newPassword: password,
      });

      alert("Password reset successful");
      navigate("/login");
    } catch (e) {
      alert(e.response?.data?.message || "Error resetting password");
    }
  };

  return (
    <>
      <h2>Reset Password</h2>
      <input
        type="password"
        placeholder="New password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={resetPassword}>Reset</button>
    </>
  );
}
