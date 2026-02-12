const { Router } = require("express");
const router = Router();
const performanceAnalyticsController = require("./performance-analytics.controller");
const {
  Authenticate,
  AuthenticatePartner,
} = require("../../middlewares/authenticate.middleware");
const {
  AnalyticsFilterMiddleware,
} = require("../../middlewares/analytics-filter.middleware");

router.get(
  "/charger-analytics",
  Authenticate,
  AuthenticatePartner,
  AnalyticsFilterMiddleware({ todayRange: true }),
  performanceAnalyticsController.chargerAnalytics
);

router.get(
  "/partner-analytics",
  Authenticate,
  AuthenticatePartner,
  AnalyticsFilterMiddleware({ dateOnly: true }),
  performanceAnalyticsController.getPartnerAnalytics
);

router.get(
  "/partner-analytics-top-cpo",
  Authenticate,
  AuthenticatePartner,
  AnalyticsFilterMiddleware(),
  performanceAnalyticsController.getPartnerAnalyticsTopCpo
);

router.get(
  "/partner-analytics-top-sitehost",
  Authenticate,
  AuthenticatePartner,
  AnalyticsFilterMiddleware(),
  performanceAnalyticsController.getPartnerAnalyticsTopSiteHost
);

router.get(
  "/partner-analytics-top-investor",
  Authenticate,
  AuthenticatePartner,
  AnalyticsFilterMiddleware(),
  performanceAnalyticsController.getPartnerAnalyticsTopInvestor
);

router.get(
  "/revenue-analytics",
  Authenticate,
  AuthenticatePartner,
  AnalyticsFilterMiddleware(),
  performanceAnalyticsController.getRevenueAnalytics
);

router.get(
  "/revenue-payout-distribution",
  Authenticate,
  AuthenticatePartner,
  AnalyticsFilterMiddleware({ dateOnly: true }),
  performanceAnalyticsController.getRevenuePayoutDistribution
);

router.get(
  "/feedback-analytics",
  Authenticate,
  AuthenticatePartner,
  AnalyticsFilterMiddleware(),
  performanceAnalyticsController.getChargerFeedbackAnalytics
);

module.exports = router;
