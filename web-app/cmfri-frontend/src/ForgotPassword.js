import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import bgImage from "./assets/dashboard.jpg";

export default function ForgotPasswordFlow() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  const navigate = useNavigate();

  /* ================================
     STYLES
  ================================ */
  const styles = {
    wrapper: {
      width: "100%",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundImage: `url(${bgImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    },
    container: {
      backgroundColor: "rgba(255,255,255,0.96)",
      padding: "35px",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "420px",
      boxSizing: "border-box",
      textAlign: "center",
      boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
    },
    heading: {
      fontSize: "26px",
      marginBottom: "25px",
      fontWeight: "600",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "100%",
    },
    input: {
      width: "100%",
      padding: "14px",
      marginBottom: "16px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      fontSize: "16px",
      boxSizing: "border-box",
    },
    button: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#0072ce",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      cursor: "pointer",
      marginTop: "5px",
    },
    message: {
      color: "red",
      marginBottom: "15px",
      fontSize: "14px",
    },
    footerButton: {
      marginTop: "18px",
      background: "none",
      border: "none",
      color: "#0072ce",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: "14px",
    },
  };

  /* ================================
     API CALLS
  ================================ */
  const sendOtp = async () => {
    try {
      setError("");
      await axios.post("http://3.212.143.4:5000/api/auth/send-otp", {
        email,
        purpose: "forgot_password",
      });
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to send OTP");
    }
  };

  const verifyOtp = async () => {
    try {
      setError("");
      await axios.post("http://3.212.143.4:5000/api/auth/verify-otp", {
        email,
        otp,
        purpose: "forgot_password",
      });
      setOtpVerified(true);
      setStep(3);
    } catch (e) {
      setError(e.response?.data?.error || "Invalid OTP");
    }
  };

  const resetPassword = async () => {
    if (!otpVerified) {
      setError("OTP not verified");
      return;
    }

    try {
      setError("");
      await axios.post("http://3.212.143.4:5000/api/auth/reset-password", {
        email,
        newPassword: password,
      });
      alert("Password reset successful");
      navigate("/login");
    } catch (e) {
      setError(e.response?.data?.error || "Reset failed");
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Forgot Password</h2>

        {error && <p style={styles.message}>{error}</p>}

        <div style={styles.form}>
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <input
                style={styles.input}
                type="email"
                placeholder="Enter registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button style={styles.button} onClick={sendOtp}>
                Send OTP
              </button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <input
                style={styles.input}
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <button style={styles.button} onClick={verifyOtp}>
                Verify OTP
              </button>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <input
                style={styles.input}
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button style={styles.button} onClick={resetPassword}>
                Reset Password
              </button>
            </>
          )}
        </div>

        <button
          style={styles.footerButton}
          onClick={() => navigate("/login")}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
