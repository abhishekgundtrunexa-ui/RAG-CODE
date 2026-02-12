const mongoose = require("mongoose");
const { Schema } = mongoose;

const RolloutDeviceStatesSchema = new Schema(
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
    },
    uiStatus: {
      download: {
        type: String,
        enums: [true, false, null],
        default: null,
      },
      extract: {
        type: String,
        enums: [true, false, null],
        default: null,
      },
      apply: {
        type: String,
        enums: [true, false, null],
        default: null,
      },
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

const RolloutDeviceStatesModel = mongoose.model(
  "RolloutDeviceStates",
  RolloutDeviceStatesSchema
);
module.exports = { RolloutDeviceStatesModel };
