const customerAuthService = require("./customer-auth.service");

exports.getLoginOtp = async (req, res) => {
  try {
    await customerAuthService.getLoginOtp(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTokenForWa = async (req, res) => {
  try {
    await customerAuthService.getTokenForWa(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.verifyLoginOtp = async (req, res) => {
  try {
    await customerAuthService.verifyLoginOtp(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//whoAmI
exports.whoAmI = async (req, res) => {
  try {
    await customerAuthService.whoAmI(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//logout
exports.logout = async (req, res) => {
  try {
    await customerAuthService.logout(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    await customerAuthService.updateProfile(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    await customerAuthService.refreshToken(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
