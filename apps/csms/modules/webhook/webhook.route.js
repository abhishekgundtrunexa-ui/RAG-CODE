const { Router } = require("express");
const router = Router();
const webhookController = require("./webhook.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.post("/", Authenticate, webhookController.addWebhook);
router.get("/:webhookId", Authenticate, webhookController.getWebhookById);
router.get("/", Authenticate, webhookController.getWebhookList);
router.patch("/:webhookId", Authenticate, webhookController.updateWebhook);
router.patch(
  "/:webhookId/enable",
  Authenticate,
  webhookController.enableWebhook
);
router.patch(
  "/:webhookId/disable",
  Authenticate,
  webhookController.disableWebhook
);

module.exports = router;
