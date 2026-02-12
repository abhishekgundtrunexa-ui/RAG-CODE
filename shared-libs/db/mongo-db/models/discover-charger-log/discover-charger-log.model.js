const mongoose = require("mongoose");
const { Schema } = mongoose;

const DiscoverChargerLogSchema = new Schema(
  {
    guestId: {
      type: String,
      required: false,
    },
    customerId: {
      type: String,
      required: false,
    },
    filters: {
      type: Schema.Types.Mixed,
      required: true,
    },
    country: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    lat: {
      type: String,
      required: false,
    },
    lng: {
      type: String,
      required: false,
    },
    platform: {
      type: String,
      required: false,
    },
    browser: {
      type: String,
      required: false,
    },
    agent: {
      type: String,
      required: false,
    },
    timezone: {
      type: String,
      required: false,
    },
    browserversion: {
      type: String,
      required: false,
    },
    os: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const DiscoverChargerLogModel = mongoose.model(
  "DiscoverChargerLog",
  DiscoverChargerLogSchema
);
module.exports = { DiscoverChargerLogModel };
