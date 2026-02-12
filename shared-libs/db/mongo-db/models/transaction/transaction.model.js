const { Types, Schema, model } = require("mongoose");
const {
  TransactionPaymentModes,
  TransactionStatuses,
  MongoDbConstants,
} = require("@shared-libs/constants");

const TransactionSchema = new Schema(
  {
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    sessionId: {
      type: Types.ObjectId,
      ref: "Session",
      required: true,
    },
    customerId: {
      type: String,
      required: false,
    },
    chargerId: {
      type: String,
      required: true,
    },
    modeOfPayment: {
      type: String,
      enum: Object.values(TransactionPaymentModes),
      required: true,
    },
    referenceNumber: {
      type: String,
      default: null,
      trim: true,
    },
    date: {
      type: Date,
      default: null,
    },
    totalCost: {
      type: Number,
      default: null,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatuses),
      default: TransactionStatuses.SUCCESS,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const TransactionModel = model("Transaction", TransactionSchema);

const TransactionViewSchema = new Schema(
  {
    ...TransactionSchema.obj,
    session: {
      type: Schema.Types.Mixed,
      required: true,
    },
    customer: {
      type: Schema.Types.Mixed,
      required: false,
    },
    customerName: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
  }
);

const TransactionView = model(
  "TransactionView",
  TransactionViewSchema,
  "transactionView"
);

TransactionView.createCollection({
  viewOn: "transactions",
  pipeline: MongoDbConstants.viewAggregationQuery.transaction,
});

module.exports = { TransactionModel, TransactionView };
