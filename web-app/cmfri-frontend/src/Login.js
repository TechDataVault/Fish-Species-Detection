// import React, { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import bgImage from "./assets/dashboard.jpg"; // background image

// export default function Login() {
//   const [form, setForm] = useState({ email: "", password: "" });
//   const [message, setMessage] = useState("");
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage("Logging in...");
//     try {
//       const res = await axios.post(
//         "http://3.212.143.4:5000/api/auth/login",
//         form
//       );
//       localStorage.setItem("jwtToken", res.data.jwtToken);
//       navigate("/dashboard");
//     } catch (err) {
//       setMessage(err.response?.data?.error || "Login failed");
//     }
//   };

//   /* ================================
//      Inline Styles
//   ================================ */
//   const styles = {
//     wrapper: {
//       width: "100%",
//       height: "100vh",
//       display: "flex",
//       justifyContent: "center",
//       alignItems: "center",
//       backgroundImage: `url(${bgImage})`,
//       backgroundSize: "cover",
//       backgroundPosition: "center",
//       backgroundRepeat: "no-repeat",
//     },
//     container: {
//       background: "rgba(255, 255, 255, 0.95)",
//       padding: "40px 30px",
//       borderRadius: "12px",
//       boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
//       width: "100%",
//       maxWidth: "400px",
//       textAlign: "center",
//     },
//     heading: {
//       fontSize: "28px",
//       color: "#333",
//       marginBottom: "25px",
//     },
//     input: {
//       width: "100%",
//       padding: "14px 12px",
//       marginBottom: "15px",
//       border: "1px solid #ccc",
//       borderRadius: "8px",
//       fontSize: "16px",
//       boxSizing: "border-box",
//     },
//     button: {
//       width: "100%",
//       padding: "14px",
//       backgroundColor: "#0072ce",
//       color: "white",
//       border: "none",
//       borderRadius: "8px",
//       fontSize: "16px",
//       cursor: "pointer",
//       transition: "0.3s",
//     },
//     message: {
//       color: "red",
//       marginTop: "10px",
//       fontSize: "14px",
//     },
//     footer: {
//       marginTop: "20px",
//       fontSize: "14px",
//     },
//     footerButton: {
//       background: "none",
//       border: "none",
//       color: "#0072ce",
//       fontWeight: "bold",
//       cursor: "pointer",
//       marginLeft: "5px",
//     },
//     forgotPassword: {
//       textAlign: "right",
//       marginBottom: "10px",
//     },
//     forgotButton: {
//       background: "none",
//       border: "none",
//       color: "#0072ce",
//       cursor: "pointer",
//       fontSize: "14px",
//       padding: 0,
//     },
//   };

//   return (
//     <div style={styles.wrapper}>
//       <div style={styles.container}>
//         <h2 style={styles.heading}>Login</h2>

//         <form onSubmit={handleSubmit}>
//           <input
//             style={styles.input}
//             type="email"
//             name="email"
//             placeholder="Email"
//             value={form.email}
//             onChange={handleChange}
//             required
//           />

//           <input
//             style={styles.input}
//             type="password"
//             name="password"
//             placeholder="Password"
//             value={form.password}
//             onChange={handleChange}
//             required
//           />

//           {/* Forgot Password */}
//           <div style={styles.forgotPassword}>
//             <button
//               type="button"
//               style={styles.forgotButton}
//               onClick={() => navigate("/forgot-password")}
//             >
//               Forgot Password?
//             </button>
//           </div>

//           <button
//             style={styles.button}
//             type="submit"
//             onMouseOver={(e) =>
//               (e.target.style.backgroundColor = "#005bb5")
//             }
//             onMouseOut={(e) =>
//               (e.target.style.backgroundColor = "#0072ce")
//             }
//           >
//             Login
//           </button>
//         </form>

//         {message && <p style={styles.message}>{message}</p>}

//         <p style={styles.footer}>
//           Don&apos;t have an account?
//           <button
//             type="button"
//             style={styles.footerButton}
//             onClick={() => navigate("/")}
//           >
//             Sign Up
//           </button>
//         </p>
//       </div>
//     </div>
//   );
// }

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import bgImage from "./assets/dashboard.jpg"; // background image
 
export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
 
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Logging in...");
    try {
      const res = await axios.post(
        "http://3.212.143.4:5000/api/auth/login",  
        form
      );
      localStorage.setItem("jwtToken", res.data.jwtToken);
      navigate("/dashboard");
    } catch (err) {
      setMessage(err.response?.data?.error || "Login failed");
    }
  };
 
  /* ================================
     Inline Styles
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
      backgroundRepeat: "no-repeat",
    },
    container: {
      background: "rgba(255, 255, 255, 0.95)",
      padding: "40px 30px",
      borderRadius: "12px",
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
      width: "100%",
      maxWidth: "400px",
      textAlign: "center",
    },
    heading: {
      fontSize: "28px",
      color: "#333",
      marginBottom: "25px",
    },
    input: {
      width: "100%",
      padding: "14px 12px",
      marginBottom: "15px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      fontSize: "16px",
      boxSizing: "border-box",
    },
    button: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#0072ce",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      cursor: "pointer",
      transition: "0.3s",
    },
    message: {
      color: "red",
      marginTop: "10px",
      fontSize: "14px",
    },
    footer: {
      marginTop: "20px",
      fontSize: "14px",
    },
    footerButton: {
      background: "none",
      border: "none",
      color: "#0072ce",
      fontWeight: "bold",
      cursor: "pointer",
      marginLeft: "5px",
    },
    forgotPassword: {
      textAlign: "right",
      marginBottom: "10px",
    },
    forgotButton: {
      background: "none",
      border: "none",
      color: "#0072ce",
      cursor: "pointer",
      fontSize: "14px",
      padding: 0,
    },
  };
 
  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Login</h2>
 
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
 
          <input
            style={styles.input}
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
 
          {/* Forgot Password */}
          <div style={styles.forgotPassword}>
            <button
              type="button"
              style={styles.forgotButton}
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </button>
          </div>
 
          <button
            style={styles.button}
            type="submit"
            onMouseOver={(e) =>
              (e.target.style.backgroundColor = "#005bb5")
            }
            onMouseOut={(e) =>
              (e.target.style.backgroundColor = "#0072ce")
            }
          >
            Login
          </button>
        </form>
 
        {message && <p style={styles.message}>{message}</p>}
 
        <p style={styles.footer}>
          Don&apos;t have an account?
          <button
            type="button"
            style={styles.footerButton}
            onClick={() => navigate("/")}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}