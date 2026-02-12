const emspService = require("./emsp.service");

exports.addEmsp = async (req, res) => {
  try {
    await emspService.addEmsp(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    await emspService.verifyOtp(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateEmsp = async (req, res) => {
  try {
    await emspService.updateEmsp(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProfilePhoto = async (req, res) => {
  try {
    await emspService.updateProfilePhoto(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteEmsp = async (req, res) => {
  try {
    await emspService.deleteEmsp(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getEmspById = async (req, res) => {
  try {
    await emspService.getEmspById(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPreauthAmount = async (req, res) => {
  try {
    await emspService.getPreauthAmount(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.upsertBusinessTaxDetails = async (req, res) => {
  try {
    await emspService.upsertBusinessTaxDetails(req, res);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.upsertBankAccount = async (req, res) => {
  try {
    await emspService.upsertBankAccount(req, res);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.upsertPaymentConfig = async (req, res) => {
  try {
    await emspService.upsertPaymentConfig(req, res);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.upsertChargerConfig = async (req, res) => {
  try {
    await emspService.upsertChargerConfig(req, res);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getEmspByQuery = async (req, res) => {
  try {
    await emspService.getEmspByQuery(req, res);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getEmspUserList = async (req, res) => {
  try {
    await emspService.getEmspUserList(req, res);
  } catch (error) {
    console.error("Controller Error in getEmspUserList:", error);
    res
      .status(500)
      .json({ message: "Failed to get EMSP user list", error: error.message });
  }
};

exports.rejectBankVerification = async (req, res) => {
  try {
    await emspService.rejectBankVerification(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.approveBankVerification = async (req, res) => {
  try {
    await emspService.approveBankVerification(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.setSettlementSchedule = async (req, res) => {
  try {
    await emspService.setSettlementSchedule(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
