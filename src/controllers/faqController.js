const Faq = require("../models/Faq");

const normalizeText = (value) => `${value ?? ""}`.trim();

const getFaqs = async (_req, res) => {
  try {
    const faqs = await Faq.find().sort({ createdAt: -1 });
    return res.status(200).json(faqs);
  } catch (error) {
    console.error("Failed to fetch FAQs:", error);
    return res.status(500).json({ message: "Failed to fetch FAQs" });
  }
};

const getFaqById = async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    return res.status(200).json(faq);
  } catch (error) {
    console.error("Failed to fetch FAQ:", error);
    return res.status(500).json({ message: "Failed to fetch FAQ" });
  }
};

const createFaq = async (req, res) => {
  try {
    const question = normalizeText(req.body.question);
    const answer = normalizeText(req.body.answer);

    if (!question || !answer) {
      return res.status(400).json({ message: "Question and answer are required" });
    }

    const faq = await Faq.create({ question, answer });
    return res.status(201).json(faq);
  } catch (error) {
    console.error("Failed to create FAQ:", error);
    return res.status(500).json({ message: "Failed to create FAQ" });
  }
};

const updateFaq = async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    if (req.body.question !== undefined) {
      const question = normalizeText(req.body.question);
      if (!question) return res.status(400).json({ message: "Question cannot be empty" });
      faq.question = question;
    }

    if (req.body.answer !== undefined) {
      const answer = normalizeText(req.body.answer);
      if (!answer) return res.status(400).json({ message: "Answer cannot be empty" });
      faq.answer = answer;
    }

    await faq.save();
    return res.status(200).json(faq);
  } catch (error) {
    console.error("Failed to update FAQ:", error);
    return res.status(500).json({ message: "Failed to update FAQ" });
  }
};

const deleteFaq = async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    await faq.deleteOne();
    return res.status(200).json({ message: "FAQ deleted" });
  } catch (error) {
    console.error("Failed to delete FAQ:", error);
    return res.status(500).json({ message: "Failed to delete FAQ" });
  }
};

module.exports = {
  getFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
};
