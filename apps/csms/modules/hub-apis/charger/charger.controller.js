const chargerService = require("./charger.service");

//Get Charger By Id
exports.getChargerById = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.getChargerById(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Get Charger List
exports.getChargerList = async (req, res) => {
  try {
    await chargerService.getChargerList(false, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Register Charger
exports.registerCharger = async (req, res) => {
  try {
    await chargerService.registerCharger(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
