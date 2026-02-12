const mongoose = require("mongoose");
const { Schema } = mongoose;

const EmailLogSchema = new Schema(
  {
    from: {
      type: String,
      default: null,
    },
    fromName: {
      type: String,
      default: null,
    },
    to: {
      type: [String],
      default: [],
    },
    cc: {
      type: [String],
      default: [],
    },
    bcc: {
      type: [String],
      default: [],
    },
    subject: {
      type: String,
      default: null,
    },
    templateData: {
      type: Schema.Types.Mixed,
      default: null,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    emailSentError: {
      type: String,
      default: null,
    },
    //this refers to the response received from node mailer
    emailSentResponse: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);

const EmailLogModel = mongoose.model("EmailLog", EmailLogSchema);
module.exports = { EmailLogModel };
