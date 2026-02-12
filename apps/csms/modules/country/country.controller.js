const countryService = require("./country.service");

exports.getCountryListing = async (req, res) => {
  try {
    await countryService.getCountryListing(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.activeInactiveCountry = async (req, res) => {
  try {
    await countryService.activeInactiveCountry(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.activeInactiveCountries = async (req, res) => {
  try {
    await countryService.activeInactiveCountries(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getActiveCountries = async (req, res) => {
  try {
    await countryService.getActiveCountries(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCountryStates = async (req, res) => {
  try {
    await countryService.getCountryStates(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
