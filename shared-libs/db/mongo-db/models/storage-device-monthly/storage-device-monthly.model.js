const mongoose = require("mongoose");
const { Schema } = mongoose;

const StorageDeviceMonthlySchema = new Schema(
  {
    date: {
      type: String,
    },
    account: {
      type: String,
    },
    deviceId: {
      type: String,
    },
    usage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, versionKey: false }
);

const StorageDeviceMonthlyModel = mongoose.model(
  "StorageDeviceMonthly",
  StorageDeviceMonthlySchema
);
module.exports = { StorageDeviceMonthlyModel };
