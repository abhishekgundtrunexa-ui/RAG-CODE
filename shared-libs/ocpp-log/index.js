const {
  OcppLogModel,
  OcppBootNotificationLogModel,
  OcppHeartbeatLogModel,
  OcppTransactionLogModel,
  OcppMeterValueLogModel,
  ExternalOcppLogModel,
  OcppAllLogModel,
} = require("@shared-libs/db/mongo-db");
const { DateTime } = require("luxon");
const { formatDateString } = require("@shared-libs/helpers");
const {
  ChargerRepository,
  OcppTransactionsRepository,
} = require("@shared-libs/db/mysql");
const { OcppEvents } = require("@shared-libs/constants");

const createOcppLog = async (data, LogModel = OcppLogModel) => {
  const {
    clientId,
    eventName,
    ocppSchema,
    requestFrom,
    responseData,
    responseFrom,
    error,
  } = data;

  //default set to 'UTC'
  let dateByTimezone = formatDateString(DateTime.utc(), "UTC");
  let createdAtLocal = null;
  let timezone = null;
  let country = null;

  let charger = await ChargerRepository.findOne({
    where: { serialNumber: clientId },
  });

  if (!charger) {
    charger = await ChargerRepository.findOne({
      where: { chargeBoxId: clientId },
    });
  }

  if (charger?.timezone) {
    dateByTimezone = formatDateString(DateTime.utc(), charger.timezone);
    createdAtLocal = formatDateString(DateTime.utc(), charger.timezone);
    timezone = charger.timezone;
    country = charger?.country;
  }

  let transactionUuid = null;
  let chargerTransactionId = null;
  let connectorId = null;

  if (ocppSchema.transactionId) {
    chargerTransactionId = ocppSchema.transactionId;
  }
  if (charger?.timezone) {
    try {
      if (ocppSchema?.timestamp) {
        ocppSchema.timestampLocal = formatDateString(
          DateTime.fromISO(ocppSchema?.timestamp),
          charger.timezone
        );
        ocppSchema.timezone = charger?.timezone;
        ocppSchema.country = charger?.country;
      }

      if (ocppSchema?.meterValue?.length) {
        if (ocppSchema?.meterValue[0]?.timestamp) {
          ocppSchema.meterValue[0].timestampLocal = formatDateString(
            DateTime.fromISO(ocppSchema?.meterValue[0]?.timestamp),
            charger.timezone
          );
          ocppSchema.meterValue[0].timezone = charger?.timezone;
          ocppSchema.meterValue[0].country = charger?.country;
        }
      }
    } catch (error) {}
  }

  if (!chargerTransactionId && eventName === OcppEvents.DataTransfer) {
    if (
      (ocppSchema.messageId === "chargingAmount" ||
        ocppSchema.messageId === "paymentStatus" ||
        ocppSchema.messageId === "transactionInvoice") &&
      ocppSchema.data
    ) {
      const tmpData = JSON.parse(ocppSchema.data);

      if (tmpData.transactionId) {
        chargerTransactionId = tmpData.transactionId;
      } else if (tmpData.transaction_id) {
        chargerTransactionId = tmpData.transaction_id;
      }
    }
  }

  if (chargerTransactionId) {
    const transactionData = await OcppTransactionsRepository.findOne({
      where: { chargeBoxId: clientId, chargerTransactionId },
    });

    if (transactionData) {
      transactionUuid = transactionData.transactionUuid;
      connectorId = transactionData.connectorId;
    }
  }

  if (!connectorId && ocppSchema.connectorId) {
    connectorId = ocppSchema.connectorId;
  }

  if (!transactionUuid && ocppSchema.connectorId) {
    const transactionData = await OcppTransactionsRepository.findOne({
      where: {
        chargeBoxId: clientId,
        connectorId: ocppSchema.connectorId,
        isFinished: false,
      },
      order: { createdAt: "DESC" },
    });

    if (transactionData) {
      transactionUuid = transactionData.transactionUuid;
      chargerTransactionId = transactionData.chargerTransactionId;
    }
  }

  const ocppLog = new LogModel({
    transactionUuid,
    chargerTransactionId,
    connectorId,
    clientId,
    eventName,
    ocppSchema,
    requestFrom,
    responseData,
    responseFrom,
    error,
    dateByTimezone,
    country,
    timezone,
    createdAtLocal,
  });
  await ocppLog.save();

  try {
    if (
      transactionUuid &&
      eventName === OcppEvents.StartTransaction &&
      ocppSchema?.idTag
    ) {
      await OcppLogModel.findOneAndUpdate(
        {
          "ocppSchema.idTag": ocppSchema.idTag,
          eventName: OcppEvents.Authorize,
          transactionUuid: null,
        },
        {
          transactionUuid,
          chargerTransactionId,
          connectorId,
        }
      ).sort({ createdAt: -1 });
    }

    if (connectorId && eventName === OcppEvents.StartTransaction) {
      await OcppLogModel.updateMany(
        {
          clientId,
          connectorId,
          eventName: OcppEvents.StatusNotification,
          transactionUuid: null,
        },
        {
          transactionUuid,
          chargerTransactionId,
        }
      );
    }
  } catch (error) {}

  try {
    if (ocppLog._id) {
      await copyToAllLogs(ocppLog._id, LogModel);
    }
  } catch (error) {}

  return ocppLog;
};

const copyToAllLogs = async (id, LogModel) => {
  // 1. Fetch original record
  const data = await LogModel.findById(id).lean(); // lean() gives plain object
  if (!data) {
    throw new Error("Source record not found");
  }

  let dataToSave = {
    ...data,
    ocppSchemaRaw: data?.ocppSchema ? JSON.stringify(data?.ocppSchema) : null,
    responseDataRaw: data?.responseData
      ? JSON.stringify(data?.responseData)
      : null,
    errorRaw: data?.error ? JSON.stringify(data?.error) : null,
  };

  // 2. Insert/update into target collection with SAME _id
  await OcppAllLogModel.findOneAndUpdate(
    { _id: data._id }, // match by same _id
    dataToSave, // replace with source data
    { upsert: true, new: true, overwrite: true, timestamps: false } // create if not exists
  );

  return { success: true };
};

const createOcppBootNotificationLog = async (data) => {
  return await createOcppLog(data, OcppBootNotificationLogModel);
};

const createOcppHeartbeatLog = async (data) => {
  return await createOcppLog(data, OcppHeartbeatLogModel);
};

const createOcppTransactionLog = async (data) => {
  return await createOcppLog(data, OcppTransactionLogModel);
};

const createOcppMeterValueLog = async (data) => {
  return await createOcppLog(data, OcppMeterValueLogModel);
};

const createExternalOcppLog = async (data) => {
  const LogModel = ExternalOcppLogModel;

  const {
    clientId,
    eventName,
    ocppSchema,
    requestFrom,
    responseData,
    responseFrom,
    error,
  } = data;

  //default set to 'UTC'
  let dateByTimezone = formatDateString(DateTime.utc(), "UTC");
  let createdAtLocal = null;
  let timezone = null;
  let country = null;

  let transactionUuid = null;
  let chargerTransactionId = null;
  let connectorId = null;

  if (ocppSchema.transactionId) {
    chargerTransactionId = ocppSchema.transactionId;
  }

  if (!connectorId && ocppSchema.connectorId) {
    connectorId = ocppSchema.connectorId;
  }

  const ocppLog = new LogModel({
    transactionUuid,
    chargerTransactionId,
    connectorId,
    clientId,
    eventName,
    ocppSchema,
    requestFrom,
    responseData,
    responseFrom,
    error,
    dateByTimezone,
    country,
    timezone,
    createdAtLocal,
  });
  await ocppLog.save();

  return ocppLog;
};

module.exports = {
  createOcppLog,
  createOcppBootNotificationLog,
  createOcppHeartbeatLog,
  createOcppTransactionLog,
  createOcppMeterValueLog,
  createExternalOcppLog,
};
