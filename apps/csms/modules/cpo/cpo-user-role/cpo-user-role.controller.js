const cpoUserRoleService = require("./cpo-user-role.service");

exports.addCpoUserRole = async (req, res) => {
  try {
    await cpoUserRoleService.addCpoUserRole(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCpoUserRoleList = async (req, res) => {
  try {
    await cpoUserRoleService.getCpoUserRoleList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCpoUserRoleById = async (req, res) => {
  try {
    const cpoUserRoleId = req.params.cpoUserRoleId;
    await cpoUserRoleService.getCpoUserRoleById(cpoUserRoleId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateCpoUserRoleById = async (req, res) => {
  try {
    const cpoUserRoleId = req.params.cpoUserRoleId;
    await cpoUserRoleService.updateCpoUserRoleById(cpoUserRoleId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteCpoUserRoleById = async (req, res) => {
  try {
    const cpoUserRoleId = req.params.cpoUserRoleId;
    await cpoUserRoleService.deleteCpoUserRoleById(cpoUserRoleId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
