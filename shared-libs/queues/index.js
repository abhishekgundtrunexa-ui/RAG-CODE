const { EmailQueue } = require("./email.queue");
const {
  OcppStopTransactionQueue,
  OcppAmountLookupQueue,
  OcppGenerateInvoiceQueue,
  OcppRealtimeAmountQueue,
  OcppCalculateAvgChargingRateQueue,
  TempInvoiceGenerateQueue,
  SyncRevenueQueue,
  OcppGetConfigurationQueue,
  OcppUpdatePendingFirmwareQueue,
  StopTransactionAndCaptureQueue,
  OcppChangeConfigurationQueue,
  OcppSendLocalListQueue,
  MockTransactionQueue,
} = require("./ocpp.queue");

module.exports = {
  EmailQueue,
  OcppStopTransactionQueue,
  OcppAmountLookupQueue,
  OcppGenerateInvoiceQueue,
  OcppRealtimeAmountQueue,
  OcppCalculateAvgChargingRateQueue,
  SyncRevenueQueue,
  TempInvoiceGenerateQueue,
  OcppGetConfigurationQueue,
  OcppUpdatePendingFirmwareQueue,
  StopTransactionAndCaptureQueue,
  OcppChangeConfigurationQueue,
  OcppSendLocalListQueue,
  MockTransactionQueue,
};
