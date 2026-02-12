const subscriptionPurchaseReqService = require("./cpo-subscription-purchase-request.service");

exports.initiateSubscriptionPurchase = async (req, res) => {
  try {
    await subscriptionPurchaseReqService.initiateSubscriptionPurchase(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateSubscriptionPurchase = async (req, res) => {
  try {
    await subscriptionPurchaseReqService.updateSubscriptionPurchase(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getSubscription = async (req, res) => {
  try {
    await subscriptionPurchaseReqService.getSubscription(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.listSubscriptionInvoices = async (req, res) => {
  try {
    await subscriptionPurchaseReqService.listSubscriptionInvoices(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
