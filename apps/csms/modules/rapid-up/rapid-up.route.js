const { Router } = require("express");
const router = Router();
const rapidUpController = require("./rapid-up.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.get(
  "/device-overview/:deviceId",
  // Authenticate,
  rapidUpController.getDeviceOverview
);

router.post("/update-interfaces", rapidUpController.updateInterfaces);
router.post(
  "/invoke-command",
  // Authenticate,
  rapidUpController.invokeCommand
);
router.post("/revoke-command/:id", rapidUpController.revokeCommand);
router.get("/revoke-all", rapidUpController.revokeAll);
router.post("/ping/:id", rapidUpController.pingTracker);
router.post("/sync", rapidUpController.sync);
router.post("/publish-overview", rapidUpController.publishOverview);
router.post("/kernal-log-relay", rapidUpController.kernalLogRelay);
router.post("/application-log-relay", rapidUpController.applicationLogRelay);
router.get("/state/cache/:deviceId", rapidUpController.getDeviceCache);

router.get("/rollout", Authenticate, rapidUpController.getRolloutList);
router.post("/rollout", Authenticate, rapidUpController.createRollout);
router.post(
  "/rollout/play/:rolloutId",
  // Authenticate,
  rapidUpController.playRollout
);
router.post(
  "/rollout/clone/:rolloutId",
  Authenticate,
  rapidUpController.cloneRollout
);
router.get(
  "/rollout/details/:rolloutId",
  // Authenticate,
  rapidUpController.getRolloutDetails
);
router.get(
  "/rollout/:rolloutId",
  // Authenticate,
  rapidUpController.getRolloutById
);
router.put(
  "/rollout/:rolloutId",
  // Authenticate,
  rapidUpController.updateRolloutById
);

router.delete(
  "/rollout/delete-bulk",
  // Authenticate,
  rapidUpController.deleteBulkRollouts
);

router.delete(
  "/rollout/:rolloutId",
  // Authenticate,
  rapidUpController.deleteRolloutById
);

router.get(
  "/rollout/stats/:rolloutId",
  Authenticate,
  rapidUpController.getRolloutDetailedStats
);
router.post(
  "/rollout/stats/:rolloutId/:deviceId",
  // Authenticate,
  rapidUpController.setDeviceRolloutStatusFromDevice
);
router.put(
  "/rollout/stats/:rolloutId/:deviceId",
  // Authenticate,
  rapidUpController.updateDeviceRolloutState
);

router.get(
  "/rollout/logs/:rolloutId/:deviceId",
  // Authenticate,
  rapidUpController.getDeviceLogsForRollout
);
router.post(
  "/rollout/logs/:rolloutId/:deviceId",
  // Authenticate,
  rapidUpController.appendLogsForRolloutByDeviceId
);
router.get(
  "/rollout/active/:rolloutId/:deviceId",
  // Authenticate,
  rapidUpController.getRolloutStatusForDevice
);

router.post("/process-logs", rapidUpController.processLogs);

module.exports = router;
