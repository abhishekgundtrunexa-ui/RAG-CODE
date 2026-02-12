const authService = require("./auth.service");
require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

//Check Login
exports.sendMail = async (req, res) => {
  try {
    await authService.sendTestMail(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.checkLogin = async (req, res) => {
  try {
    await authService.checkLogin(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//login
exports.login = async (req, res) => {
  try {
    await authService.login(req.body, req, res);
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error:", error);
    console.log("🚀 -----------------🚀");
    res.status(400).json({ error: error.message });
  }
};

//whoAmI
exports.whoAmI = async (req, res) => {
  try {
    await authService.whoAmI(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//get profile configuration
exports.getProfileConfiguration = async (req, res) => {
  try {
    await authService.getProfileConfiguration(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//forgot password
exports.forgotPassword = async (req, res) => {
  try {
    await authService.forgotPassword(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//reset password
exports.resetPassword = async (req, res) => {
  try {
    await authService.resetPassword(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.sendActionOtp = async (req, res) => {
  try {
    await authService.sendActionOtp(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.onboardUser = async (req, res) => {
  try {
    await authService.onboardUser(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.skipOnboarding = async (req, res) => {
  try {
    await authService.skipOnboarding(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//logout
exports.logout = async (req, res) => {
  try {
    await authService.logout(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.setProfileConfiguration = async (req, res) => {
  try {
    await authService.setProfileConfiguration(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};