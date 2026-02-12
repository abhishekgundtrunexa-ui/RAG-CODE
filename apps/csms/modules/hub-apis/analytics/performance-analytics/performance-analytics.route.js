const { Router } = require("express");
const { AnalyticsFilterMiddleware } = require("../../../../middlewares/analytics-filter.middleware");
const router = Router();
const performanceAnalyticsController = require("./performance-analytics.controller");

router.get(
    "/charger-analytics",   
    AnalyticsFilterMiddleware({ forHub: true }),
    performanceAnalyticsController.chargerAnalytics);
    
router.get(
    "/partner-analytics",   
    AnalyticsFilterMiddleware({ forHub: true }),
    performanceAnalyticsController.partnerAnalytics);

router.get(
    "/revenue-analytics",   
    AnalyticsFilterMiddleware({ forHub: true }),
    performanceAnalyticsController.revenueAnalytics);

module.exports = router;