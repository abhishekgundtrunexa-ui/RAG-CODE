const mongoose = require("mongoose");
const { RolloutDeviceStates } = require("@shared-libs/constants");
const { Schema } = mongoose;

const RolloutDeviceStatesHistorySchema = new Schema(
  {
    device: {
      type: String,
    },
    rollout: {
      type: String,
      ref: "Rollout",
    },
    account: {
      type: String,
    },
    status: {
      type: String,
      enums: Object.keys(RolloutDeviceStates),
      default: RolloutDeviceStates.CREATED,
    },
    event: {
      type: String,
    },
    message: {
      type: String,
    },
    timestamp: {
      type: Number,
    },
    isDownloaded: {
      type: Boolean,
      default: false,
    },
    isExtracted: {
      type: Boolean,
      default: false,
    },
    isApplied: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

const RolloutDeviceStatesHistoryModel = mongoose.model(
  "RolloutDeviceStatesHistory",
  RolloutDeviceStatesHistorySchema
);
module.exports = { RolloutDeviceStatesHistoryModel };
