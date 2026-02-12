const mongoose = require("mongoose");
const { Schema } = mongoose;

const PusherLogSchema = new Schema(
  {
    channelName: { type: String, required: true },
    eventName: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
    isSent: { type: Boolean, default: false },
    errorMessage: { type: String, required: false, default: "" },
    sentAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const PusherLogModel = mongoose.model("PusherLog", PusherLogSchema);
module.exports = { PusherLogModel };
