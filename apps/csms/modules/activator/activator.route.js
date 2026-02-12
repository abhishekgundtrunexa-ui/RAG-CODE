const { Router } = require("express");
const router = Router();
const activatorController = require("./activator.controller");
const {
  ApiKeyAuthenticate,
} = require("../../middlewares/api-key-authenticate.middleware");

router.get(
  "/generate-serial-number",
  ApiKeyAuthenticate,
  activatorController.generateSerialNumber
);
router.get(
  "/get-charger-auth-codes/:serial_number",
  ApiKeyAuthenticate,
  activatorController.getChargerAuthCodes
);
router.post(
  "/verify-charger-auth-code/:serial_number",
  ApiKeyAuthenticate,
  activatorController.verifyChargerAuthCode
);
router.get(
  "/get-charger-card-pass-code/:serial_number",
  ApiKeyAuthenticate,
  activatorController.getChargerCardPassCode
);
router.get(
  "/get-charger-card/:serial_number",
  ApiKeyAuthenticate,
  activatorController.getChargerCard
);
router.post(
  "/set-charger-card/:serial_number",
  ApiKeyAuthenticate,
  activatorController.setChargerCard
);
router.post(
  "/remove-charger-card",
  ApiKeyAuthenticate,
  activatorController.removeChargerCard
);
router.post(
  "/send-charger-activation-otp/:serial_number",
  ApiKeyAuthenticate,
  activatorController.sendChargerActivationOtp
);
router.post(
  "/verify-charger-activation-otp/:serial_number",
  ApiKeyAuthenticate,
  activatorController.verifyChargerActivationOtp
);

module.exports = router;
