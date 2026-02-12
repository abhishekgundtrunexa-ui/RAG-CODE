const paymentCardService = require("./customer-payment-card.service");

exports.createPaymentCard = async (req, res) => {
  try {
    await paymentCardService.createPaymentCard(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPaymentCards = async (req, res) => {
  try {
    await paymentCardService.getPaymentCards(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.checkTokenExpiry = async (req, res) => {
  try {
    await paymentCardService.checkTokenExpiry(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPaymentCardById = async (req, res) => {
  try {
    await paymentCardService.getPaymentCardById(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updatePaymentCard = async (req, res) => {
  try {
    await paymentCardService.updatePaymentCard(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deletePaymentCard = async (req, res) => {
  try {
    await paymentCardService.deletePaymentCard(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
