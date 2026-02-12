const transactionService = require("./transaction-history.service");

exports.getTransactionList = async (req, res) => {
  try {
    await transactionService.getTransactionListNew(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getSessionDetails = async (req, res) => {
  try {
    await transactionService.getSessionDetailsNew(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
