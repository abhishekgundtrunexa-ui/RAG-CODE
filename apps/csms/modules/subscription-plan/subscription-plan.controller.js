const subscriptionPlanService = require("./subscription-plan.service");

exports.addSubscriptionPlan = async (req, res) => {
  try {
    await subscriptionPlanService.addSubscriptionPlan(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getSubscriptionPlan = async (req, res) => {
  try {
    await subscriptionPlanService.getSubscriptionPlan(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getSubscriptionPlanById = async (req, res) => {
  try {
    await subscriptionPlanService.getSubscriptionPlanById(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
