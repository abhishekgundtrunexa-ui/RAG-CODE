const mongoose = require("mongoose");
const { Schema } = mongoose;

const DeviceOverviewSchema = new Schema(
  {
    deviceId: {
      type: String,
    },
    datetime: {
      type: Date,
      default: () => new Date().toISOString(),
    },
    interval: {
      type: String,
    },
    data: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false }
);

const DeviceOverviewModel = mongoose.model(
  "DeviceOverview",
  DeviceOverviewSchema
);
module.exports = { DeviceOverviewModel };
