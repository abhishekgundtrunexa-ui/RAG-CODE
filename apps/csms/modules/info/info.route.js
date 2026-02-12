const { Router } = require("express");
const router = Router();
const infoController = require("./info.controller");

router.get("/", infoController.getInfo);

module.exports = router;
