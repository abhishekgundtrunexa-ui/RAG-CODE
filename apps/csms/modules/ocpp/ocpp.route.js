const { Router } = require("express");
const router = Router();
const ocppController = require("./ocpp.controller");

// remoteStartTransaction
router.post("/remote-start-transaction", ocppController.remoteStartTransaction);

// remoteStopTransaction
router.post("/remote-stop-transaction", ocppController.remoteStopTransaction);

// authorizeCharger
router.post("/authorize-charger", ocppController.authorizeCharger);

// changeAvailability
router.post("/change-availability", ocppController.changeAvailability);

// changeConfiguration
router.post("/change-configuration", ocppController.changeConfiguration);

// clearCache
router.post("/clear-cache", ocppController.clearCache);

// dataTransfer
router.post("/data-transfer", ocppController.dataTransfer);

// getConfiguration
router.post("/get-configuration", ocppController.getConfiguration);

// heartbeat
router.post("/heartbeat", ocppController.heartbeat);

// reset
router.post("/reset", ocppController.reset);

// unlockConnector
router.post("/unlock-connector", ocppController.unlockConnector);

// getDiagnostics
router.post("/get-diagnostics", ocppController.getDiagnostics);

// updateFirmware
router.post("/update-firmware", ocppController.updateFirmware);

// getLocalListVersion
router.post("/get-local-list-version", ocppController.getLocalListVersion);

// cancelReservation
router.post("/cancel-reservation", ocppController.cancelReservation);

// reserveNow
router.post("/reserve-now", ocppController.reserveNow);

// clearChargingProfile
router.post("/clear-charging-profile", ocppController.clearChargingProfile);

// getCompositeSchedule
router.post("/get-composite-schedule", ocppController.getCompositeSchedule);

// setChargingProfile
router.post("/set-charging-profile", ocppController.setChargingProfile);

// triggerMessage
router.post("/trigger-message", ocppController.triggerMessage);

module.exports = router;
