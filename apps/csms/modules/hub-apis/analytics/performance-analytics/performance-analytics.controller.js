const performanceAnalyticsService = require("../../../performance-analytics/performance-analytics.service");

exports.chargerAnalytics = async (req, res) => {
  try {
    await performanceAnalyticsService.chargerAnalytics(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.partnerAnalytics = async (req, res) => {
  try {
    await performanceAnalyticsService.getPartnerAnalytics(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.revenueAnalytics = async (req, res) => {
  try {
    await performanceAnalyticsService.getRevenueAnalytics(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};