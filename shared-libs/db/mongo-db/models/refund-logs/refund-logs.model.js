const mongoose = require("mongoose");
const { Schema } = mongoose;

const RefundLogsSchema = new Schema(
  {
    paymentProvider: { type: String, default: null },
    transactionId: { type: String, default: null },
    type: { type: String, default: "Refund" },
    hasError: { type: Boolean, default: false },
    request: { type: Schema.Types.Mixed, default: null },
    response: { type: Schema.Types.Mixed, default: null },
    providerRequest: { type: Schema.Types.Mixed, default: null },
    providerResponse: { type: Schema.Types.Mixed, default: null },
    invoiceNumber: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const RefundLogsModel = mongoose.model("RefundLogs", RefundLogsSchema);
module.exports = { RefundLogsModel };
