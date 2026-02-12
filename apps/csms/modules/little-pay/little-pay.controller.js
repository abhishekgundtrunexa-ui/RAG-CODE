const littlePayService = require("./little-pay.service");

exports.authorizeWebhook = async (req, res) => {
  try {
    await littlePayService.authorizeWebhook(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.captureWebhook = async (req, res) => {
  try {
    await littlePayService.captureWebhook(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.generateCertificates = async (req, res) => {
  try {
    await littlePayService.generateCertificates(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    await littlePayService.createTransaction(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.chargeTransaction = async (req, res) => {
  try {
    await littlePayService.chargeTransaction(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
