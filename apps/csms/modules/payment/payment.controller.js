const paymentService = require("./payment.service");

exports.calculateAmount = async (req, res) => {
  try {
    await paymentService.calculateAmount(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.preauth = async (req, res) => {
  try {
    await paymentService.preauth(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.preauthComplete = async (req, res) => {
  try {
    await paymentService.preauthComplete(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.preauthCancel = async (req, res) => {
  try {
    await paymentService.preauthCancel(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.refund = async (req, res) => {
  try {
    await paymentService.refund(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.purchase = async (req, res) => {
  try {
    // await paymentService.purchase(req.body, req, res);
    await paymentService.purchase2(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.encHmac = async (req, res) => {
  try {
    await paymentService.encHmac(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.encCmac = async (req, res) => {
  try {
    await paymentService.encCmac(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.parseEmvData = async (req, res) => {
  try {
    await paymentService.parseEmvDataService(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
