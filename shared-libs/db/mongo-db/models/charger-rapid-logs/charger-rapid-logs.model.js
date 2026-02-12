const mongoose = require("mongoose");
const { Schema } = mongoose;

const ChargerRapidLogsSchema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    clientId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const ChargerRapidLogsModel = mongoose.model(
  "ChargerRapidLogs",
  ChargerRapidLogsSchema
);
module.exports = { ChargerRapidLogsModel };
