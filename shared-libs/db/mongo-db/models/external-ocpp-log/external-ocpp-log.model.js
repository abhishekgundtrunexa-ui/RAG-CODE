const { OcppSource } = require("@shared-libs/constants");
const { Schema, model } = require("mongoose");

const ExternalOcppLogSchema = new Schema(
  {
    clientId: { type: String, required: true },
    transactionUuid: { type: String, required: false },
    chargerTransactionId: { type: String, required: false },
    connectorId: { type: String, required: false },
    eventName: { type: String, required: true },
    ocppSchema: { type: Schema.Types.Mixed, required: true },
    requestFrom: {
      type: String,
      enum: Object.values(OcppSource),
      required: true,
    },
    responseData: { type: Schema.Types.Mixed, default: null },
    responseFrom: {
      type: String,
      enum: Object.values(OcppSource),
      required: true,
    },
    version: { type: String, default: "1.6" },
    error: { type: Schema.Types.Mixed, default: null },
    country: { type: String, default: null },
    timezone: { type: String, default: null },
    createdAtLocal: { type: String, default: null },
    dateByTimezone: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);

const ExternalOcppLogModel = model("ExternalOcppLog", ExternalOcppLogSchema);
module.exports = { ExternalOcppLogModel };
