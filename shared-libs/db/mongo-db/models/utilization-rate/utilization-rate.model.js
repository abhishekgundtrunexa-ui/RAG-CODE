const mongoose = require("mongoose");

const utilizationRatesSchema = new mongoose.Schema({
  Available: { type: Number },
  Idle: { type: Number },
  Offline: { type: Number },
  "In-Use": { type: Number },
  Error: { type: Number },
  Maintenance: { type: Number },
});

const statusDurationsSchema = new mongoose.Schema({
  Available: { type: Number },
  Idle: { type: Number },
  Offline: { type: Number },
  "In-Use": { type: Number },
  Error: { type: Number },
  Maintenance: { type: Number },
  time_unit: { type: String },
});

const utilizationRateSchema = new mongoose.Schema(
  {
    clientId: { type: String },
    utilizationRates: { type: {} },
    statusDurations: { type: {} },
    evseStationId: { type: String }
    // totalDurationInMinutes: { type: Number },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: false
  }
);

const UtilizationRateModel = mongoose.model(
  "utilization-rate",
  utilizationRateSchema
);

module.exports = { UtilizationRateModel };
