const { Router } = require("express");
const router = Router();
const webhookListenerController = require("./webhook-listener.controller");

router.all("/paynex", webhookListenerController.paynexWebhook);
router.all("/auropay/:eventName?", webhookListenerController.auropayWebhook);

module.exports = router;
