const { Schema, model } = require("mongoose");

const ActionOtpSchema = new Schema(
  {
    userId: { type: String, required: false },
    email: { type: String, required: false },
    action: { type: String, required: false },
    otp: { type: String, required: false },
  },
  { versionKey: false, timestamps: true }
);

// Create TTL index on createdAt to delete OTPs 5 Minutes
ActionOtpSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 5 * 60 } // 5 Minutes
);

const ActionOtpModel = model("ActionOtp", ActionOtpSchema);
module.exports = { ActionOtpModel };
