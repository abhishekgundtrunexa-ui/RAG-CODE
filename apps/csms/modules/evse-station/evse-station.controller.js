const evseStationService = require("./evse-station.service");

exports.addEvseStation = async (req, res) => {
  try {
    await evseStationService.addEvseStation(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getEvseStationById = async (req, res) => {
  try {
    const evseStationId = req.params.evseStationId;
    await evseStationService.getEvseStationById(evseStationId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getEvseStationList = async (req, res) => {
  try {
    await evseStationService.getEvseStationList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateEvseStation = async (req, res) => {
  try {
    const evseStationId = req.params.evseStationId;
    await evseStationService.updateEvseStation(evseStationId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.softDeleteEvseStation = async (req, res) => {
  try {
    const evseStationId = req.params.evseStationId;
    await evseStationService.softDeleteEvseStation(evseStationId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.softDeleteEvseStationBulk = async (req, res) => {
  try {
    const evseStationIds = req.body.evseStationIds;
    await evseStationService.softDeleteEvseStationBulk(
      evseStationIds,
      req,
      res
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargingOverview = async (req, res) => {
  try {
    await evseStationService.getChargingOverview(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
