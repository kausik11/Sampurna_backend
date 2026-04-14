const express = require("express");
const {
  getFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
} = require("../controllers/faqController");

const router = express.Router();

router.get("/", getFaqs);
router.get("/:id", getFaqById);
router.post("/", createFaq);
router.put("/:id", updateFaq);
router.patch("/:id", updateFaq);
router.delete("/:id", deleteFaq);

module.exports = router;
