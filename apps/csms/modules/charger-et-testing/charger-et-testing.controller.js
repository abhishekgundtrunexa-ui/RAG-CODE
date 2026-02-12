const chargerEtTestingService = require("./charger-et-testing.service");

exports.set = async (req, res) => {
  try {
    await chargerEtTestingService.set(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.reset = async (req, res) => {
  try {
    await chargerEtTestingService.reset(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    await chargerEtTestingService.getTransactions(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
