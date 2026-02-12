const mongoose = require("mongoose");
const { Schema } = mongoose;

const TransactionErrorLogsSchema = new Schema(
  {
    paymentProvider: { type: String, default: null },
    transactionId: { type: String, default: null },
    type: { type: String, default: "Pre-Auth" },
    request: { type: Schema.Types.Mixed, default: null },
    response: { type: Schema.Types.Mixed, default: null },
    providerRequest: { type: Schema.Types.Mixed, default: null },
    providerResponse: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const TransactionErrorLogsModel = mongoose.model(
  "TransactionErrorLogs",
  TransactionErrorLogsSchema
);
module.exports = { TransactionErrorLogsModel };
