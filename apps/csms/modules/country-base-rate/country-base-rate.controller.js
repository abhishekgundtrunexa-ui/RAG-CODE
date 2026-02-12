const countryBaseRateService = require("./country-base-rate.service");

exports.setCountryBaseRate = async (req, res) => {
  try {
    await countryBaseRateService.setCountryBaseRate(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
