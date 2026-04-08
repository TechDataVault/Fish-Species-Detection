// const express = require("express");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");
// const { Pool } = require("pg");

// const router = express.Router();

// /* ================================
//    OTP PURPOSE CONSTANTS
// ================================ */
// const OTP_PURPOSE = {
//   SIGNUP: "signup",
//   FORGOT_PASSWORD: "forgot_password",
// };

// /* ================================
//    PostgreSQL connection
// ================================ */
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// /* ================================
//    Email transporter
// ================================ */
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// /* ================================
//    SEND OTP
// ================================ */
// router.post("/send-otp", async (req, res) => {
//   try {
//     let { email, purpose } = req.body;

//     if (!email || !purpose) {
//       return res.status(400).json({ error: "Email and purpose required" });
//     }

//     if (!Object.values(OTP_PURPOSE).includes(purpose)) {
//       return res.status(400).json({ error: "Invalid OTP purpose" });
//     }

//     email = email.toLowerCase();

//     if (purpose === OTP_PURPOSE.FORGOT_PASSWORD) {
//       const user = await pool.query(
//         "SELECT 1 FROM users WHERE LOWER(email)=$1",
//         [email]
//       );

//       if (!user.rows.length) {
//         return res.status(400).json({ error: "Email not registered" });
//       }
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

//     // ✅ UPSERT instead of delete + insert
//     await pool.query(
//       `
//       INSERT INTO email_otp_verification (email, otp, purpose, expires_at, verified)
//       VALUES ($1, $2, $3, $4, false)
//       ON CONFLICT (email, purpose)
//       DO UPDATE SET
//         otp = EXCLUDED.otp,
//         expires_at = EXCLUDED.expires_at,
//         verified = false
//       `,
//       [email, otp, purpose, expiresAt]
//     );

//     await transporter.sendMail({
//       from: `"CMFRI Support" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject:
//         purpose === OTP_PURPOSE.SIGNUP
//           ? "CMFRI | Signup OTP"
//           : "CMFRI | Password Reset OTP",
//       html: `<h3>Your OTP is ${otp}</h3><p>Valid for 5 minutes.</p>`,
//     });

//     res.json({ message: "OTP sent successfully" });
//   } catch (err) {
//     console.error("SEND OTP ERROR:", err);

//     if (err.code === "23514") {
//       return res.status(400).json({ error: "Invalid OTP purpose" });
//     }

//     res.status(500).json({ error: "Failed to send OTP" });
//   }
// });

// /* ================================
//    VERIFY OTP
// ================================ */
// router.post("/verify-otp", async (req, res) => {
//   try {
//     let { email, otp, purpose } = req.body;

//     if (!email || !otp || !purpose) {
//       return res.status(400).json({ error: "Email, OTP & purpose required" });
//     }

//     if (!Object.values(OTP_PURPOSE).includes(purpose)) {
//       return res.status(400).json({ error: "Invalid OTP purpose" });
//     }

//     email = email.toLowerCase();

//     const result = await pool.query(
//       `
//       UPDATE email_otp_verification
//       SET verified = true
//       WHERE email = $1
//         AND otp = $2
//         AND purpose = $3
//         AND expires_at > NOW()
//       RETURNING email
//       `,
//       [email, otp, purpose]
//     );

//     if (result.rowCount === 0) {
//       return res.status(400).json({ error: "Invalid or expired OTP" });
//     }

//     res.json({ message: "OTP verified successfully" });
//   } catch (err) {
//     console.error("VERIFY OTP ERROR:", err);
//     res.status(500).json({ error: "OTP verification failed" });
//   }
// });

// /* ================================
//    LOGIN
// ================================ */
// router.post("/login", async (req, res) => {
//   try {
//     let { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ error: "Email and password required" });
//     }

//     email = email.toLowerCase();

//     const userRes = await pool.query(
//       `SELECT id, name, email, mobile, password
//        FROM users WHERE LOWER(email)=$1`,
//       [email]
//     );

//     if (!userRes.rows.length) {
//       return res.status(400).json({ error: "Invalid email or password" });
//     }

//     const user = userRes.rows[0];

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(400).json({ error: "Invalid email or password" });
//     }

//     const token = jwt.sign(
//       {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         mobile: user.mobile,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "365d" }
//     );

//     return res.json({
//       jwtToken: token,
//       id: user.id,
//       name: user.name,
//       email: user.email,
//       mobile: user.mobile,
//     });
//   } catch (err) {
//     console.error("LOGIN ERROR:", err);
//     res.status(500).json({ error: "Login failed" });
//   }
// });

// /* ================================
//    SIGNUP
// ================================ */
// router.post("/signup", async (req, res) => {
//   try {
//     let { name, mobile, email, userType, password } = req.body;

//     if (!name || !mobile || !email || !userType || !password) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     email = email.toLowerCase();

//     // ✅ Enforce OTP verification before signup
//     const otpCheck = await pool.query(
//       `SELECT verified FROM email_otp_verification
//        WHERE email=$1 AND purpose=$2`,
//       [email, OTP_PURPOSE.SIGNUP]
//     );

//     if (!otpCheck.rows.length || !otpCheck.rows[0].verified) {
//       return res.status(400).json({ error: "Email not verified" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const userRes = await pool.query(
//       `INSERT INTO users (name, mobile, email, user_type, password)
//        VALUES ($1,$2,$3,$4,$5)
//        RETURNING id, name, email, mobile`,
//       [name, mobile, email, userType, hashedPassword]
//     );

//     const user = userRes.rows[0];

//     const token = jwt.sign(
//       {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         mobile: user.mobile,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "365d" }
//     );

//     return res.status(201).json({
//       message: "Signup successful",
//       jwtToken: token,
//       id: user.id,
//       name: user.name,
//       email: user.email,
//       mobile: user.mobile,
//     });
//   } catch (err) {
//     console.error("SIGNUP ERROR:", err);

//     if (err.code === "23505") {
//       return res.status(409).json({ error: "This Email ID already has an account, Please Login" });
//     }

//     res.status(500).json({ error: "Signup failed" });
//   }
// });

// module.exports = router;

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { Pool } = require("pg");

const router = express.Router();

/* ================================
   OTP PURPOSE CONSTANTS
================================ */
const OTP_PURPOSE = {
  SIGNUP: "signup",
  FORGOT_PASSWORD: "forgot_password",
};

/* ================================
   PostgreSQL connection
================================ */
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

/* ================================
   Email transporter
================================ */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ================================
   SEND OTP
================================ */
router.post("/send-otp", async (req, res) => {
  try {
    let { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({ error: "Email and purpose required" });
    }

    if (!Object.values(OTP_PURPOSE).includes(purpose)) {
      return res.status(400).json({ error: "Invalid OTP purpose" });
    }

    email = email.toLowerCase();

    if (purpose === OTP_PURPOSE.FORGOT_PASSWORD) {
      const user = await pool.query(
        "SELECT 1 FROM users WHERE LOWER(email)=$1",
        [email]
      );

      if (!user.rows.length) {
        return res.status(400).json({ error: "Email not registered" });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `
      INSERT INTO email_otp_verification (email, otp, purpose, expires_at, verified)
      VALUES ($1, $2, $3, $4, false)
      ON CONFLICT (email, purpose)
      DO UPDATE SET
        otp = EXCLUDED.otp,
        expires_at = EXCLUDED.expires_at,
        verified = false
      `,
      [email, otp, purpose, expiresAt]
    );

    await transporter.sendMail({
      from: `"CMFRI Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject:
        purpose === OTP_PURPOSE.SIGNUP
          ? "CMFRI | Signup OTP"
          : "CMFRI | Password Reset OTP",
      html: `<h3>Your OTP is ${otp}</h3><p>Valid for 5 minutes.</p>`,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("SEND OTP ERROR:", err);

    if (err.code === "23514") {
      return res.status(400).json({ error: "Invalid OTP purpose" });
    }

    res.status(500).json({ error: "Failed to send OTP" });
  }
});

/* ================================
   VERIFY OTP
================================ */
router.post("/verify-otp", async (req, res) => {
  try {
    let { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose) {
      return res.status(400).json({ error: "Email, OTP & purpose required" });
    }

    if (!Object.values(OTP_PURPOSE).includes(purpose)) {
      return res.status(400).json({ error: "Invalid OTP purpose" });
    }

    email = email.toLowerCase();

    const result = await pool.query(
      `
      UPDATE email_otp_verification
      SET verified = true
      WHERE email = $1
        AND otp = $2
        AND purpose = $3
        AND expires_at > NOW()
      RETURNING email
      `,
      [email, otp, purpose]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

/* ================================
   LOGIN
================================ */
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    email = email.toLowerCase();

    const userRes = await pool.query(
      `SELECT id, name, email, mobile, password
       FROM users WHERE LOWER(email)=$1`,
      [email]
    );

    if (!userRes.rows.length) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = userRes.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    return res.json({
      jwtToken: token,
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* ================================
   SIGNUP
================================ */
router.post("/signup", async (req, res) => {
  try {
    let { name, mobile, email, userType, password } = req.body;

    if (!name || !mobile || !email || !userType || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    email = email.toLowerCase();

    const otpCheck = await pool.query(
      `SELECT verified FROM email_otp_verification
       WHERE email=$1 AND purpose=$2`,
      [email, OTP_PURPOSE.SIGNUP]
    );

    if (!otpCheck.rows.length || !otpCheck.rows[0].verified) {
      return res.status(400).json({ error: "Email not verified" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRes = await pool.query(
      `INSERT INTO users (name, mobile, email, user_type, password)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, email, mobile`,
      [name, mobile, email, userType, hashedPassword]
    );

    const user = userRes.rows[0];

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    return res.status(201).json({
      message: "Signup successful",
      jwtToken: token,
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);

    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "This Email ID already has an account, Please Login" });
    }

    res.status(500).json({ error: "Signup failed" });
  }
});

/* ================================
   RESET PASSWORD
================================ */
router.post("/reset-password", async (req, res) => {
  try {
    let { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and new password required" });
    }

    email = email.toLowerCase();

    const otpCheck = await pool.query(
      `SELECT verified FROM email_otp_verification
       WHERE email=$1 AND purpose=$2`,
      [email, OTP_PURPOSE.FORGOT_PASSWORD]
    );

    if (!otpCheck.rows.length || !otpCheck.rows[0].verified) {
      return res.status(400).json({ error: "OTP not verified" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      `UPDATE users SET password=$1 WHERE LOWER(email)=$2`,
      [hashedPassword, email]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    await pool.query(
      `DELETE FROM email_otp_verification WHERE email=$1 AND purpose=$2`,
      [email, OTP_PURPOSE.FORGOT_PASSWORD]
    );

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ error: "Password reset failed" });
  }
});

module.exports = router;