const mongoose = require("mongoose");
const { Schema } = mongoose;

const PendingCancellationLogsSchema = new Schema(
  {
    paymentProvider: { type: String, default: null },
    chargeBoxId: { type: String, required: true },
    connectorId: { type: String, required: true },
    hashedPan: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "processed", "expired"],
      default: "pending",
    },
    request: { type: Schema.Types.Mixed, default: null },
    processedAt: { type: Date, default: null },
    processedTransactionId: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for efficient lookups
PendingCancellationLogsSchema.index({
  chargeBoxId: 1,
  connectorId: 1,
  hashedPan: 1,
  status: 1,
});

const PendingCancellationLogsModel = mongoose.model(
  "PendingCancellationLogs",
  PendingCancellationLogsSchema
);

module.exports = { PendingCancellationLogsModel };
