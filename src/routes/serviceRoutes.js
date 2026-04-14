const express = require("express");
const multer = require("multer");
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controllers/serviceController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const resultUploads = upload.fields([
  { name: "beforeimage", maxCount: 1 },
  { name: "afterimage", maxCount: 1 },
  { name: "beforeImage", maxCount: 1 },
  { name: "afterImage", maxCount: 1 },
]);

router.get("/", getServices);
router.get("/:id", getServiceById);
router.post("/", resultUploads, createService);
router.put("/:id", resultUploads, updateService);
router.delete("/:id", deleteService);

module.exports = router;
