const superAdminService = require("./super-admin.service");

exports.addSuperAdmin = async (req, res) => {
  try {
    await superAdminService.addSuperAdmin(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateSuperAdmin = async (req, res) => {
  try {
    await superAdminService.updateSuperAdmin(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteSuperAdmin = async (req, res) => {
  try {
    await superAdminService.deleteSuperAdmin(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSuperAdmins = async (req, res) => {
  try {
    await superAdminService.getSuperAdmins(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSuperAdminById = async (req, res) => {
  try {
    await superAdminService.getSuperAdminById(req, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
