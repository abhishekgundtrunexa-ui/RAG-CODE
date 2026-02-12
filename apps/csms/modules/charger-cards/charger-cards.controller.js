const chargerCardsService = require("./charger-cards.service");

exports.setChargerCard = async (req, res) => {
  try {
    await chargerCardsService.setChargerCard(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerCard = async (req, res) => {
  try {
    await chargerCardsService.getChargerCard(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.setChargerCardAuthList = async (req, res) => {
  try {
    await chargerCardsService.setChargerCardAuthList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateChargerCardAuthList = async (req, res) => {
  try {
    await chargerCardsService.updateChargerCardAuthList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.syncAuthList = async (req, res) => {
  try {
    await chargerCardsService.syncAuthList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteChargerCard = async (req, res) => {
  try {
    await chargerCardsService.deleteChargerCard(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};