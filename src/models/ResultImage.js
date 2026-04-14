const mongoose = require("mongoose");

const RESULT_IMAGE_TAGS = [
  "Permanent Hair Removal",
  "Carbon Laser Treatment",
  "BB Glow CC Glow Treatment",
  "Skin Glow Treatment",
  "Pimple and Acne Treatment",
  "Wrinkle/ HIFU Treatment",
  "Breast Enlargement",
  "Breast Shaping",
  "Hips Shaping",
  "Ear Lobes Repair",
  "All Body Piercing",
  "Mole, Tag and Wart Removal",
  "Pigmentation Removal",
  "Open Pores Treatment",
  "Permanent Eye Brow",
  "Permanent Lip Color",
  "Beauty Spot",
  "Pubic Area Tightening",
  "Oxegenue Treatment",
  "Meso Therapy",
  "Permanent Tattoo Removal",
  "Cryolipolysis - Fat Freezing",
  "Glutathione - All Body",
];

const resultImageSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      required: true,
      trim: true,
      enum: RESULT_IMAGE_TAGS,
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
  { timestamps: true }
);

module.exports = mongoose.model("ResultImage", resultImageSchema);
module.exports.RESULT_IMAGE_TAGS = RESULT_IMAGE_TAGS;
