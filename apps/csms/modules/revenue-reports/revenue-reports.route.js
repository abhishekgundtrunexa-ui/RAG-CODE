const express = require("express");
const router = express.Router();
const revenueReportsController = require("./revenue-reports.controller");
const {
  Authenticate,
  AuthenticatePartner,
} = require("../../middlewares/authenticate.middleware");
const {
  AnalyticsFilterMiddleware,
} = require("../../middlewares/analytics-filter.middleware");

// Revenue Reports Routes
router.get(
  "/",
  Authenticate,
  AuthenticatePartner,
  AnalyticsFilterMiddleware(),
  revenueReportsController.getRevenueReports
);

module.exports = router;
