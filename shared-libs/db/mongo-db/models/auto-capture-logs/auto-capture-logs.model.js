const mongoose = require("mongoose");
const { Schema } = mongoose;

const AutoCaptureLogsSchema = new Schema(
  {
    transactionId: { type: String, default: null },
    actionTaken: { type: String, default: "Cancelled" },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    status: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const AutoCaptureLogsModel = mongoose.model(
  "AutoCaptureLogs",
  AutoCaptureLogsSchema
);
module.exports = { AutoCaptureLogsModel };
