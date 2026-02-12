const webhookListenerService = require("./webhook-listener.service");

exports.paynexWebhook = async (req, res) => {
  try {
    await webhookListenerService.paynexWebhook(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.auropayWebhook = async (req, res) => {
  try {
    await webhookListenerService.auropayWebhook(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

