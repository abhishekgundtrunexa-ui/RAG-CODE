const { Schema, model } = require("mongoose");

const ChargerConfigurationSchema = new Schema(
  {
    chargeBoxId: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    isJson: { type: Boolean, default: false },
  },
  { versionKey: false }
);

const ChargerConfigurationModel = model(
  "ChargerConfiguration",
  ChargerConfigurationSchema
);
module.exports = { ChargerConfigurationModel };
