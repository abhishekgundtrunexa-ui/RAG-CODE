const { Schema, model } = require("mongoose");

const ExternalOcppConnectionSchema = new Schema(
  {
    identity: { type: String, required: false },
    remoteAddress: { type: Schema.Types.Mixed, default: null },
    protocols: { type: Schema.Types.Mixed, default: null },
    headers: { type: Schema.Types.Mixed, default: null },
    status: { type: String, required: false },
  },
  { versionKey: false, timestamps: true }
);

const ExternalOcppConnectionModel = model(
  "ExternalOcppConnection",
  ExternalOcppConnectionSchema
);
module.exports = { ExternalOcppConnectionModel };
