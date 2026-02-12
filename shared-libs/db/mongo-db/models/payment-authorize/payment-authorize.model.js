const mongoose = require("mongoose");
const { Schema } = mongoose;

const PaymentAuthorizeSchema = new Schema(
  {
    data: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const PaymentAuthorizeModel = mongoose.model(
  "PaymentAuthorize",
  PaymentAuthorizeSchema
);
module.exports = { PaymentAuthorizeModel };
