const ipInfoService = require("./ip-info.service");
exports.getIpInfo = async (req, res) => {
  try {
    await ipInfoService.getIpInfo(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
