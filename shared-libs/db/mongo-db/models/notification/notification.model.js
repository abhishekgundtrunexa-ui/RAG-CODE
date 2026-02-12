const mongoose = require("mongoose");
const { NotificationTypes } = require("@shared-libs/constants");

const NotificationSchema = new mongoose.Schema(
  {
    cpoId: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: Object.values(NotificationTypes),
      required: true,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isReadForCpo: {
      type: Boolean,
      default: false,
    },
    isDeletedForCpo: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      // expires: 60 * 60 * 24 * 15, // 15 Days
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const NotificationModel = mongoose.model("Notification", NotificationSchema);
module.exports = { NotificationModel };
