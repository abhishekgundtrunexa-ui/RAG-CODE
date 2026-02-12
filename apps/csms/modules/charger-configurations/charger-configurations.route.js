const { Router } = require("express");
const { Authenticate } = require("../../middlewares/authenticate.middleware");
const { Validate } = require("../../middlewares/validate.middleware");
const chargerConfigurationsController = require("./charger-configurations.controller");
const {
  setChargerConfigurationsValidation,
} = require("./charger-configurations.validation");

const router = Router();
router.post(
  "/:serial_number",
  Authenticate,
  Validate(setChargerConfigurationsValidation),
  chargerConfigurationsController.setChargerConfigurations
);

router.post(
  "/local-auth-list/:chargeBoxId",
  Authenticate,
  chargerConfigurationsController.setAndUpdateLocalAuthorizationList
);

module.exports = router;
