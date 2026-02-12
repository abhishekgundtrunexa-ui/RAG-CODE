const universalBaseRateService = require("./universal-base-rate.service");

exports.setUniversalBaseRate = async (req, res) => {
  try {
    await universalBaseRateService.setUniversalBaseRate(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
