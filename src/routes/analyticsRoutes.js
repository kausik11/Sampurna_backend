const express = require("express");
const { trackVisit, getDailyStats } = require("../controllers/analyticsController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Public endpoint to record anonymous page views
router.post("/track", trackVisit);

// Protected reporting endpoint
router.get("/daily", getDailyStats);

module.exports = router;
