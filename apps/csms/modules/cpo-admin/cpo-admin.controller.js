const cpoAdminService = require("./cpo-admin.service");

exports.addCpo = async (req, res) => {
  try {
    await cpoAdminService.addCpo(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCpoById = async (req, res) => {
  try {
    const cpoAdminUserId = req.params.cpoAdminUserId;
    await cpoAdminService.getCpoById(cpoAdminUserId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCpoList = async (req, res) => {
  try {
    await cpoAdminService.getCpoList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateCpo = async (req, res) => {
  try {
    const cpoAdminUserId = req.params.cpoAdminUserId;
    await cpoAdminService.updateCpo(cpoAdminUserId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.listCpoAdmins = async (req, res) => {
  try {
    await cpoAdminService.listCpoAdmins(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteCpo = async (req, res) => {
  try {
    const cpoId = req.params.cpoId;
    await cpoAdminService.deleteCpo(cpoId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteCpoBulk = async (req, res) => {
  try {
    const cpoIds = req.body?.cpoIds;
    await cpoAdminService.deleteCpoBulk(cpoIds, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
