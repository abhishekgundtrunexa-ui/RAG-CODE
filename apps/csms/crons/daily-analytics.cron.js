const cron = require("node-cron");
const { DateTime } = require("luxon");
const { getAnalyticsFromDate } = require("@shared-libs/analytics-helper");

const DailyAnalyticsCron = () => {
  // Runs Every 15 min.
  cron.schedule("*/15 0 * * *", async () => {
    await runDailyAnalytics();
  });
};

const runDailyAnalytics = async () => {
  const previousDate = DateTime.utc().minus({ days: 1 }).toFormat("yyyy-MM-dd");

  await getAnalyticsFromDate(previousDate);
};

module.exports = {
  DailyAnalyticsCron,
  runDailyAnalytics,
};
