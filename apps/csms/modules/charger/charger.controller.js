const chargerService = require("./charger.service");
const chargerLoadTestService = require("./charger-load-testing.service");

//Register Charger
exports.registerCharger = async (req, res) => {
  try {
    await chargerService.registerCharger(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//check eligibility
exports.checkEligibility = async (req, res) => {
  try {
    await chargerService.checkEligibility(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateConfiguration = async (req, res) => {
  try {
    const { chargerId } = req.params;
    await chargerService.updateConfiguration(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//load testing
exports.loadTestingChargerController = async (req, res) => {
  try {
    await chargerLoadTestService.loadTestingChargerService(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//clear load testing data
exports.clearloadTestingChargerController = async (req, res) => {
  try {
    await chargerLoadTestService.clearLoadTestingChargerService(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//create Testing Configuration
exports.createTestConfiguration = async (req, res) => {
  try {
    await chargerLoadTestService.createTestConfiguration(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// delete testing configuration
exports.deleteTestConfiguration = async (req, res) => {
  try {
    await chargerLoadTestService.deleteTestConfiguration(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Get Charger List
exports.getChargerList = async (req, res) => {
  try {
    await chargerService.getChargerList(false, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Get Charger Status List
exports.getStatusList = async (req, res) => {
  try {
    await chargerService.getStatusList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get Charger Overviews
exports.getChargerOverview = async (req, res) => {
  try {
    await chargerService.getChargersOverview(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Get Charger By Id
exports.getChargerById = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.getChargerById(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Activate charger
exports.activateCharger = async (req, res) => {
  try {
    await chargerService.activateCharger(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Soft delete charger
exports.softDeleteCharger = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.softDeleteCharger(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Soft delete chargers in bulk
exports.softDeleteChargers = async (req, res) => {
  try {
    const chargerIds = req.body.chargerIds;
    await chargerService.softDeleteChargers(chargerIds, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.assignCpoAndEvseStation = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.assignCpoAndEvseStation(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.assignCpo = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.assignCpo(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.assignCpoBulk = async (req, res) => {
  try {
    let chargerIds = req.body.chargerIds;
    await chargerService.assignCpoBulk(chargerIds, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.assignEvseStation = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.assignEvseStation(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.assignEvseStationBulk = async (req, res) => {
  try {
    const chargerIds = req.body.chargerIds;
    await chargerService.assignEvseStationBulk(chargerIds, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.changeChargerStatus = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.changeChargerStatus(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateCharger = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.updateCharger(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAuthCode = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.getAuthCode(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updatePrintSticker = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.updatePrintSticker(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerCounts = async (req, res) => {
  try {
    await chargerService.getChargerCounts(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getDeletedChargers = async (req, res) => {
  try {
    await chargerService.getChargerList(true, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateChargerLocation = async (req, res) => {
  try {
    const chargeBoxId = req.params.chargeBoxId;
    await chargerService.updateChargerLocation(chargeBoxId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerLocationMapData = async (req, res) => {
  try {
    await chargerService.getChargerLocationMapData(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateChargerCost = async (req, res) => {
  try {
    await chargerService.updateChargerCost(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.addConnector = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.addConnector(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerDetails = async (req, res) => {
  try {
    await chargerService.getChargerDetails(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerDetailsMin = async (req, res) => {
  try {
    await chargerService.getChargerDetails(req, res, 'min');
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerDetailsMin2 = async (req, res) => {
  try {
    await chargerService.getChargerDetails(req, res, 'min2');
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerDetailsConfig = async (req, res) => {
  try {
    await chargerService.getChargerDetailsConfig(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getConnectorPairListing = async (req, res) => {
  try {
    await chargerService.getConnectorPairListing(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerModelListing = async (req, res) => {
  try {
    await chargerService.getChargerModelListing(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.resendActivateCode = async (req, res) => {
  try {
    await chargerService.resendActivateCode(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getConnectedClientsList = async (req, res) => {
  try {
    await chargerService.getConnectedClientsList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateChargerTimezone = async (req, res) => {
  try {
    await chargerService.updateChargerTimezone(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.sendMeterValues = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.sendMeterValues(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.setChargerOcppConfig = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.setChargerOcppConfig(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.setChargerLanguage = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.setChargerLanguage(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerLanguage = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.getChargerLanguage(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.setChargerConstant = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.setChargerConstant(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerConstant = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.getChargerConstant(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.setChargerMeteringConfig = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.setChargerMeteringConfig(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.setChargerPaymentConfig = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.setChargerPaymentConfig(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.calculateChargingAmount = async (req, res) => {
  try {
    await chargerService.calculateChargingAmount(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateChargingStatus = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.updateChargingStatus(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.uploadRapidLogs = async (req, res) => {
  try {
    await chargerService.uploadRapidLogs(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.verifyDeviceAdmin = async (req, res) => {
  try {
    await chargerService.verifyDeviceAdmin(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllOcppLogs = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.getAllOcppLogs(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getOcppLogs = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.getOcppLogs(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getOcppBootNotificationLogs = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.getOcppBootNotificationLogs(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getOcppHeartbeatLogs = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.getOcppHeartbeatLogs(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getOcppMeterValueLogs = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.getOcppMeterValueLogs(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getOcppTransactionLogs = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await chargerService.getOcppTransactionLogs(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.chargingCalculations = async (req, res) => {
  try {
    await chargerService.chargingCalculations(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.chargingExperienceFeedback = async (req, res) => {
  try {
    await chargerService.chargingExperienceFeedback(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.sendTransactionReceipt = async (req, res) => {
  try {
    await chargerService.sendTransactionReceipt(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getFeedbackMessages = async (req, res) => {
  try {
    await chargerService.getFeedbackMessages(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getFeedbackAverage = async (req, res) => {
  try {
    await chargerService.getFeedbackAverage(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.chargingExperienceFeedbackList = async (req, res) => {
  try {
    await chargerService.chargingExperienceFeedbackList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.chargingExperienceFeedbackListById = async (req, res) => {
  try {
    await chargerService.chargingExperienceFeedbackListByChargeBoxId(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getChargerConfigurations = async (req, res) => {
  try {
    await chargerService.getChargerConfigurations(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.changeConfigurations = async (req, res) => {
  try {
    await chargerService.changeConfigurations(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
