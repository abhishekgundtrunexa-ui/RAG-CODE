const { Schema, model } = require("mongoose");

const MessagesToTranslateSchema = new Schema(
  {
    message: { type: String, index: true },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

MessagesToTranslateSchema.index({ evseStationId: 1, createdAt: 1 }); // Compound index for filtering & aggregation
MessagesToTranslateSchema.index({ createdAt: 1 }); // Single index for efficient date-based queries

const MessagesToTranslateModel = model(
  "MessagesToTranslate",
  MessagesToTranslateSchema
);
module.exports = { MessagesToTranslateModel };
