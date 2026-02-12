const remoteOcppService = require("./remote-ocpp.service");

exports.remoteStartTransaction = async (req, res) => {
  try {
    await remoteOcppService.remoteStartTransaction(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.remoteStopTransaction = async (req, res) => {
  try {
    await remoteOcppService.remoteStopTransaction(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// authorizeCharger;
exports.authorizeCharger = async (req, res) => {
  try {
    await remoteOcppService.authorizeCharger(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// changeAvailability;
exports.changeAvailability = async (req, res) => {
  try {
    await remoteOcppService.changeAvailability(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// changeConfiguration
exports.changeConfiguration = async (req, res) => {
  try {
    await remoteOcppService.changeConfiguration(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// clearCache
exports.clearCache = async (req, res) => {
  try {
    await remoteOcppService.clearCache(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// dataTransfer
exports.dataTransfer = async (req, res) => {
  try {
    await remoteOcppService.dataTransfer(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// getConfiguration
exports.getConfiguration = async (req, res) => {
  try {
    await remoteOcppService.getConfiguration(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// heartbeat
exports.heartbeat = async (req, res) => {
  try {
    await remoteOcppService.heartbeat(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// reset
exports.reset = async (req, res) => {
  try {
    await remoteOcppService.reset(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// unlockConnector
exports.unlockConnector = async (req, res) => {
  try {
    await remoteOcppService.unlockConnector(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// getDiagnostics
exports.getDiagnostics = async (req, res) => {
  try {
    await remoteOcppService.getDiagnostics(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// updateFirmware
exports.updateFirmware = async (req, res) => {
  try {
    await remoteOcppService.updateFirmware(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// getLocalListVersion
exports.getLocalListVersion = async (req, res) => {
  try {
    await remoteOcppService.getLocalListVersion(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// clearChargingProfile
exports.clearChargingProfile = async (req, res) => {
  try {
    await remoteOcppService.clearChargingProfile(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// getCompositeSchedule
exports.getCompositeSchedule = async (req, res) => {
  try {
    await remoteOcppService.getCompositeSchedule(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// setChargingProfile
exports.setChargingProfile = async (req, res) => {
  try {
    await remoteOcppService.setChargingProfile(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// triggerMessage
exports.triggerMessage = async (req, res) => {
  try {
    await remoteOcppService.triggerMessage(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
