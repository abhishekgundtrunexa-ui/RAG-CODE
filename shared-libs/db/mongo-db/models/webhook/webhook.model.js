const mongoose = require("mongoose");
const { WebhookEvents } = require("@shared-libs/constants");
const { Schema, Types } = mongoose;

const WebhookSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    events: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.every((event) =>
            Object.values(WebhookEvents).includes(event)
          );
        },
        message: (props) => `${props.value} is not a valid WebhookEvent value`,
      },
      required: true,
    },
    headers: {
      type: Object,
      default: null,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: null,
    },
    updatedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const WebhookModel = mongoose.model("Webhook", WebhookSchema);
module.exports = { WebhookModel };
