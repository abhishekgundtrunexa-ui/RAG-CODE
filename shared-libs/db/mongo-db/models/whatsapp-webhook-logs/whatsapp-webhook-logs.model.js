const mongoose = require("mongoose");
const { Schema } = mongoose;

const WhatsappWebhookLogsSchema = new Schema(
  {
    url: { type: String, default: null },
    data: { type: Schema.Types.Mixed, default: null },
    isSent: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const WhatsappWebhookLogsModel = mongoose.model(
  "WhatsappWebhookLogs",
  WhatsappWebhookLogsSchema,
);
module.exports = { WhatsappWebhookLogsModel };
