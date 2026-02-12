const { Schema, model } = require("mongoose");

const TransactionHistoryViewSchema = new Schema(
  {
    paymentProvider: { type: String, default: null },
    transactionId: { type: String, default: null },
    type: { type: String, default: null },
    hasError: { type: Boolean, default: false },
    request: { type: Schema.Types.Mixed, default: null },
    response: { type: Schema.Types.Mixed, default: null },
    providerRequest: { type: Schema.Types.Mixed, default: null },
    providerResponse: { type: Schema.Types.Mixed, default: null },
    invoiceNumber: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

const TransactionHistoryViewModel = model(
  "TransactionHistoryView",
  TransactionHistoryViewSchema,
  "transactionhistoryview"
);

TransactionHistoryViewModel.createCollection({
  viewOn: "preauthlogs",
  pipeline: [
    { $unionWith: { coll: "emvdataaddlogs", pipeline: [] } },
    { $unionWith: { coll: "preauthcompletelogs", pipeline: [] } },
    { $unionWith: { coll: "preauthcancellogs", pipeline: [] } },
    { $unionWith: { coll: "refundlogs", pipeline: [] } },
    { $unionWith: { coll: "purchaselogs", pipeline: [] } },
    { $sort: { createdAt: 1 } },
  ],
});

module.exports = { TransactionHistoryViewModel };
