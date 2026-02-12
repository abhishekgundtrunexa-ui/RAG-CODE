const { model, Schema, Types } = require("mongoose");
const { ChargingState } = require("@shared-libs/constants");

const ChargingSessionLogSchema = new Schema(
  {
    //refers to RFID of the End customer
    idTag: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: String,
      required: true,
    },
    connectorId: {
      type: String,
      required: true,
    },
    chargerId: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    chargingState: {
      type: String,
      enum: Object.values(ChargingState),
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const ChargingSessionLogModel = model(
  "ChargingSessionLog",
  ChargingSessionLogSchema
);
module.exports = { ChargingSessionLogModel };
