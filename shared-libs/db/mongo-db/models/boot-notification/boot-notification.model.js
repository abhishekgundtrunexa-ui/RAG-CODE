const { Schema, model } = require("mongoose");

const BootNotificationSchema = new Schema(
  {
    chargerId: {
      type: String,
      required: true,
      trim: true,
    },
    bootTime: {
      type: Date,
      default: null,
    },
  },
  {
    versionKey: false,
  }
);

const BootNotificationModel = model("BootNotification", BootNotificationSchema);
module.exports = { BootNotificationModel };
