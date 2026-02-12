const { Router } = require("express");
const router = Router();
const paymentModeController = require("./payment-mode.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.post(
  "/add-payment-mode",
  Authenticate,
  paymentModeController.addPaymentMode
);

module.exports = router;
