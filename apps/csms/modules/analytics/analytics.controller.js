const analyticsService = require("./analytics.service");
const dashBoardAnalyticsService = require("./dashboard-analytics.service");
const { getAnalyticsFromDate } = require("@shared-libs/analytics-helper");
const { DateTime } = require("luxon");

exports.getEnergyConsumed = async (req, res) => {
  try {
    await analyticsService.getEnergyConsumed(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRevenueGenerated = async (req, res) => {
  try {
    await analyticsService.getRevenueGenerated(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.calculatePeakHours = async (req, res) => {
  try {
    await analyticsService.calculatePeakHours(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.utilisationRateCalculation = async (req, res) => {
  try {
    await analyticsService.utilisationRateCalculation(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUtilizationRates = async (req, res) => {
  try {
    await analyticsService.getUtilizationRates(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getDashboardAnalytics = async (req, res) => {
  try {
    await dashBoardAnalyticsService.getDashboardAnalytics(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.runCron = async (req, res) => {
  try {
    const { date } = req.body;

    const startDate = DateTime.fromFormat(date, "yyyy-MM-dd", { zone: "UTC" });
    const yesterday = DateTime.utc();

    const dates = [];
    let current = startDate;

    while (current <= yesterday) {
      dates.push(current.toISODate()); // Format: 'YYYY-MM-DD'
      current = current.plus({ days: 1 });
    }

    for (const dt of dates) {
      console.log(`Processing date: ${dt}`);

      await getAnalyticsFromDate(dt);
    }

    return res.status(200).json({
      success: true,
      message: "analytics calculated",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
