const cardDetailsService = require("./cpo-card-details.service");

exports.addCardDetails = async (req, res) => {
  try {
    await cardDetailsService.addCardDetails(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCardDetailsById = async (req, res) => {
  try {
    await cardDetailsService.getCardDetailsById(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCardDetails = async (req, res) => {
  try {
    await cardDetailsService.getCardDetails(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateCardDetails = async (req, res) => {
  try {
    await cardDetailsService.updateCardDetails(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.removeCardDetails = async (req, res) => {
  try {
    await cardDetailsService.removeCardDetails(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
