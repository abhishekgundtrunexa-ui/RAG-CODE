const mongoose = require("mongoose");
const { Schema } = mongoose;

const StateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    isoCode: {
      type: String,
      required: true,
    },
    countryIsoCode: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const StateModel = mongoose.model("State", StateSchema);
module.exports = { StateModel };
