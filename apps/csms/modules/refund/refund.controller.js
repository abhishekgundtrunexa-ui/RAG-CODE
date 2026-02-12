const refundService = require("./refund.service");

exports.createRefund = async (req, res) => {
  try {
    await refundService.createRefund(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRefunds = async (req, res) => {
  try {
    await refundService.getRefunds(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRefundById = async (req, res) => {
  try {
    await refundService.getRefundById(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.addRefundComment = async (req, res) => {
  try {
    await refundService.addRefundComment(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateRefundStatus = async (req, res) => {
  try {
    await refundService.updateRefundStatus(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.reassignRefund = async (req, res) => {
  try {
    await refundService.reassignRefund(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.processRefund = async (req, res) => {
  try {
    await refundService.processRefund(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRefundOverview = async (req, res) => {
  try {
    await refundService.getRefundOverview(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
