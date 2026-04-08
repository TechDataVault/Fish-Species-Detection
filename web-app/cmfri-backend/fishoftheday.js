const express = require("express");
const { Pool } = require("pg");
 
const router = express.Router();
 
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432
});
 
router.get("/fish-of-the-day", async (req, res) => {
  try {
    // 1. Get total records
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM species_of_the_day"
    );
    const total = parseInt(countResult.rows[0].count);
 
    if (total === 0) {
      return res.status(404).json({ message: "No species found" });
    }
 
    // 2. Calculate day index
    const startDate = new Date("2024-01-01"); // fixed reference date
    const today = new Date();
 
    const diffDays = Math.floor(
      (today - startDate) / (1000 * 60 * 60 * 24)
    );
 
    const offset = diffDays % total;
 
    // 3. Fetch fish of the day
    const result = await pool.query(
      `
      SELECT
        id,
        species_name,
        family,
        common_names,
        major_identifying_features,
        encode(image_data, 'base64') AS image
      FROM species_of_the_day
      ORDER BY id
      LIMIT 1 OFFSET $1
      `,
      [offset]
    );
 
    res.json({
      date: today.toISOString().split("T")[0],
      fish: result.rows[0]
    });
 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
 
module.exports = router;
 