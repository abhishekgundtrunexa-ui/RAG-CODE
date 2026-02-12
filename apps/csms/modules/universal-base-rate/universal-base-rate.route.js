const { Router } = require("express");
const router = Router();
const universalBaseRateController = require("./universal-base-rate.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.post(
  "/",
  Authenticate,
  universalBaseRateController.setUniversalBaseRate
);

module.exports = router;
