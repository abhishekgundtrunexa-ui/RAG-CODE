const configConstantService = require("./config-constant.service");

exports.setMockDataStatus = async (req, res) => {
  try {
    await configConstantService.setMockDataStatus(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getMockDataStatus = async (req, res) => {
  try {
    await configConstantService.getMockDataStatus(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
