const { Router } = require("express");
const router = Router();
const auroPayController = require("./auro-pay.controller");

router.all("/webhook", auroPayController.webhook);
router.all("/webhook-success", auroPayController.webhookSuccess);
router.all("/webhook-failure", auroPayController.webhookFailure);
router.post("/get-transaction", auroPayController.getTransaction);
router.post("/refund", auroPayController.refund);

module.exports = router;
