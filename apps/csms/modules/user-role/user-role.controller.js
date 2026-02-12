const userRoleService = require("./user-role.service");

exports.addUserRole = async (req, res) => {
  try {
    await userRoleService.addUserRole(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUserRoleList = async (req, res) => {
  try {
    await userRoleService.getUserRoleList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUserRoleById = async (req, res) => {
  try {
    const userRoleId = req.params.userRoleId;
    await userRoleService.getUserRoleById(userRoleId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateUserRoleById = async (req, res) => {
  try {
    const userRoleId = req.params.userRoleId;
    await userRoleService.updateUserRoleById(userRoleId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteUserRoleById = async (req, res) => {
  try {
    const userRoleId = req.params.userRoleId;
    await userRoleService.deleteUserRoleById(userRoleId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
