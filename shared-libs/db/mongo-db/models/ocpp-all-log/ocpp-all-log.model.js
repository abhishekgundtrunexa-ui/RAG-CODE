const mongoose = require("mongoose");
const { OcppSource } = require("@shared-libs/constants");
const { Schema } = mongoose;

const OcppAllLogSchema = new Schema(
  {
    clientId: { type: String, required: true },
    transactionUuid: { type: String, required: false },
    chargerTransactionId: { type: String, required: false },
    connectorId: { type: String, required: false },
    eventName: { type: String, required: true },
    ocppSchema: { type: Schema.Types.Mixed, required: true },
    ocppSchemaRaw: { type: String, required: false },
    requestFrom: {
      type: String,
      enum: Object.values(OcppSource),
      required: true,
    },
    responseData: { type: Schema.Types.Mixed, required: false },
    responseDataRaw: { type: String, required: false },
    responseFrom: {
      type: String,
      enum: Object.values(OcppSource),
      required: true,
    },
    version: { type: String, default: "1.6", required: false },
    error: { type: Schema.Types.Mixed, required: false },
    errorRaw: { type: String, required: false },
    country: { type: String, required: false },
    timezone: { type: String, required: false },
    createdAtLocal: { type: String, required: false },
    dateByTimezone: { type: String, required: false },
    createdAt: { type: Date, required: false },
    updatedAt: { type: Date, required: false },
  },
  {
    timestamps: false,
    versionKey: false,
    minimize: false,
  }
);

OcppAllLogSchema.index({ createdAt: -1 });
OcppAllLogSchema.index({ eventName: -1 });
OcppAllLogSchema.index({ transactionUuid: -1 });

const OcppAllLogModel = mongoose.model("OcppAllLog", OcppAllLogSchema);
module.exports = { OcppAllLogModel };
