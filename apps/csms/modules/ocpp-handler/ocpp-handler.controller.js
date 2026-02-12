const ocppHandlerService = require("./ocpp-handler.service");

exports.handleEvent = async (req, res) => {
  try {
    await ocppHandlerService.handleEvent(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.healthCheck = async (req, res) => {
  try {
    res.status(200).send("OCPP Event Handler is healthy..!!");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
