const { Router } = require("express");
const router = Router();
const ocppHandlerController = require("./ocpp-handler.controller");

router.get("/health-check", ocppHandlerController.healthCheck);

router.post("/handle-event", ocppHandlerController.handleEvent);

module.exports = router;
