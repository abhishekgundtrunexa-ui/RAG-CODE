const infoService = require("./info.service");
exports.getInfo = async (req, res) => {
  try {
    await infoService.getInfo(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
