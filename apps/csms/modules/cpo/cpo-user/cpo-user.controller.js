const cpoUserService = require("./cpo-user.service");

exports.updateProfile = async (req, res) => {
  try {
    await cpoUserService.updateProfile(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateAccountSettings = async (req, res) => {
  try {
    await cpoUserService.updateAccountSettings(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.addCpoUser = async (req, res) => {
  try {
    await cpoUserService.addCpoUser(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCpoUserList = async (req, res) => {
  try {
    await cpoUserService.getCpoUserList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCpoUserById = async (req, res) => {
  try {
    const cpoUserId = req.params.cpoUserId;
    await cpoUserService.getCpoUserById(cpoUserId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateCpoUserById = async (req, res) => {
  try {
    const cpoUserId = req.params.cpoUserId;
    await cpoUserService.updateCpoUserById(cpoUserId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteCpoUserById = async (req, res) => {
  try {
    const cpoUserId = req.params.cpoUserId;
    await cpoUserService.deleteCpoUserById(cpoUserId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.resendCpoUserInvitation = async (req, res) => {
  try {
    const cpoUserId = req.params.cpoUserId;
    await cpoUserService.resendCpoUserInvitation(cpoUserId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.enableCpoUserById = async (req, res) => {
  try {
    await cpoUserService.enableCpoUserById(req.params.cpoUserId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.onboard = async (req, res) => {
  try {
    await cpoUserService.onboard(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.disableCpoUserById = async (req, res) => {
  try {
    await cpoUserService.disableCpoUserById(req.params.cpoUserId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.checkEndpointAvailability = async (req, res) => {
  try {
    await cpoUserService.checkEndpointAvailability(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.setEndpoint = async (req, res) => {
  try {
    await cpoUserService.setEndpoint(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getEndpoint = async (req, res) => {
  try {
    await cpoUserService.getEndpoint(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
