const mongoose = require("mongoose");
const { ConnectedChargerStatuses } = require("@shared-libs/constants");
const { Schema } = mongoose;

const ConnectedChargerSchema = new Schema(
  {
    identity: { type: String, required: true },
    remoteAddress: { type: String, required: true },
    protocols: [{ type: String, required: true }],
    headers: { type: Object, required: true },
    connectedAt: { type: Date, default: null },
    disConnectedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: Object.values(ConnectedChargerStatuses),
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);

const ConnectedChargerModel = mongoose.model(
  "ConnectedCharger",
  ConnectedChargerSchema
);
module.exports = { ConnectedChargerModel };
