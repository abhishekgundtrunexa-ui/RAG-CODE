const { Router } = require("express");
const router = Router();
const chargerController = require("./charger.controller");
const {
  Authenticate,
  AuthenticatePartner,
} = require("../../middlewares/authenticate.middleware");
const {
  VerifyActionOTP,
} = require("../../middlewares/verify-action-otp.middleware");
const { Validate } = require("../../middlewares/validate.middleware");
const {
  registerChargerValidation,
  updateConfigurationValidation,
  assignCpoAndEvseStationValidation,
  assignCpoValidation,
  assignCpoBulkValidation,
  assignEvseStationValidation,
  assignEvseStationBulkValidation,
  setChargerLanguageValidation,
  setChargerConstantValidation,
  setChargerOcppConfigValidation,
  setChargerMeteringConfigValidation,
  updateChargerTimezoneValidation,
  updatePrintStickerValidation,
  changeChargerStatusValidation,
  updateChargerLocationValidation,
  addConnectorValidation,
  updateChargingStatusValidation,
  verifyDeviceAdminValidation,
  deleteChargersBulkValidation,
  deleteChargerByIdValidation,
  getFeedbackAverageValidation,
} = require("./charger.validation");

router.post(
  "/register",
  Authenticate,
  Validate(registerChargerValidation),
  chargerController.registerCharger
);
router.post("/load-testing", chargerController.loadTestingChargerController);
router.get(
  "/clear-load-testing-data",
  chargerController.clearloadTestingChargerController
);
router
  .route("/testing-configuration")
  .post(chargerController.createTestConfiguration)
  .delete(chargerController.deleteTestConfiguration);
router.get(
  "/",
  Authenticate,
  AuthenticatePartner,
  chargerController.getChargerList
);
router.get("/status", Authenticate, chargerController.getStatusList);
router.get("/check-eligibility", chargerController.checkEligibility);
router.get(
  "/overview",
  Authenticate,
  AuthenticatePartner,
  chargerController.getChargerOverview
);
router.post("/charging-calculation", chargerController.chargingCalculations);
router.get("/feedback-messages", chargerController.getFeedbackMessages);
router.post(
  "/:chargeBoxId/charger-experience-feedback",
  chargerController.chargingExperienceFeedback
);
router.post(
  "/:chargeBoxId/send-transaction-receipt",
  chargerController.sendTransactionReceipt
);
router.patch(
  "/:chargerId/update-configuration",
  Authenticate,
  Validate(updateConfigurationValidation),
  chargerController.updateConfiguration
);
router.get(
  "/:chargeBoxId/charger-experience-feedback-list",
  chargerController.chargingExperienceFeedbackListById
);
router.get(
  "/:chargeBoxId/configurations",
  Authenticate,
  chargerController.getChargerConfigurations
);
router.patch(
  "/:chargeBoxId/configurations",
  Authenticate,
  chargerController.changeConfigurations
);
router.get(
  "/charger-experience-feedback-list",
  chargerController.chargingExperienceFeedbackList
);
router.post(
  "/get-feedback-average",
  Validate(getFeedbackAverageValidation),
  chargerController.getFeedbackAverage
);
router.get(
  "/location-map-data",
  Authenticate,
  AuthenticatePartner,
  chargerController.getChargerLocationMapData
);
router.get("/details", chargerController.getChargerDetails);
router.get("/details_min", chargerController.getChargerDetailsMin);
router.get("/details_min2", chargerController.getChargerDetailsMin2);
router.get("/details_config", chargerController.getChargerDetailsConfig);
router.get(
  "/count",
  Authenticate,
  AuthenticatePartner,
  chargerController.getChargerCounts
);
router.get(
  "/deleted",
  Authenticate,
  AuthenticatePartner,
  chargerController.getDeletedChargers
);

router.get("/connector-pairs", chargerController.getConnectorPairListing);
router.get("/models", chargerController.getChargerModelListing);
router.get("/connected-clients", chargerController.getConnectedClientsList);

router.get("/:chargerId", Authenticate, chargerController.getChargerById);

router.patch(
  "/activate",
  // Authenticate,
  // Authorize("update_charger"),
  chargerController.activateCharger
);
router.delete(
  "/delete-bulk",
  Authenticate,
  VerifyActionOTP("Delete Charger"),
  Validate(deleteChargersBulkValidation),
  chargerController.softDeleteChargers
);
router.delete(
  "/:chargerId",
  Authenticate,
  VerifyActionOTP("Delete Charger"),
  Validate(deleteChargerByIdValidation),
  chargerController.softDeleteCharger
);
router.post(
  "/:chargerId/assign-cpo-and-evse-station",
  Authenticate,
  Validate(assignCpoAndEvseStationValidation),
  chargerController.assignCpoAndEvseStation
);
router.post(
  "/:chargerId/assign-cpo",
  Authenticate,
  Validate(assignCpoValidation),
  chargerController.assignCpo
);
router.post(
  "/assign-cpo-bulk",
  Authenticate,
  Validate(assignCpoBulkValidation),
  chargerController.assignCpoBulk
);
router.post(
  "/assign-evse-station-bulk",
  Authenticate,
  Validate(assignEvseStationBulkValidation),
  chargerController.assignEvseStationBulk
);
router.post(
  "/:chargerId/assign-evse-station",
  Authenticate,
  Validate(assignEvseStationValidation),
  chargerController.assignEvseStation
);

router.post(
  "/:chargerId/set-charger-language",
  Validate(setChargerLanguageValidation),
  chargerController.setChargerLanguage
);
router.get(
  "/:chargerId/get-charger-language",
  chargerController.getChargerLanguage
);

router.post(
  "/:chargerId/set-charger-constant",
  Validate(setChargerConstantValidation),
  chargerController.setChargerConstant
);
router.get(
  "/:chargerId/get-charger-constant",
  chargerController.getChargerConstant
);

router.post(
  "/:chargerId/set-charger-ocpp-config",
  Validate(setChargerOcppConfigValidation),
  chargerController.setChargerOcppConfig
);
router.post(
  "/:chargerId/set-charger-metering-config",
  Validate(setChargerMeteringConfigValidation),
  chargerController.setChargerMeteringConfig
);
router.post(
  "/:chargerId/set-charger-payment-config",
  chargerController.setChargerPaymentConfig
);

router.post("/:chargerId/send-meter-values", chargerController.sendMeterValues);
router.post(
  "/calculate-charging-amount",
  chargerController.calculateChargingAmount
);

router.patch("/update-cost", Authenticate, chargerController.updateChargerCost);
router.patch("/resend-activate-code", chargerController.resendActivateCode);
router.patch(
  "/update-timezone",
  Validate(updateChargerTimezoneValidation),
  chargerController.updateChargerTimezone
);

router.patch("/:chargerId", Authenticate, chargerController.updateCharger);
router.get(
  "/:chargerId/get-auth-code",
  Authenticate,
  chargerController.getAuthCode
);
router.post(
  "/:chargerId/update-print-sticker",
  Authenticate,
  Validate(updatePrintStickerValidation),
  chargerController.updatePrintSticker
);
router.patch(
  "/:chargerId/change-status",
  Authenticate,
  Validate(changeChargerStatusValidation),
  chargerController.changeChargerStatus
);
router.post(
  "/:chargeBoxId/update-charger-location",
  Validate(updateChargerLocationValidation),
  chargerController.updateChargerLocation
);
router.patch(
  "/:chargerId/add-connector",
  Authenticate,
  Validate(addConnectorValidation),
  chargerController.addConnector
);
router.patch(
  "/:chargerId/change-charging-status",
  Validate(updateChargingStatusValidation),
  chargerController.updateChargingStatus
);
router.post("/upload-rapid-logs", chargerController.uploadRapidLogs);

router.post(
  "/verify-device-admin",
  Validate(verifyDeviceAdminValidation),
  chargerController.verifyDeviceAdmin
);

router.get("/:chargerId/get-all-ocpp-logs", chargerController.getAllOcppLogs);

router.get("/:chargerId/get-ocpp-logs", chargerController.getAllOcppLogs);

router.get(
  "/:chargerId/get-ocpp-boot-notification-logs",
  chargerController.getOcppBootNotificationLogs
);

router.get(
  "/:chargerId/get-ocpp-heartbeat-logs",
  chargerController.getOcppHeartbeatLogs
);

router.get(
  "/:chargerId/get-ocpp-meter-value-logs",
  chargerController.getOcppMeterValueLogs
);

router.get(
  "/:chargerId/get-ocpp-transaction-logs",
  chargerController.getOcppTransactionLogs
);

module.exports = router;
