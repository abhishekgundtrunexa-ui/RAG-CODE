const { Router } = require("express");
const router = Router();
const paymentController = require("./payment.controller");
require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

router.get("/parse-emv-data", paymentController.parseEmvData);
router.post("/calculate-amount", paymentController.calculateAmount);
router.post("/preauth", paymentController.preauth);
router.post("/preauth-complete", paymentController.preauthComplete);
router.post("/preauth-cancel", paymentController.preauthCancel);
router.post("/refund", paymentController.refund);
router.post("/purchase", paymentController.purchase);
router.post("/enc-hmac", paymentController.encHmac);
router.post("/enc-cmac", paymentController.encCmac);

module.exports = router;
