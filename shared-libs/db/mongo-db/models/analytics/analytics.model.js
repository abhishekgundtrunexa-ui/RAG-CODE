const { Schema, model } = require("mongoose");

const AnalyticsSchema = new Schema(
  {
    chargerId: { type: String, required: true, index: true },
    chargeBoxId: { type: String, index: true },
    isMockData: { type: Boolean, index: true },
    country: { type: String, index: true },
    evseStationId: { type: String, index: true },
    cpoId: { type: String, index: true, default: null },
    contractId: { type: String, index: true, default: null },
    totalRevenue: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    totalEnergyDelivered: { type: Number, default: 0 },
    avgEnergyPerSession: { type: Number, default: 0 },
    avgChargingRate: { type: Number, default: 0 },
    avgSessionDuration: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    totalDurationSec: { type: Number, default: 0 },
    utilizationRate: { type: Number, default: 0 },
    totalExpense: { type: Number, default: 0 },
    totalRefund: { type: Number, default: 0 },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

AnalyticsSchema.index({ evseStationId: 1, createdAt: 1 }); // Compound index for filtering & aggregation
AnalyticsSchema.index({ createdAt: 1 }); // Single index for efficient date-based queries

const AnalyticsModel = model("Analytics", AnalyticsSchema);
module.exports = { AnalyticsModel };
