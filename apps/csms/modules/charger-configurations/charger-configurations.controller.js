const chargerConfigurationsService = require("./charger-configurations.service");

exports.setChargerConfigurations = async (req, res) => {
  try {
    await chargerConfigurationsService.setChargerConfigurations(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.setAndUpdateLocalAuthorizationList = async (req, res) => {
  try {
    await chargerConfigurationsService.setAndUpdateLocalAuthorizationList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
