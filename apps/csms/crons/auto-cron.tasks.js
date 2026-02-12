const { autoCaptureTransactions } = require("./auto-capture-transactions.cron");
const {
  monitorChargerAvailability,
} = require("./charger-availability-status-monitor.cron");
const { runDailyAnalytics } = require("./daily-analytics.cron");
const {
  calculateUtilizationRate,
} = require("./utilization-rate-calculation.cron");

const logTime = () => {
  console.log(new Date());
};

module.exports = {
  monitorChargerAvailability,
  runDailyAnalytics,
  calculateUtilizationRate,
  autoCaptureTransactions,
  logTime,
};
