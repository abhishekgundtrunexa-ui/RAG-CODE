const mongoose = require("mongoose");
const { RolloutTypes, RolloutStates } = require("@shared-libs/constants");
const { Schema } = mongoose;

const RolloutSchema = new Schema(
  {
    name: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enums: Object.keys(RolloutTypes),
    },
    artifact: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    group: {
      type: String,
    },
    account: {
      type: String,
    },
    createdBy: {
      type: String,
    },
    updatedBy: {
      type: String,
    },
    deviceIds: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enums: Object.keys(RolloutStates),
    },
    completion: {
      type: Number,
      default: 0,
    },
    archive: {
      type: Boolean,
      default: false,
    },
    completedDevices: [String],
  },
  { timestamps: true, versionKey: false }
);

const RolloutModel = mongoose.model("Rollout", RolloutSchema);
module.exports = { RolloutModel };
