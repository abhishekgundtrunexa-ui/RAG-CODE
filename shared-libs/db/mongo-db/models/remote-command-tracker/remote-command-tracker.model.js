const mongoose = require("mongoose");
const { Schema } = mongoose;

const RemoteCommandTrackerSchema = new Schema(
  {
    deviceId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
    },
    command: {
      type: String,
    },
    lastBeatTime: {
      type: Date,
      default: () => new Date().toISOString(),
    },
  },
  { timestamps: true, versionKey: false }
);

const RemoteCommandTrackerModel = mongoose.model(
  "RemoteCommandTracker",
  RemoteCommandTrackerSchema
);
module.exports = { RemoteCommandTrackerModel };
