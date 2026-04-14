const express = require("express");
const multer = require("multer");
const {
  getVideoTestimonials,
  getVideoTestimonialById,
  createVideoTestimonial,
  updateVideoTestimonial,
  deleteVideoTestimonial,
} = require("../controllers/videoTestimonialController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const imageUploads = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "bannerImage", maxCount: 1 },
  { name: "bannerimage", maxCount: 1 },
]);

router.get("/", getVideoTestimonials);
router.get("/:id", getVideoTestimonialById);
router.post("/", imageUploads, createVideoTestimonial);
router.put("/:id", imageUploads, updateVideoTestimonial);
router.patch("/:id", imageUploads, updateVideoTestimonial);
router.delete("/:id", deleteVideoTestimonial);

module.exports = router;
