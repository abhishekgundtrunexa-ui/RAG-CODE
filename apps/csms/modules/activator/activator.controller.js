const activatorService = require("./activator.service");

exports.generateSerialNumber = async (req, res) => {
  try {
    await activatorService.generateSerialNumberFromCharger(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerAuthCodes = async (req, res) => {
  try {
    await activatorService.getChargerAuthCodes(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.verifyChargerAuthCode = async (req, res) => {
  try {
    await activatorService.verifyChargerAuthCode(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerCardPassCode = async (req, res) => {
  try {
    await activatorService.getChargerCardPassCode(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.setChargerCard = async (req, res) => {
  try {
    await activatorService.setChargerCard(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerCard = async (req, res) => {
  try {
    await activatorService.getChargerCard(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.removeChargerCard = async (req, res) => {
  try {
    await activatorService.removeChargerCard(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.sendChargerActivationOtp = async (req, res) => {
  try {
    await activatorService.sendChargerActivationOtp(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.verifyChargerActivationOtp = async (req, res) => {
  try {
    await activatorService.verifyChargerActivationOtp(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
