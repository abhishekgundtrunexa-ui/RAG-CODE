const { Router } = require("express");
const router = Router();
const ipInfoController = require("./ip-info.controller");

router.get("/:ip", ipInfoController.getIpInfo);

module.exports = router;
