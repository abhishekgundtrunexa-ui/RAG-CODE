const performanceAnalyticsService = require("./performance-analytics.service");

exports.chargerAnalytics = async (req, res) => {
  try {
    await performanceAnalyticsService.chargerAnalytics(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerFeedbackAnalytics = async (req, res) => {
  try {
    await performanceAnalyticsService.getChargerFeedbackAnalytics(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRevenueAnalytics = async (req, res) => {
  try {
    await performanceAnalyticsService.getRevenueAnalytics(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRevenuePayoutDistribution = async (req, res) => {
  try {
    await performanceAnalyticsService.getRevenuePayoutDistribution(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPartnerAnalytics = async (req, res) => {
  try {
    await performanceAnalyticsService.getPartnerAnalytics(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPartnerAnalyticsTopCpo = async (req, res) => {
  try {
    await performanceAnalyticsService.getTopPartnerRevList(req, res, "Cpo");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPartnerAnalyticsTopSiteHost = async (req, res) => {
  try {
    await performanceAnalyticsService.getTopPartnerRevList(
      req,
      res,
      "Site Host"
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPartnerAnalyticsTopInvestor = async (req, res) => {
  try {
    await performanceAnalyticsService.getTopPartnerRevList(
      req,
      res,
      "Investor"
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
