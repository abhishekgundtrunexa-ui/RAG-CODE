const auroPayService = require("./auro-pay.service");

exports.webhook = async (req, res) => {
  try {
    await auroPayService.webhook(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.webhookSuccess = async (req, res) => {
  try {
    await auroPayService.webhook(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.webhookFailure = async (req, res) => {
  try {
    await auroPayService.webhook(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTransaction = async (req, res) => {
  try {
    await auroPayService.getTransaction(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.refund = async (req, res) => {
  try {
    await auroPayService.refund(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
