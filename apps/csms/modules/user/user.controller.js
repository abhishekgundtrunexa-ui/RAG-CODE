const userService = require("./user.service");

exports.updateProfile = async (req, res) => {
  try {
    await userService.updateProfile(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProfilePhoto = async (req, res) => {
  try {
    await userService.updateProfilePhoto(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateAccountSettings = async (req, res) => {
  try {
    await userService.updateAccountSettings(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.addUser = async (req, res) => {
  try {
    await userService.addUser(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUserList = async (req, res) => {
  try {
    await userService.getUserList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUserListForDeletedChargers = async (req, res) => {
  try {
    await userService.getUserListForDeletedChargers(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getFilterStatus = async (req, res) => {
  try {
    await userService.getFilterStatus(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUserInfo = async (req, res) => {
  try {
    await userService.getUserInfo(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;
    await userService.getUserById(userId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateUserById = async (req, res) => {
  try {
    const userId = req.params.userId;
    await userService.updateUserById(userId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const userId = req.params.userId;
    await userService.deleteUserById(userId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteUserBulk = async (req, res) => {
  try {
    const userIds = req.body.userIds;
    await userService.deleteUserBulk(userIds, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.resendUserInvitation = async (req, res) => {
  try {
    const userId = req.params.userId;
    await userService.resendUserInvitation(userId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.enableUserById = async (req, res) => {
  try {
    await userService.enableUserById(req.params.userId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.disableUserById = async (req, res) => {
  try {
    await userService.disableUserById(req.params.userId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
