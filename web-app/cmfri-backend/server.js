const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* ================================
   ROUTES
================================ */
const authRoutes = require("./auth");
const searchRoutes = require("./search");
const uploadPhotoRoutes = require("./uploadPhoto");
const profileRoutes = require("./profile");
const fishOfTheDayRoutes = require("./fishoftheday"); // ✅ NEW

/* ================================
   MIDDLEWARE
================================ */
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================================
   MOUNT ROUTES
================================ */
app.use("/api/auth", authRoutes);
app.use("/api/species", searchRoutes);
app.use("/upload-photo", uploadPhotoRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/fish", fishOfTheDayRoutes); // ✅ NEW

/* ================================
   TEST ROUTE
================================ */
app.get("/", (req, res) => {
  res.send("🟢 CMFRI Backend Running");
});

/* ================================
   START SERVER
================================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
