const monerisService = require("./moneris.service");

exports.preauth = async (req, res) => {
  try {
    const response = await monerisService.sendPreauthRequest();
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.emvDataAdd = async (req, res) => {
  try {
    const response = await monerisService.emvDataAddRequest();
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.emvCompletion = async (req, res) => {
  try {
    const response = await monerisService.emvCompletionRequest();
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
