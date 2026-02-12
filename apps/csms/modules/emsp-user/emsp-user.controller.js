const emspService = require("./emsp-user.service");

exports.addEmspUser = async (req, res) => {
  try {
    await emspService.addEmspUser(req, res);
  } catch (error) {
    console.error("Controller Error in addEmspUser:", error);
    res.status(500).json({ message: "Failed to add EMSP user", error: error.message });
  }
};

exports.updateEmspUser = async (req, res) => {
  try {
    await emspService.updateEmspUser(req, res);
  } catch (error) {
    console.error("Controller Error in updateEmspUser:", error);
    res.status(500).json({ message: "Failed to update EMSP user", error: error.message });
  }
};

exports.deleteEmspUser = async (req, res) => {
  try {
    await emspService.deleteEmspUser(req, res);
  } catch (error) {
    console.error("Controller Error in deleteEmspUser:", error);
    res.status(500).json({ message: "Failed to delete EMSP user", error: error.message });
  }
};
