const customerTransactionService = require("./customer-transaction.service");

exports.getCustomerTransactions = async (req, res) => {
  try {
    await customerTransactionService.getCustomerTransactions(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCustomerTransactionById = async (req, res) => {
  try {
    await customerTransactionService.getCustomerTransactionById(req, res);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({ error: error.message });
  }
};

exports.getCustomerCurrentTransaction = async (req, res) => {
  try {
    await customerTransactionService.getCustomerCurrentTransaction(req, res);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({ error: error.message });
  }
};
