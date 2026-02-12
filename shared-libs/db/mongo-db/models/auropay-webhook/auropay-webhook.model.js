const mongoose = require("mongoose");
const { Schema } = mongoose;

const AuropayWebhookSchema = new Schema(
  {
    data: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const AuropayWebhookModel = mongoose.model(
  "AuropayWebhook",
  AuropayWebhookSchema
);
module.exports = { AuropayWebhookModel };
