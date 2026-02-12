const tenantService = require("./tenant.service");

exports.addTenant = async (req, res) => {
  try {
    await tenantService.addTenant(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTenant = async (req, res) => {
  try {
    await tenantService.getTenant(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
