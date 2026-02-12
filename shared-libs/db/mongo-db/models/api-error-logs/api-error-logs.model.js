const { Schema, model } = require("mongoose");

const ApiErrorLogsSchema = new Schema(
  {
    method: { type: String, required: false },
    url: { type: String, required: false },
    statusCode: { type: String, required: false },
    responseBody: {
      type: String,
      set: (v) => JSON.stringify(v),
      required: false,
    },
    requestBody: {
      type: String,
      set: (v) => JSON.stringify(v),
      required: false,
    },
    headers: { type: String, set: (v) => JSON.stringify(v), required: false },
    chargerId: { type: String, required: false },
    chargeBoxId: { type: String, required: false },
  },
  { versionKey: false, timestamps: true }
);

// Create TTL index on createdAt to delete logs after 7 days
ApiErrorLogsSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 }
);

const ApiErrorLogsModel = model("ApiErrorLogs", ApiErrorLogsSchema);
module.exports = { ApiErrorLogsModel };
