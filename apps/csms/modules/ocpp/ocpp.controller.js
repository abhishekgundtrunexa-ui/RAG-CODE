const ocppService = require("./ocpp.service");

exports.remoteStartTransaction = async (req, res) => {
  try {
    await ocppService.remoteStartTransaction(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.remoteStopTransaction = async (req, res) => {
  try {
    await ocppService.remoteStopTransaction(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// authorizeCharger;
exports.authorizeCharger = async (req, res) => {
  try {
    await ocppService.authorizeCharger(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// changeAvailability;
exports.changeAvailability = async (req, res) => {
  try {
    await ocppService.changeAvailability(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// changeConfiguration
exports.changeConfiguration = async (req, res) => {
  try {
    await ocppService.changeConfiguration(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// clearCache
exports.clearCache = async (req, res) => {
  try {
    await ocppService.clearCache(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// dataTransfer
exports.dataTransfer = async (req, res) => {
  try {
    await ocppService.dataTransfer(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// getConfiguration
exports.getConfiguration = async (req, res) => {
  try {
    await ocppService.getConfiguration(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// heartbeat
exports.heartbeat = async (req, res) => {
  try {
    await ocppService.heartbeat(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// reset
exports.reset = async (req, res) => {
  try {
    await ocppService.reset(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// unlockConnector
exports.unlockConnector = async (req, res) => {
  try {
    await ocppService.unlockConnector(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// getDiagnostics
exports.getDiagnostics = async (req, res) => {
  try {
    await ocppService.getDiagnostics(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// updateFirmware
exports.updateFirmware = async (req, res) => {
  try {
    await ocppService.updateFirmware(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// getLocalListVersion
exports.getLocalListVersion = async (req, res) => {
  try {
    await ocppService.getLocalListVersion(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// cancelReservation
exports.cancelReservation = async (req, res) => {
  try {
    await ocppService.cancelReservation(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// reserveNow
exports.reserveNow = async (req, res) => {
  try {
    await ocppService.reserveNow(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// clearChargingProfile
exports.clearChargingProfile = async (req, res) => {
  try {
    await ocppService.clearChargingProfile(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// getCompositeSchedule
exports.getCompositeSchedule = async (req, res) => {
  try {
    await ocppService.getCompositeSchedule(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// setChargingProfile
exports.setChargingProfile = async (req, res) => {
  try {
    await ocppService.setChargingProfile(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// triggerMessage
exports.triggerMessage = async (req, res) => {
  try {
    await ocppService.triggerMessage(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
