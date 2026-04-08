// // // search.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

// PostgreSQL connection (from .env)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// GET /api/species?q=searchTerm
router.get("/", async (req, res) => {
  const search = req.query.q || "";

  try {
    const result = await pool.query(
      `
      SELECT 
        species_name,
        major_identifying_features,
        image_data
      FROM species_images
      WHERE species_name ILIKE $1
      ORDER BY species_name
      LIMIT 10
      `,
      [`${search}%`]
    );

    if (result.rows.length === 0) {
      return res.json({ found: false, species: [] });
    }

    const speciesData = result.rows.map((row) => {
      let base64Image = null;

      if (row.image_data) {
        const isPNG =
          row.image_data[0] === 0x89 &&
          row.image_data[1] === 0x50;

        const mimeType = isPNG ? "image/png" : "image/jpeg";

        base64Image = `data:${mimeType};base64,${row.image_data.toString("base64")}`;
      }

      return {
        name: row.species_name,
        description: row.major_identifying_features,
        image: base64Image,
      };
    });

    res.json({
      found: true,
      count: speciesData.length,
      species: speciesData,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;


   