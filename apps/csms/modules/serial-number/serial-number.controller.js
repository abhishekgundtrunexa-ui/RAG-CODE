const serialNumberService = require("./serial-number.service");

exports.generateSerialNumber = async (req, res) => {
  try {
    await serialNumberService.generateSerialNumber(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.generateSerialNumberFromCharger = async (req, res) => {
  try {
    await serialNumberService.generateSerialNumberFromCharger(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.registerSerialNumber = async (req, res) => {
  try {
    await serialNumberService.registerSerialNumber(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
