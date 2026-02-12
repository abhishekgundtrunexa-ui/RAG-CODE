const mongoose = require("mongoose");
const { Schema } = mongoose;

const PaymentCaptureSchema = new Schema(
  {
    data: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const PaymentCaptureModel = mongoose.model(
  "PaymentCapture",
  PaymentCaptureSchema
);
module.exports = { PaymentCaptureModel };
