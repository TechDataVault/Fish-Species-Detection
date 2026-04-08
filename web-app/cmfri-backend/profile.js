const express = require("express");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const router = express.Router();

/* ================================
   PostgreSQL Connection
================================ */
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

/* =====================================
   UPDATE EMAIL (PROFILE API)
   Auth: JWT (Authorization Header)
===================================== */
router.put("/update-email", async (req, res) => {
    const authHeader = req.headers.authorization;
    const { newEmail } = req.body;

    if (!authHeader || !newEmail) {
        return res.status(400).json({
            success: false,
            message: "Authorization token and newEmail are required",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Check if email already exists
        const emailExists = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [newEmail]
        );

        if (emailExists.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already exists",
            });
        }

        // Generate new JWT with updated email
        const newToken = jwt.sign(
            {
                id: userId,
                email: newEmail,
                name: decoded.name,
            },
            process.env.JWT_SECRET,
            { expiresIn: "365d" }
        );

        // Update email & jwt_token in DB
        await pool.query(
            `UPDATE users
       SET email = $1,
           jwt_token = $2
       WHERE id = $3`,
            [newEmail, newToken, userId]
        );

        return res.status(200).json({
            success: true,
            message: "Email updated successfully",
            token: newToken,
        });

    } catch (error) {
        console.error("Profile Update Error:", error);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
});

module.exports = router;
