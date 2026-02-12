const partnerCardService = require("./partner-card.service");


exports.createPartnerCard = async (req, res) => {
  try {
    await partnerCardService.createPartnerCard(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updatePrimaryCard = async (req, res) => {
  try {
    await partnerCardService.updatePrimaryCard(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.removeCard = async (req, res) => {
  try {
    await partnerCardService.removeCard(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCards = async (req, res) => {
  try {
    await partnerCardService.getPartnerCards(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

