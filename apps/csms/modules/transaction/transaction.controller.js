const transactionService = require("./transaction.service");
const transactionTestDataService = require("./transaction-test-data.service");

exports.addTransactionTestData = async (req, res) => {
  try {
    await transactionTestDataService.addTransactionTestData(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTransactionList = async (req, res) => {
  try {
    await transactionService.getTransactionList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getStatusList = async (req, res) => {
  try {
    await transactionService.getStatusList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    await transactionService.getTransactionById(transactionId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTransactionSessionList = async (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    await transactionService.getTransactionSessionList(transactionId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTransactionSessionListByCharger = async (req, res) => {
  try {
    const chargeBoxId = req.params.chargeBoxId;
    await transactionService.getTransactionSessionListByCharger(
      chargeBoxId,
      req,
      res
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
