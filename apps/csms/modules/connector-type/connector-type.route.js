const { Router } = require("express");
const router = Router();
const connectorTypeController = require("./connector-type.controller");

router.get("/", connectorTypeController.getConnectorTypeList);

module.exports = router;
