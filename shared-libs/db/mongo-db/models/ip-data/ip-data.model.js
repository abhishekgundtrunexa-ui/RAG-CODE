const mongoose = require("mongoose");
const { Schema } = mongoose;

const IpDataSchema = new Schema(
  {
    ip: { type: String, default: null },
    city: { type: String, default: null },
    region: { type: String, default: null },
    country: { type: String, default: null },
    location: { type: String, default: null },
    org: { type: String, default: null },
    postal: { type: String, default: null },
    lat: { type: String, default: null },
    lng: { type: String, default: null },
    timezone: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const IpDataModel = mongoose.model("IpData", IpDataSchema);
module.exports = { IpDataModel };
