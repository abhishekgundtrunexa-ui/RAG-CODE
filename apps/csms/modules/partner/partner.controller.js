const partnerService = require("./partner.service");

exports.addPartner = async (req, res) => {
  try {
    await partnerService.addPartner(req, res);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add partner", error: error.message });
  }
};

exports.updatePartner = async (req, res) => {
  try {
    await partnerService.updatePartner(req, res);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update partner", error: error.message });
  }
};

exports.updatePartnerProfile = async (req, res) => {
  try {
    await partnerService.updatePartnerProfile(req, res);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update partner profile", error: error.message });
  }
};

exports.deletePartner = async (req, res) => {
  try {
    await partnerService.deletePartner(req, res);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete partner", error: error.message });
  }
};

exports.getPartners = async (req, res) => {
  try {
    await partnerService.getPartners(req, res);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get partners", error: error.message });
  }
};

exports.getPartnerById = async (req, res) => {
  try {
    await partnerService.getPartnerById(req, res);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get partner", error: error.message });
  }
};

exports.resendPartnerInvitation = async (req, res) => {
  try {
    await partnerService.resendPartnerInvitation(req, res);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to resend partner invitation",
        error: error.message,
      });
  }
};

exports.rejectBankVerification = async (req, res) => {
  try {
    await partnerService.rejectBankVerification(req, res);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to reject bank verification", error: error.message });
  }
};

exports.approveBankVerification = async (req, res) => {
  try {
    await partnerService.approveBankVerification(req, res);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to approve bank verification", error: error.message });
  }
};