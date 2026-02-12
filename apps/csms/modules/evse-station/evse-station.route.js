const { Router } = require("express");
const router = Router();
const evseStationController = require("./evse-station.controller");
const {
  Authenticate,
  AuthenticatePartner,
} = require("../../middlewares/authenticate.middleware");
const {
  VerifyActionOTP,
} = require("../../middlewares/verify-action-otp.middleware");
const {
  AnalyticsFilterMiddleware,
} = require("../../middlewares/analytics-filter.middleware");

router.post("/", Authenticate, evseStationController.addEvseStation);
router.get(
  "/charging-overview",
  Authenticate,
  AuthenticatePartner,
  AnalyticsFilterMiddleware(),
  evseStationController.getChargingOverview
);
router.get(
  "/:evseStationId",
  Authenticate,
  evseStationController.getEvseStationById
);
router.patch(
  "/:evseStationId",
  Authenticate,
  VerifyActionOTP("Update Charging Station"),
  evseStationController.updateEvseStation
);
router.get(
  "/",
  Authenticate,
  AuthenticatePartner,
  evseStationController.getEvseStationList
);
router.delete(
  "/bulk-delete",
  Authenticate,
  VerifyActionOTP("Delete Charging Station"),
  evseStationController.softDeleteEvseStationBulk
);
router.delete(
  "/:evseStationId",
  Authenticate,
  VerifyActionOTP("Delete Charging Station"),
  evseStationController.softDeleteEvseStation
);

module.exports = router;
