const express = require("express");
const multer = require("multer");
const {
  getResultImages,
  getResultImageById,
  createResultImage,
  updateResultImage,
  deleteResultImage,
  getResultImageTags,
} = require("../controllers/resultImageController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const imageUploads = upload.fields([
  { name: "beforeimage", maxCount: 1 },
  { name: "afterimage", maxCount: 1 },
  { name: "beforeImage", maxCount: 1 },
  { name: "afterImage", maxCount: 1 },
]);

router.get("/", getResultImages);
router.get("/tags", getResultImageTags);
router.get("/:id", getResultImageById);
router.post("/", imageUploads, createResultImage);
router.put("/:id", imageUploads, updateResultImage);
router.patch("/:id", imageUploads, updateResultImage);
router.delete("/:id", deleteResultImage);

module.exports = router;
