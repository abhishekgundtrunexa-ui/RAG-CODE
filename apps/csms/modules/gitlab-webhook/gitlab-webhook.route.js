const { Router } = require("express");
const router = Router();
const gitlabWebhookController = require("./gitlab-webhook.controller");

router.post("/", gitlabWebhookController.releaseNote)

module.exports = router;
