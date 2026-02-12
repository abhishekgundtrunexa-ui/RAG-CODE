const { Router } = require("express");
const router = Router();
const otaUpdatesController = require("./ota-updates.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.post("/", Authenticate, otaUpdatesController.createRollout);

router.get("/", Authenticate, otaUpdatesController.getOtaUpdatesList);

router.get(
  "/charger/:chargeBoxId/status",
  Authenticate,
  otaUpdatesController.getOtaUpdateChargerStatus
);

router.get("/:id", Authenticate, otaUpdatesController.getOtaUpdateById);

router.put("/:id", Authenticate, otaUpdatesController.updateOtaUpdate);

router.delete("/:id", Authenticate, otaUpdatesController.deleteOtaUpdate);



module.exports = router;
