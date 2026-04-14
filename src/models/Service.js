const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    beforeimage: {
      type: String,
      required: true,
    },
    beforeimagePublicId: {
      type: String,
      required: true,
    },
    afterimage: {
      type: String,
      required: true,
    },
    afterimagePublicId: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },
    tag: {
      type: String,
      required: true,
      trim: true,
    },
    longdescription: {
      type: String,
      required: true,
      trim: true,
    },
    result: {
      type: resultSchema,
      required: true,
    },
    faqs: {
      type: [faqSchema],
      default: [],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "At least one FAQ is required",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);
