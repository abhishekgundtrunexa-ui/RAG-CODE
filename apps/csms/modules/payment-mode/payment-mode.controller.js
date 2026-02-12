const paymentModeService = require("./payment-mode.service");

exports.addPaymentMode = async (req, res) => {
  try {
    await paymentModeService.addPaymentMode(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
