// uploadPhoto.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { Pool } = require("pg");
 
const router = express.Router();
 
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
   Helpers
================================ */
const sanitizeFolderName = (name) =>
  name.replace(/[^a-zA-Z0-9_-]/g, "_").trim();
 
const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};
 
/* ================================
   Base uploads folder
================================ */
const BASE_UPLOAD_DIR = "uploads";
ensureDirExists(BASE_UPLOAD_DIR);
ensureDirExists(path.join(BASE_UPLOAD_DIR, "unknown"));
 
/* ================================
   Multer (temporary upload)
================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BASE_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
 
const upload = multer({ storage });
 
/* ================================
   POST /upload-photo
================================ */
router.post("/", upload.single("photo"), async (req, res) => {
  const tempFilePath = req.file?.path;
 
  console.log("📥 Upload request received");
  console.log("📂 Temp file:", tempFilePath);
  console.log("👤 User:", {
    userId: req.body.user_id,
    name: req.body.name,
  });
 
  if (!tempFilePath) {
    return res.status(400).json({ error: "No file uploaded" });
  }
 
  try {
    /* ================================
       Send image to ML model
    ================================ */
    const FormData = require("form-data");
    const formData = new FormData();
    formData.append("file", fs.createReadStream(tempFilePath));
 
    console.log("🤖 Sending image to ML model...");
 
    const mlResponse = await axios.post(
      "http://44.194.72.188:8000/predict",
      formData,
      { headers: formData.getHeaders() }
    );
 
    console.log("✅ ML response:", mlResponse.data);
 
    const predictedFish = mlResponse.data.predicted_fish;
 
    /* ================================
       Decide target folder
    ================================ */
    const isUnknown =
      !predictedFish ||
      predictedFish.toLowerCase().includes("unknown");
 
    const targetFolder = isUnknown
      ? "unknown"
      : sanitizeFolderName(predictedFish);
 
    const targetDir = path.join(BASE_UPLOAD_DIR, targetFolder);
    ensureDirExists(targetDir);
 
    const finalImagePath = path.join(
      targetDir,
      path.basename(tempFilePath)
    );
 
    // Move image to final folder
    fs.renameSync(tempFilePath, finalImagePath);
 
    console.log("📁 Image stored at:", finalImagePath);
 
    /* ================================
       DB: Search known species
    ================================ */
    const dbResult = await pool.query(
      `SELECT species_name,
              major_identifying_features,
              image_data
       FROM species_images
       WHERE species_name ILIKE $1
       LIMIT 1`,
      [`%${predictedFish}%`]
    );
 
    if (dbResult.rows.length > 0) {
      const species = dbResult.rows[0];
 
      let speciesImageBase64 = null;
      if (species.image_data) {
        speciesImageBase64 = `data:image/jpeg;base64,${species.image_data.toString(
          "base64"
        )}`;
      }
 
      return res.json({
        status: "matched",
        title: `✅ Species Found: ${species.species_name}`,
        message: species.major_identifying_features,
        imageBase64: speciesImageBase64,
      });
    }
 
    /* ================================
       DB: Store unknown species
    ================================ */
    const photoBuffer = fs.readFileSync(finalImagePath);
 
    await pool.query(
      `INSERT INTO new_species_data (species_photo, sender_details)
       VALUES ($1, $2)`,
      [
        photoBuffer,
        JSON.stringify({
          user_id: req.body.user_id,
          name: req.body.name,
        }),
      ]
    );
 
    console.log("🆕 New species stored for admin review");
 
    const uploadedImageBase64 = `data:image/jpeg;base64,${photoBuffer.toString(
      "base64"
    )}`;
 
    return res.json({
      status: "new_species",
      title: "❌ Unidentified Species",
      message: "The image has been sent to admin for review.",
      imageBase64: uploadedImageBase64,
    });
  } catch (err) {
    console.error(
      "❌ Error processing upload:",
      err.response?.data || err.message
    );
    return res.status(500).json({ error: "Failed to process photo" });
  }
});
 
module.exports = router;