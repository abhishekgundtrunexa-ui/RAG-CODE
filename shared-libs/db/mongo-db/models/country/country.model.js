const mongoose = require("mongoose");
const { Schema } = mongoose;

const CountrySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isoCode: {
      type: String,
      required: true,
      trim: true,
    },
    isoCode3: {
      type: String,
      required: true,
      trim: true,
    },
    phoneCode: {
      type: String,
      default: null,
      trim: true,
    },
    language: {
      type: String,
      default: null,
      trim: true,
    },
    currency: {
      type: String,
      default: null,
      trim: true,
    },
    currencyName: {
      type: String,
      default: null,
      trim: true,
    },
    currencySymbol: {
      type: String,
      default: null,
      trim: true,
    },
    latitude: {
      type: String,
      default: null,
      trim: true,
    },
    longitude: {
      type: String,
      default: null,
      trim: true,
    },
    timezones: {
      type: [Object],
      default: [],
    },
    flag: {
      type: String,
      default: null,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    baseRate: {
      type: Object,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const CountryModel = mongoose.model("Country", CountrySchema);
module.exports = { CountryModel };
