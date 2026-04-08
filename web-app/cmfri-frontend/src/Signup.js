// import React, { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import "./Signup.css";
// import bgImage from "./assets/dashboard.jpg";

// export default function Signup() {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     name: "",
//     mobile: "",
//     email: "",
//     userType: "",
//     password: "",
//   });

//   const [otp, setOtp] = useState("");
//   const [otpSent, setOtpSent] = useState(false);
//   const [emailVerified, setEmailVerified] = useState(false);
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) =>
//     setForm({ ...form, [e.target.name]: e.target.value });

//   /* ================================
//      SEND OTP
//   ================================ */
//   const sendOtp = async () => {
//     if (!form.email) {
//       setMessage("Please enter email first");
//       return;
//     }

//     try {
//       setLoading(true);
//       await axios.post("http://3.212.143.4:5000/api/auth/send-otp", {
//         email: form.email,
//         purpose: "signup", // ✅ ADDED
//       });
//       setOtpSent(true);
//       setMessage("OTP sent to your email");
//     } catch (err) {
//       setMessage(err.response?.data?.error || "Failed to send OTP");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================================
//      VERIFY OTP
//   ================================ */
//   const verifyOtp = async () => {
//     if (!otp) {
//       setMessage("Please enter OTP");
//       return;
//     }

//     try {
//       setLoading(true);
//       await axios.post("http://3.212.143.4:5000/api/auth/verify-otp", {
//         email: form.email,
//         otp,
//         purpose: "signup", // ✅ ADDED (important)
//       });
//       setEmailVerified(true);
//       setMessage("Email verified successfully");
//     } catch (err) {
//       setMessage(err.response?.data?.error || "Invalid OTP");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================================
//      SIGNUP
//   ================================ */
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!emailVerified) {
//       setMessage("Please verify your email before signup");
//       return;
//     }

//     try {
//       setLoading(true);
//       const res = await axios.post(
//         "http://3.212.143.4:5000/api/auth/signup",
//         form
//       );

//       localStorage.setItem("jwtToken", res.data.jwtToken);
//       setMessage("Signup successful! Please login.");

//       setTimeout(() => navigate("/login"), 1500);
//     } catch (err) {
//       setMessage(err.response?.data?.error || "Signup failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div
//       className="signup-wrapper"
//       style={{
//         backgroundImage: `url(${bgImage})`,
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//         minHeight: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//     >
//       <h1 className="signup-heading">
//         Central Marine Fisheries Research Institute (CMFRI) Welcomes You
//       </h1>

//       <div className="signup-container">
//         <h2 className="signup-title">Sign Up</h2>

//         <form onSubmit={handleSubmit}>
//           <input
//             className="signup-input"
//             name="name"
//             placeholder="Name"
//             onChange={handleChange}
//             required
//           />

//           <input
//             className="signup-input"
//             name="mobile"
//             placeholder="Mobile"
//             onChange={handleChange}
//             required
//           />

//           <input
//             className="signup-input"
//             type="email"
//             name="email"
//             placeholder="Email"
//             onChange={handleChange}
//             required
//             disabled={emailVerified}
//           />

//           {!emailVerified && (
//             <button
//               type="button"
//               className="signup-button"
//               onClick={sendOtp}
//               disabled={loading}
//             >
//               {otpSent ? "Resend OTP" : "Send OTP"}
//             </button>
//           )}

//           {otpSent && !emailVerified && (
//             <>
//               <input
//                 className="signup-input"
//                 placeholder="Enter OTP"
//                 value={otp}
//                 onChange={(e) => setOtp(e.target.value)}
//               />
//               <button
//                 type="button"
//                 className="signup-button"
//                 onClick={verifyOtp}
//                 disabled={loading}
//               >
//                 Verify OTP
//               </button>
//             </>
//           )}

//           <input
//             className="signup-input"
//             name="userType"
//             placeholder="User Type"
//             onChange={handleChange}
//             required
//           />

//           <input
//             className="signup-input"
//             type="password"
//             name="password"
//             placeholder="Password"
//             onChange={handleChange}
//             required
//           />

//           <button
//             className="signup-button"
//             type="submit"
//             disabled={loading}
//           >
//             Sign Up
//           </button>
//         </form>

//         {message && <p className="signup-message">{message}</p>}

//         <p className="signup-footer">
//           Already have an account?
//           <button type="button" onClick={() => navigate("/login")}>
//             Login
//           </button>
//         </p>
//       </div>
//     </div>
//   );
// }


import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Signup.css";
import bgImage from "./assets/dashboard.jpg";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    userType: "",
    password: "",
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ================================
     SEND OTP
  ================================ */
  const sendOtp = async () => {
    if (!form.email) {
      setMessage("Please enter email first");
      return;
    }

    try {
      setLoading(true);
      await axios.post("http://3.212.143.4:5000/api/auth/send-otp", {
        email: form.email,
        purpose: "signup",
      });

      setOtpSent(true);
      setMessage("OTP sent to your email");
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================================
     VERIFY OTP
  ================================ */
  const verifyOtp = async () => {
    if (!otp) {
      setMessage("Please enter OTP");
      return;
    }

    try {
      setLoading(true);
      await axios.post("http://3.212.143.4:5000/api/auth/verify-otp", {
        email: form.email,
        otp,
        purpose: "signup",
      });

      setEmailVerified(true);
      setMessage("Email verified successfully");
    } catch (err) {
      setMessage(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================================
     SIGNUP
  ================================ */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!emailVerified) {
      setMessage("Please verify your email before signup");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://3.212.143.4:5000/api/auth/signup",
        form
      );

      /* ✅ Store JWT + User Details */
      if (res.data.jwtToken) {
        localStorage.setItem("jwtToken", res.data.jwtToken);
      }

      if (res.data.id) {
        localStorage.setItem("userId", res.data.id);
      }

      if (res.data.name) {
        localStorage.setItem("name", res.data.name);
      }

      if (res.data.email) {
        localStorage.setItem("email", res.data.email);
      }

      if (res.data.mobile) {
        localStorage.setItem("mobile", res.data.mobile);
      }

      setMessage("Signup successful! Please login.");

      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || "This Email ID already has an account, Please Login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="signup-wrapper"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1 className="signup-heading">
        Central Marine Fisheries Research Institute (CMFRI) Welcomes You
      </h1>

      <div className="signup-container">
        <h2 className="signup-title">Sign Up</h2>

        <form onSubmit={handleSubmit}>
          <input
            className="signup-input"
            name="name"
            placeholder="Name"
            onChange={handleChange}
            required
          />

          <input
            className="signup-input"
            name="mobile"
            placeholder="Mobile"
            onChange={handleChange}
            required
          />

          <input
            className="signup-input"
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
            disabled={emailVerified}
          />

          {!emailVerified && (
            <button
              type="button"
              className="signup-button"
              onClick={sendOtp}
              disabled={loading}
            >
              {otpSent ? "Resend OTP" : "Send OTP"}
            </button>
          )}

          {otpSent && !emailVerified && (
            <>
              <input
                className="signup-input"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button
                type="button"
                className="signup-button"
                onClick={verifyOtp}
                disabled={loading}
              >
                Verify OTP
              </button>
            </>
          )}

          <input
            className="signup-input"
            name="userType"
            placeholder="User Type"
            onChange={handleChange}
            required
          />

          <input
            className="signup-input"
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />

          <button className="signup-button" type="submit" disabled={loading}>
            Sign Up
          </button>
        </form>

        {message && <p className="signup-message">{message}</p>}

        <p className="signup-footer">
          Already have an account?
          <button type="button" onClick={() => navigate("/login")}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
