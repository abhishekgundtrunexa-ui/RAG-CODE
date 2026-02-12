const otaUpdatesService = require("./ota-updates.service");

exports.createRollout = async (req, res) => {
  try {
    await otaUpdatesService.createRollout(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getOtaUpdatesList = async (req, res) => {
  try {
    await otaUpdatesService.getOtaUpdatesList(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOtaUpdateById = async (req, res) => {
  try {
    await otaUpdatesService.getOtaUpdateById(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOtaUpdateChargerStatus = async (req, res) => {
  try {
    await otaUpdatesService.getOtaUpdateChargerStatus(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOtaUpdate = async (req, res) => {
  try {
    await otaUpdatesService.updateOtaUpdate(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteOtaUpdate = async (req, res) => {
  try {
    await otaUpdatesService.deleteOtaUpdate(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
