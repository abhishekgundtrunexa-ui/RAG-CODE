const {
  BootNotificationModel,
} = require("./boot-notification/boot-notification.model");
const {
  ChargingSessionLogModel,
} = require("./charging-session-log/charging-session-log.model");
const {
  ChargerRapidLogsModel,
} = require("./charger-rapid-logs/charger-rapid-logs.model");
const {
  ConnectedChargerModel,
} = require("./connected-charger/connected-charger.model");
const { CountryModel } = require("./country/country.model");
const { EmailLogModel } = require("./email-log/email-log.model");
const { NotificationModel } = require("./notification/notification.model");
const {
  OcppBootNotificationLogModel,
} = require("./ocpp-boot-notification-log/ocpp-boot-notification-log.model");
const {
  OcppHeartbeatLogModel,
} = require("./ocpp-heartbeat-log/ocpp-heartbeat-log.model");
const { OcppLogModel } = require("./ocpp-log/ocpp-log.model");
const {
  OcppMeterValueLogModel,
} = require("./ocpp-meter-value-log/ocpp-meter-value-log.model");
const {
  OcppTransactionLogModel,
} = require("./ocpp-transaction-log/ocpp-transaction-log.model");
const { PusherLogModel } = require("./pusher-log/pusher-log.model");
const { SessionModel, SessionView } = require("./session/session.model");
const {
  TransactionModel,
  TransactionView,
} = require("./transaction/transaction.model");
const { WebhookModel } = require("./webhook/webhook.model");
const { WebhookLogModel } = require("./webhook-log/webhook-log.model");
const {
  DeviceOverviewModel,
} = require("./device-overview/device-overview.model");
const {
  AgentConcurrencyModel,
} = require("./agent-concurrency/agent-concurrency.model");
const {
  RemoteCommandTrackerModel,
} = require("./remote-command-tracker/remote-command-tracker.model");
const { RolloutModel } = require("./rollout/rollout.model");
const {
  RolloutDeviceStatesModel,
} = require("./rollout-device-states/rollout-device-states.model");
const {
  RolloutDeviceStatesHistoryModel,
} = require("./rollout-device-states-history/rollout-device-states-history.model");
const {
  StorageDeviceMonthlyModel,
} = require("./storage-device-monthly/storage-device-monthly.model");
const {
  StorageMonthlyModel,
} = require("./storage-monthly/storage-monthly.model");
const {
  OcppAllLogView,
} = require("./ocpp-all-logs-view/ocpp-all-logs-view.model");
const {
  PaymentAuthorizeModel,
} = require("./payment-authorize/payment-authorize.model");
const {
  PaymentCaptureModel,
} = require("./payment-capture/payment-capture.model");
const {
  DiscoverChargerLogModel,
} = require("./discover-charger-log/discover-charger-log.model");
const { PreauthLogsModel } = require("./preauth-logs/preauth-logs.model");
const { PurchaseLogsModel } = require("./purchase-logs/purchase-logs.model");
const {
  UtilizationRateModel,
} = require("./utilization-rate/utilization-rate.model");
const {
  EmvDataAddLogsModel,
} = require("./emv-data-add-logs/emv-data-add-logs.model");
const {
  PreauthCompleteLogsModel,
} = require("./preauth-complete-logs/preauth-complete-logs.model");
const { RefundLogsModel } = require("./refund-logs/refund-logs.model");
const {
  TransactionHistoryViewModel,
} = require("./transaction-history-view/transaction-history-view.model");
const {
  TransactionErrorLogsModel,
} = require("./transaction-error-logs/transaction-error-logs.model");
const { AnalyticsModel } = require("./analytics/analytics.model");
const {
  AutoCaptureLogsModel,
} = require("./auto-capture-logs/auto-capture-logs.model");
const { ApiErrorLogsModel } = require("./api-error-logs/api-error-logs.model");
const { CronSchedulerModel } = require("./cron-scheduler/cron-scheduler.model");
const {
  PreauthCancelLogsModel,
} = require("./preauth-cancel-logs/preauth-cancel-logs.model");
const {
  MessagesToTranslateModel,
} = require("./messages-to-translate/messages-to-translate.model");
const {
  PendingCancellationLogsModel,
} = require("./pending-cancellation-logs/pending-cancellation-logs.model");
const { StateModel } = require("./country/states.model");
const { IpDataModel } = require("./ip-data/ip-data.model");
const { ActionOtpModel } = require("./action-otp/action-otp.model");
const {
  AuropayWebhookModel,
} = require("./auropay-webhook/auropay-webhook.model");
const {
  ExternalOcppConnectionModel,
} = require("./external-ocpp-connection/external-ocpp-connection.model");
const {
  ExternalOcppLogModel,
} = require("./external-ocpp-log/external-ocpp-log.model");
const {
  ChargerConfigurationModel,
} = require("./charger-configuration/charger-configuration.model");
const { OcppAllLogModel } = require("./ocpp-all-log/ocpp-all-log.model");
const { PaynexWebhookModel } = require("./paynex-webhook/paynex-webhook.model");
const { WhatsappWebhookLogsModel } = require("./whatsapp-webhook-logs/whatsapp-webhook-logs.model");

module.exports = {
  BootNotificationModel,
  ChargingSessionLogModel,
  ChargerRapidLogsModel,
  ConnectedChargerModel,
  CountryModel,
  EmailLogModel,
  NotificationModel,
  OcppBootNotificationLogModel,
  OcppHeartbeatLogModel,
  OcppLogModel,
  OcppMeterValueLogModel,
  OcppTransactionLogModel,
  PusherLogModel,
  SessionModel,
  SessionView,
  TransactionModel,
  TransactionView,
  WebhookModel,
  WebhookLogModel,
  DeviceOverviewModel,
  AgentConcurrencyModel,
  RemoteCommandTrackerModel,
  RolloutModel,
  RolloutDeviceStatesModel,
  RolloutDeviceStatesHistoryModel,
  StorageMonthlyModel,
  StorageDeviceMonthlyModel,
  OcppAllLogView,
  PaymentAuthorizeModel,
  PaymentCaptureModel,
  DiscoverChargerLogModel,
  PreauthLogsModel,
  PurchaseLogsModel,
  UtilizationRateModel,
  EmvDataAddLogsModel,
  PreauthCompleteLogsModel,
  RefundLogsModel,
  TransactionHistoryViewModel,
  TransactionErrorLogsModel,
  AnalyticsModel,
  AutoCaptureLogsModel,
  ApiErrorLogsModel,
  CronSchedulerModel,
  PreauthCancelLogsModel,
  MessagesToTranslateModel,
  PendingCancellationLogsModel,
  StateModel,
  IpDataModel,
  ActionOtpModel,
  AuropayWebhookModel,
  ExternalOcppConnectionModel,
  ExternalOcppLogModel,
  ChargerConfigurationModel,
  OcppAllLogModel,
  PaynexWebhookModel,
  WhatsappWebhookLogsModel,
};
