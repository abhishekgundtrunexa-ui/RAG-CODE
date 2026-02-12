const webhookService = require("./webhook.service");

exports.addWebhook = async (req, res) => {
  try {
    await webhookService.addWebhook(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getWebhookById = async (req, res) => {
  try {
    const webhookId = req.params.webhookId;
    await webhookService.getWebhookById(webhookId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateWebhook = async (req, res) => {
  try {
    const webhookId = req.params.webhookId;
    const payload = req.body;
    await webhookService.updateWebhook(webhookId, payload, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getWebhookList = async (req, res) => {
  try {
    await webhookService.getWebhookList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.enableWebhook = async (req, res) => {
  try {
    const webhookId = req.params.webhookId;
    await webhookService.changeStatus(webhookId, true, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.disableWebhook = async (req, res) => {
  try {
    const webhookId = req.params.webhookId;
    await webhookService.changeStatus(webhookId, false, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
