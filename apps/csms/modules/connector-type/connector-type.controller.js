const connectorTypeService = require("./connector-type.service");

exports.getConnectorTypeList = async (req, res) => {
  try {
    await connectorTypeService.getConnectorTypeList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
