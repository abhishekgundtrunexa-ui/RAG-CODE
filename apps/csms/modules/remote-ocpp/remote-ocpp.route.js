const { Router } = require("express");
const router = Router();
const remoteOcppController = require("./remote-ocpp.controller");

// remoteStartTransaction
router.post(
  "/:chargeBoxId/remote-start-transaction",
  remoteOcppController.remoteStartTransaction,
);

// remoteStopTransaction
router.post(
  "/:chargeBoxId/remote-stop-transaction",
  remoteOcppController.remoteStopTransaction,
);

// reset
router.post("/:chargeBoxId/reset-hard", remoteOcppController.reset);

// changeAvailability
router.post(
  "/:chargeBoxId/change-availability",
  remoteOcppController.changeAvailability,
);

// authorizeCharger
router.post(
  "/:chargeBoxId/authorize-charger",
  remoteOcppController.authorizeCharger,
);

// changeConfiguration
router.post(
  "/:chargeBoxId/change-configuration",
  remoteOcppController.changeConfiguration,
);

// clearCache
router.post("/:chargeBoxId/clear-cache", remoteOcppController.clearCache);

// dataTransfer
router.post("/:chargeBoxId/data-transfer", remoteOcppController.dataTransfer);

// getConfiguration
router.post(
  "/:chargeBoxId/get-configuration",
  remoteOcppController.getConfiguration,
);

// heartbeat
router.post("/:chargeBoxId/heartbeat", remoteOcppController.heartbeat);

// unlockConnector
router.post(
  "/:chargeBoxId/unlock-connector",
  remoteOcppController.unlockConnector,
);

// getDiagnostics
router.post(
  "/:chargeBoxId/get-diagnostics",
  remoteOcppController.getDiagnostics,
);

// updateFirmware
router.post(
  "/:chargeBoxId/update-firmware",
  remoteOcppController.updateFirmware,
);

// getLocalListVersion
router.post(
  "/:chargeBoxId/get-local-list-version",
  remoteOcppController.getLocalListVersion,
);

// clearChargingProfile
router.post(
  "/:chargeBoxId/clear-charging-profile",
  remoteOcppController.clearChargingProfile,
);

// getCompositeSchedule
router.post(
  "/:chargeBoxId/get-composite-schedule",
  remoteOcppController.getCompositeSchedule,
);

// setChargingProfile
router.post(
  "/:chargeBoxId/set-charging-profile",
  remoteOcppController.setChargingProfile,
);

// triggerMessage
router.post(
  "/:chargeBoxId/trigger-message",
  remoteOcppController.triggerMessage,
);

module.exports = router;
