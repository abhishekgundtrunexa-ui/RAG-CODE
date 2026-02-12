const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const WebhookLogSchema = new Schema(
  {
    webhookId: {
      type: Types.ObjectId,
      ref: "Webhook",
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    requestData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    responseStatus: {
      type: Number,
      required: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const WebhookLogModel = mongoose.model("WebhookLog", WebhookLogSchema);
module.exports = { WebhookLogModel };
