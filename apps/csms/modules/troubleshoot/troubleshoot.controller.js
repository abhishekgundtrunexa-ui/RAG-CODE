const troubleshootService = require("./troubleshoot.service");

exports.getChargerTroubleshoot = async (req, res) => {
  try {
    await troubleshootService.getChargerTroubleshoot(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTransactionTroubleshoot = async (req, res) => {
  try {
    await troubleshootService.getTransactionTroubleshoot(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTransactionTroubleshootV2 = async (req, res) => {
  try {
    await troubleshootService.getTransactionTroubleshootV2(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTransactionDebugLogs = async (req, res) => {
  try {
    await troubleshootService.getTransactionDebugLogs(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTransactionLogsTroubleshoot = async (req, res) => {
  try {
    await troubleshootService.getTransactionLogsTroubleshoot(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTransactionLogsTroubleshootV2 = async (req, res) => {
  try {
    await troubleshootService.getTransactionLogsTroubleshootV2(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

