const { Router } = require("express");
const router = Router();
const countryBaseRateController = require("./country-base-rate.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.post(
  "/:country",
  Authenticate,
  countryBaseRateController.setCountryBaseRate
);

module.exports = router;
