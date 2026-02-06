const mongoose = require("mongoose");

const preferenceEventSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    asn: { type: String, required: true },
    as_name: { type: String, required: true },
    as_domain: { type: String, required: true },
    country_code: { type: String, required: true },
    country: { type: String, required: true },
    continent_code: { type: String, required: true },
    continent: { type: String, required: true },
  },
  { timestamps: true }
);

preferenceEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model("PreferenceEvent", preferenceEventSchema);
