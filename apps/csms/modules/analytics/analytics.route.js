const { Router } = require("express");
const router = Router();
const analyticsController = require("./analytics.controller");
const {
  Authenticate,
  AuthenticatePartner,
} = require("../../middlewares/authenticate.middleware");
const {
  AnalyticsFilterMiddleware,
} = require("../../middlewares/analytics-filter.middleware");

router.get(
  "/energy-consumed",
  Authenticate,
  AuthenticatePartner,
  analyticsController.getEnergyConsumed
);

router.get(
  "/revenue-generated",
  Authenticate,
  AuthenticatePartner,
  analyticsController.getRevenueGenerated
);

router.get(
  "/peakHoursCalculation",
  Authenticate,
  AuthenticatePartner,
  analyticsController.calculatePeakHours
);

router.get(
  "/utilisationRateCalculation",
  Authenticate,
  AuthenticatePartner,
  analyticsController.utilisationRateCalculation
);

router.get(
  "/utilization-rate",
  Authenticate,
  AuthenticatePartner,
  analyticsController.getUtilizationRates
);

router.get(
  "/dashboard",
  Authenticate,
  AuthenticatePartner,
  AnalyticsFilterMiddleware(),
  analyticsController.getDashboardAnalytics
);

router.post("/run-analytics", analyticsController.runCron);

module.exports = router;
