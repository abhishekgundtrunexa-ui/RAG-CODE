const { Router } = require("express");
const router = Router();
const littlePayController = require("./little-pay.controller");

router.post("/authorize-webhook", littlePayController.authorizeWebhook);
router.post("/capture-webhook", littlePayController.captureWebhook);
router.post("/generate-certificates", littlePayController.generateCertificates);
router.post("/create-transaction", littlePayController.createTransaction);
router.post("/charge-transaction", littlePayController.chargeTransaction);

module.exports = router;
