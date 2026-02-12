const { Router } = require("express");
const router = Router();
const countryController = require("./country.controller");
const { Authenticate } = require("../../middlewares/authenticate.middleware");

router.get("/", countryController.getCountryListing);

router.put("/active-inactive-country", countryController.activeInactiveCountry);

router.put(
  "/active-inactive-countries",
  countryController.activeInactiveCountries
);

router.get("/get-active-countries", countryController.getActiveCountries);

router.get("/states", Authenticate, countryController.getCountryStates);

module.exports = router;
