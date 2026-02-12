const mongoose = require("mongoose");
const { Schema } = mongoose;

const StorageMonthlySchema = new Schema(
  {
    date: {
      type: String,
    },
    account: {
      type: String,
    },
    usage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, versionKey: false }
);

const StorageMonthlyModel = mongoose.model(
  "StorageMonthly",
  StorageMonthlySchema
);
module.exports = { StorageMonthlyModel };
