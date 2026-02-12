const rapidUpService = require("./rapid-up.service");
const rapidUpConsumerService = require("./rapid-up-consumer.service");

exports.getDeviceOverview = async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    await rapidUpService.getDeviceOverview(deviceId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.publishOverview = async (req, res) => {
  try {
    await rapidUpService.publishOverview(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.invokeCommand = async (req, res) => {
  try {
    await rapidUpService.invokeCommand(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateInterfaces = async (req, res) => {
  try {
    await rapidUpService.updateInterfaces(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.revokeCommand = async (req, res) => {
  try {
    const trackerId = req.params.id;
    await rapidUpService.revokeCommand(trackerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.revokeAll = async (req, res) => {
  try {
    await rapidUpService.revokeAll(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.pingTracker = async (req, res) => {
  try {
    const trackerId = req.params.id;
    await rapidUpService.pingTracker(trackerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.sync = async (req, res) => {
  try {
    await rapidUpService.sync(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.kernalLogRelay = async (req, res) => {
  try {
    await rapidUpService.kernalLogRelay(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getDeviceCache = async (req, res) => {
  try {
    await rapidUpService.getDeviceCache(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRolloutList = async (req, res) => {
  try {
    await rapidUpService.getRolloutList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createRollout = async (req, res) => {
  try {
    await rapidUpService.createRollout(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.playRollout = async (req, res) => {
  try {
    await rapidUpService.playRollout(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.cloneRollout = async (req, res) => {
  try {
    await rapidUpService.cloneRollout(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRolloutById = async (req, res) => {
  try {
    await rapidUpService.getRolloutById(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateRolloutById = async (req, res) => {
  try {
    await rapidUpService.updateRolloutById(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteRolloutById = async (req, res) => {
  try {
    await rapidUpService.deleteRolloutById(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteBulkRollouts = async (req, res) => {
  try {
    await rapidUpService.deleteBulkRollouts(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRolloutDetailedStats = async (req, res) => {
  try {
    await rapidUpService.getRolloutDetailedStats(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRolloutDetails = async (req, res) => {
  try {
    await rapidUpService.getRolloutDetails(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.setDeviceRolloutStatusFromDevice = async (req, res) => {
  try {
    await rapidUpService.setDeviceRolloutStatusFromDevice(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateDeviceRolloutState = async (req, res) => {
  try {
    await rapidUpService.updateDeviceRolloutState(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getDeviceLogsForRollout = async (req, res) => {
  try {
    await rapidUpService.getDeviceLogsForRollout(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.appendLogsForRolloutByDeviceId = async (req, res) => {
  try {
    await rapidUpService.appendLogsForRolloutByDeviceId(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRolloutStatusForDevice = async (req, res) => {
  try {
    await rapidUpService.getRolloutStatusForDevice(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.processLogs = async (req, res) => {
  try {
    await rapidUpConsumerService.processLogs(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.applicationLogRelay = async (req, res) => {
  try {
    await rapidUpService.applicationLogRelay(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
