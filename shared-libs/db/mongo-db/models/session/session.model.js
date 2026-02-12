const { Types, Schema, model } = require("mongoose");
const { MongoDbConstants } = require("@shared-libs/constants");

const SessionSchema = new Schema(
  {
    chargerId: {
      type: String,
      required: true,
    },
    evseStationId: {
      type: String,
      required: true,
    },
    inTime: {
      type: Date,
      default: null,
    },
    outTime: {
      type: Date,
      default: null,
    },
    durationInMin: {
      type: Number,
      default: null,
    },
    energyConsumed: {
      type: Number,
      default: null,
    },
    chargingStartPercent: {
      type: Number,
      default: null,
    },
    chargingStopPercent: {
      type: Number,
      default: null,
    },
    customerId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const SessionModel = model("Session", SessionSchema);

const SessionViewSchema = new Schema(
  {
    ...SessionSchema.obj,
    customer: {
      type: Schema.Types.Mixed,
      required: false,
    },
    customerName: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
  }
);

const SessionView = model("SessionView", SessionViewSchema, "sessionView");

SessionView.createCollection({
  viewOn: "sessions",
  pipeline: MongoDbConstants.viewAggregationQuery.session,
});

module.exports = { SessionModel, SessionView };
