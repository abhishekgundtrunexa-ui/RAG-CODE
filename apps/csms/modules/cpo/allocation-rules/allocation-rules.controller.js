const allocationRuleService = require("./allocation-rule.service");

exports.addAllocationRule = async (req, res) => {
  try {
    await allocationRuleService.addAllocationRule(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllocationRules = async (req, res) => {
    try {
      await allocationRuleService.getAllocationRules(req, res);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
};

exports.updateAllocationRule = async (req, res) => {
    try {
      await allocationRuleService.updateAllocationRule(req, res);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
};

exports.deleteAllocationRule = async (req, res) => {
    try {
      await allocationRuleService.deleteAllocationRule(req, res);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
};