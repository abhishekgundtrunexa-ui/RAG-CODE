const mongoose = require("mongoose");
const { Schema } = mongoose;

const numberSchemeType = {
  type: Number,
  default: 0,
};

const AgentConcurrencySchema = new Schema(
  {
    deviceId: {
      type: String,
    },
    overview: {
      type: Boolean,
      default: false,
    },
    inf: {
      type: Boolean,
      default: false,
    },
    allowForwarding: {
      type: Boolean,
      default: true,
    },
    liveNetworkTransferMap: {
      type: Object,
      default: {},
    },
    newUpdates: {
      type: Object,
    },
    liveModeProcessCount: numberSchemeType,
    liveCpuLoad: numberSchemeType,
    liveNetConnections: numberSchemeType,
    enableCtlList: numberSchemeType,
  },
  { timestamps: true, versionKey: false }
);

const AgentConcurrencyModel = mongoose.model(
  "AgentConcurency",
  AgentConcurrencySchema
);
module.exports = { AgentConcurrencyModel };
