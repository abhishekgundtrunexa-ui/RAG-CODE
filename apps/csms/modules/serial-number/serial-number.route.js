const { Router } = require("express");
const router = Router();
const serialNumberController = require("./serial-number.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.get(
  "/generate",
  Authenticate,
  serialNumberController.generateSerialNumber
);
router.get(
  "/generate-from-charger",
  serialNumberController.generateSerialNumberFromCharger
);
router.post(
  "/register",
  serialNumberController.registerSerialNumber
);

module.exports = router;
