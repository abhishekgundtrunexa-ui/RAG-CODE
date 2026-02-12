const cpoPaymentAccountService = require("./cpo-payment-account.service");

exports.listCpoPaymentAccount = async (req, res) => {
  try {
    await cpoPaymentAccountService.listCpoPaymentAccount(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.addCpoPaymentAccount = async (req, res) => {
  try {
    await cpoPaymentAccountService.addCpoPaymentAccount(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCpoPaymentAccountById = async (req, res) => {
  try {
    await cpoPaymentAccountService.getCpoPaymentAccountById(
      req.params.cpoPaymentAccountId,
      req,
      res
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateCpoPaymentAccountById = async (req, res) => {
  try {
    await cpoPaymentAccountService.updateCpoPaymentAccountById(
      req.params.cpoPaymentAccountId,
      req,
      res
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteCpoPaymentAccountById = async (req, res) => {
  try {
    await cpoPaymentAccountService.deleteCpoPaymentAccountById(
      req.params.cpoPaymentAccountId,
      req,
      res
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.makeDefaultCpoPaymentAccountById = async (req, res) => {
  try {
    await cpoPaymentAccountService.makeDefaultCpoPaymentAccountById(
      req.params.cpoPaymentAccountId,
      req,
      res
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
