const { Schema, model } = require("mongoose");

const CronSchedulerSchema = new Schema(
  {
    name: { type: String, required: true },
    script: { type: String, required: true },
    frequencyType: { type: String, required: true },
    frequencyData: { type: Schema.Types.Mixed, default: null },
    isActive: { type: Boolean, default: true },
    lastRun: { type: Date },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const CronSchedulerModel = model("CronScheduler", CronSchedulerSchema);
module.exports = { CronSchedulerModel };
