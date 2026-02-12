const { OcppEvents, ChargerStatuses } = require("@shared-libs/constants");
const { getChargerByIdentity, sendOcppEvent } = require("@shared-libs/helpers");
const { OcppTransactionsRepository } = require("@shared-libs/db/mysql");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const authorizeCharger = async (req, res) => {
  const eventName = OcppEvents.Authorize;
  const { idTagInfo } = req.body;
  const { chargerId } = req.query;

  const ocppSchema = { idTagInfo };

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const changeAvailability = async (req, res) => {
  const eventName = OcppEvents.ChangeAvailability;
  const { connectorId, type } = req.body;
  const { chargerId } = req.query;

  const ocppSchema = { connectorId, type };

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const changeConfiguration = async (req, res) => {
  const eventName = OcppEvents.ChangeConfiguration;
  const { key, value } = req.body;
  const { chargerId } = req.query;

  const ocppSchema = { key, value };

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const clearCache = async (req, res) => {
  const eventName = OcppEvents.ClearCache;
  const { chargerId } = req.query;

  const ocppSchema = {};

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const dataTransfer = async (req, res) => {
  const eventName = OcppEvents.DataTransfer;
  const { chargerId } = req.query;

  const ocppSchema = { ...req.body };

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const getConfiguration = async (req, res) => {
  const eventName = OcppEvents.GetConfiguration;
  const { key = [] } = req.body;
  const { chargerId } = req.query;

  const ocppSchema = { key };

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const heartbeat = async (req, res) => {
  const eventName = OcppEvents.Heartbeat;
  const { chargerId } = req.query;

  const ocppSchema = {};

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const remoteStartTransaction = async (req, res) => {
  const eventName = OcppEvents.RemoteStartTransaction;
  const { serialNumber, connectorId } = req.body;
  const ocppSchema = { connectorId, idTag: serialNumber };

  const charger = await getChargerByIdentity(serialNumber);
  if (!charger) {
    return res.status(400).json("Charger not found.");
  }
  if (charger.status == ChargerStatuses.INOPERATIVE) {
    return res.status(400).json("Charger is Inoperative.");
  }
  if (charger.status == ChargerStatuses.DISABLED) {
    return res.status(400).json("Charger is disabled.");
  }

  // check if charger connector is busy or not
  const lastTransaction = await OcppTransactionsRepository.findOne({
    where: {
      chargeBoxId: charger.chargeBoxId,
      connectorId: connectorId,
    },
    order: { createdAt: "DESC" },
    select: ["endTime"],
  });
  if (lastTransaction) {
    if (!lastTransaction?.endTime) {
      return res.status(400).json("Charger is Busy.");
    }
  }

  const response = await sendOcppEvent(serialNumber, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const remoteStopTransaction = async (req, res) => {
  const eventName = OcppEvents.RemoteStopTransaction;
  const { serialNumber, transactionId } = req.body;

  const charger = await getChargerByIdentity(serialNumber);
  if (!charger) {
    return res.status(400).json("Charger not found.");
  }
  if (charger.status == ChargerStatuses.INOPERATIVE) {
    return res.status(400).json("Charger is Inoperative.");
  }
  if (charger.status == ChargerStatuses.DISABLED) {
    return res.status(400).json("Charger is disabled.");
  }

  const ocppSchema = { transactionId };

  const response = await sendOcppEvent(serialNumber, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const reset = async (req, res) => {
  const eventName = OcppEvents.Reset;
  const { type } = req.body;
  const { chargerId } = req.query;

  const ocppSchema = { type };

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const startTransaction = async (req, res) => {
  const eventName = OcppEvents.StartTransaction;
  const { serialNumber, connectorId, meterStart, timestamp } = req.body;

  const ocppSchema = {
    connectorId,
    idTag: serialNumber,
    meterStart,
    timestamp,
  };

  const response = await sendOcppEvent(serialNumber, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const stopTransaction = async (req, res) => {
  const eventName = OcppEvents.StopTransaction;
  const { serialNumber, connectorId, meterStop, timestamp, transactionId } =
    req.body;

  const ocppSchema = {
    transactionId,
    meterStop,
    timestamp,
  };

  const response = await sendOcppEvent(serialNumber, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const unlockConnector = async (req, res) => {
  const eventName = OcppEvents.UnlockConnector;
  const { connectorId } = req.body;
  const { chargerId } = req.query;

  const ocppSchema = { connectorId };

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const getDiagnostics = async (req, res) => {
  const eventName = OcppEvents.GetDiagnostics;
  const { location } = req.body;
  const { chargerId } = req.query;

  const ocppSchema = { location };

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const updateFirmware = async (req, res) => {
  const eventName = OcppEvents.UpdateFirmware;
  const { location, retrieveDate } = req.body;
  const { chargerId } = req.query;

  const ocppSchema = { location, retrieveDate };

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const getLocalListVersion = async (req, res) => {
  const eventName = OcppEvents.GetLocalListVersion;
  const { chargerId } = req.query;

  const ocppSchema = {};

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const cancelReservation = async (req, res) => {
  const eventName = OcppEvents.CancelReservation;
  const { reservationId } = req.body;
  const { chargerId } = req.query;

  const ocppSchema = { reservationId };

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const reserveNow = async (req, res) => {
  const eventName = OcppEvents.ReserveNow;
  const { connectorId, expiryDate, idTag, reservationId } = req.body;
  const { chargerId } = req.query;

  const ocppSchema = { connectorId, expiryDate, idTag, reservationId };

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const clearChargingProfile = async (req, res) => {
  const eventName = OcppEvents.ClearChargingProfile;
  const { id, connectorId, chargingProfilePurpose, stackLevel } = req.body;
  const { chargerId } = req.query;

  const ocppSchema = { id, connectorId, chargingProfilePurpose, stackLevel };

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const getCompositeSchedule = async (req, res) => {
  const eventName = OcppEvents.GetCompositeSchedule;
  const { connectorId, duration, chargingRateUnit } = req.body;
  const { chargerId } = req.query;

  const ocppSchema = { connectorId, duration, chargingRateUnit };

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const setChargingProfile = async (req, res) => {
  const eventName = OcppEvents.SetChargingProfile;
  const { connectorId, csChargingProfiles } = req.body;
  const { chargerId } = req.query;

  const ocppSchema = { connectorId, csChargingProfiles };

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

const triggerMessage = async (req, res) => {
  const eventName = OcppEvents.TriggerMessage;
  const { requestedMessage } = req.body;
  const { chargerId } = req.query;

  const ocppSchema = { requestedMessage };

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema, true);

  return res.status(response.code).json(response.message);
};

const logStatusNotification = async (req, res) => {
  const eventName = OcppEvents.LogStatusNotification;
  const { requestedMessage } = req.body;
  const { chargerId } = req.query;

  const ocppSchema = {};

  const response = await sendOcppEvent(chargerId, eventName, ocppSchema);

  return res.status(response.code).json(response.message);
};

module.exports = {
  authorizeCharger,
  changeAvailability,
  changeConfiguration,
  clearCache,
  dataTransfer,
  getConfiguration,
  heartbeat,
  remoteStartTransaction,
  remoteStopTransaction,
  reset,
  startTransaction,
  stopTransaction,
  unlockConnector,
  getDiagnostics,
  updateFirmware,
  getLocalListVersion,
  cancelReservation,
  reserveNow,
  clearChargingProfile,
  getCompositeSchedule,
  setChargingProfile,
  triggerMessage,
  logStatusNotification,
};
