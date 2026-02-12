const mongoose = require("mongoose");
const { OcppSource } = require("@shared-libs/constants");
const { Schema } = mongoose;

const OcppHeartbeatLogSchema = new Schema(
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

// Create TTL index on createdAt to delete logs after 7 days
OcppHeartbeatLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 } // 7 days
);

const OcppHeartbeatLogModel = mongoose.model(
  "OcppHeartbeatLog",
  OcppHeartbeatLogSchema
);
module.exports = { OcppHeartbeatLogModel };
