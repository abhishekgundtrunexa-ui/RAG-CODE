const {
  AutoCaptureTransactionsCron,
} = require("./auto-capture-transactions.cron");
const { AutoCronSchedulerCron } = require("./auto-cron.scheduler");
const {
  ChargerAvailabilityStatusMonitorCron,
} = require("./charger-availability-status-monitor.cron");
const { DailyAnalyticsCron } = require("./daily-analytics.cron");
const { ExpireContractCron } = require("./expire-contract.cron");
const { SyncSettlementsCron } = require("./sync-settlements.cron");
const { UtilizationRateCron } = require("./utilization-rate-calculation.cron");
require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const CronScheduler = () => {
  if (process.env.RUN_CRON === "true") {
    ChargerAvailabilityStatusMonitorCron();
    DailyAnalyticsCron();
    UtilizationRateCron();
    AutoCaptureTransactionsCron();
    ExpireContractCron();
    SyncSettlementsCron();
  }
  // AutoCronSchedulerCron();
};

module.exports = { CronScheduler };
