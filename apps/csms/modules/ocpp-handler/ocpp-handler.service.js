const { DateTime } = require("luxon");
const {
  createOcppLog,
  createOcppBootNotificationLog,
  createOcppHeartbeatLog,
  createOcppMeterValueLog,
  createOcppTransactionLog,
} = require("@shared-libs/ocpp-log");
const {
  OcppEvents,
  OcppSource,
  ChargerStatuses,
  OcppConstants,
  PusherConstants,
  ChargingStatuses,
} = require("@shared-libs/constants");
const { sendDataToPusher } = require("@shared-libs/pusher");
const {
  ChargerRepository,
  ChargerMeterValuesRepository,
  OcppTransactionsRepository,
  ChargerOcppConfigRepository,
  TestingConfigurationRepository,
  ChargerViewRepository,
  ChargerCardRepository,
  ChargerVersionRepository,
  OtaUpdatesChargersRepository,
  OtaUpdatesRepository,
  ChargerBookingsRepository,
  ChargerLocalAuthorizationRepository,
  CustomersRepository,
} = require("@shared-libs/db/mysql");
const {
  OcppStopTransactionQueue,
  OcppGenerateInvoiceQueue,
  OcppAmountLookupQueue,
  OcppRealtimeAmountQueue,
  OcppCalculateAvgChargingRateQueue,
  OcppGetConfigurationQueue,
  OcppUpdatePendingFirmwareQueue,
  OcppChangeConfigurationQueue,
  OcppSendLocalListQueue,
} = require("@shared-libs/queues");
const {
  getChargerByIdentity,
  convertDateTimezone,
  formatRawMeterValues,
  modifyChargerOnChargingStatusUpdate,
  getOcppTransaction,
  addMeasurandValues,
  sendChargerUpdatedPusherEvent,
  getRawCardUid,
  validateChangeConfig,
  isSupportedConfigurationKey,
  validateGetConfigurationKeys,
} = require("@shared-libs/helpers");
const { In } = require("typeorm");
const { getAnalyticsFromDate } = require("@shared-libs/analytics-helper");
const { ChargerConfigurationModel } = require("@shared-libs/db/mongo-db");
const {
  startRemoteChargingSession,
} = require("@shared-libs/charging-session-helper");
const { sendSessionStartWebhook } = require("@shared-libs/whatsapp-webhook");

const logConsoles = false;

const handleEvent = async (req, res) => {
  let responseData = {};

  const { clientId, eventName, params = {} } = req.body;

  if (clientId && eventName && params) {
    if (logConsoles) {
      console.log(`Server got ${eventName} from ${clientId}:`, params);
    }

    switch (eventName) {
      case OcppEvents.Authorize:
        responseData = await handleAuthorize(eventName, clientId, params);
        break;
      case OcppEvents.BootNotification:
        responseData = await handleBootNotification(
          eventName,
          clientId,
          params,
        );
        break;
      case OcppEvents.ChangeAvailability:
        responseData = await handleChangeAvailability(
          eventName,
          clientId,
          params,
        );
        break;
      case OcppEvents.ChangeConfiguration:
        responseData = await handleChangeConfiguration(
          eventName,
          clientId,
          params,
        );
        break;
      case OcppEvents.ClearCache:
        responseData = await handleClearCache(eventName, clientId, params);
        break;
      case OcppEvents.DataTransfer:
        responseData = await handleDataTransfer(eventName, clientId, params);
        break;
      case OcppEvents.GetConfiguration:
        responseData = await handleGetConfiguration(
          eventName,
          clientId,
          params,
        );
        break;
      case OcppEvents.Heartbeat:
        responseData = await handleHeartbeat(eventName, clientId, params);
        break;
      case OcppEvents.MeterValues:
        responseData = await handleMeterValues(eventName, clientId, params);
        break;
      case OcppEvents.RemoteStartTransaction:
        responseData = await handleRemoteStartTransaction(
          eventName,
          clientId,
          params,
        );
        break;
      case OcppEvents.RemoteStopTransaction:
        responseData = await handleRemoteStopTransaction(
          eventName,
          clientId,
          params,
        );
        break;
      case OcppEvents.Reset:
        responseData = await handleReset(eventName, clientId, params);
        break;
      case OcppEvents.StartTransaction:
        responseData = await handleStartTransaction(
          eventName,
          clientId,
          params,
        );
        break;
      case OcppEvents.StatusNotification:
        responseData = await handleStatusNotification(
          eventName,
          clientId,
          params,
        );
        break;
      case OcppEvents.StopTransaction:
        responseData = await handleStopTransaction(eventName, clientId, params);
        break;
      case OcppEvents.UnlockConnector:
        responseData = await handleUnlockConnector(eventName, clientId, params);
        break;
      case OcppEvents.GetDiagnostics:
        responseData = await handleGetDiagnostics(eventName, clientId, params);
        break;
      case OcppEvents.DiagnosticsStatusNotification:
        responseData = await handleDiagnosticsStatusNotification(
          eventName,
          clientId,
          params,
        );
        break;
      case OcppEvents.FirmwareStatusNotification:
        responseData = await handleFirmwareStatusNotification(
          eventName,
          clientId,
          params,
        );
        break;
      case OcppEvents.GetLocalListVersion:
        responseData = await handleGetLocalListVersion(
          eventName,
          clientId,
          params,
        );
        break;
      case OcppEvents.CancelReservation:
        responseData = await handleCancelReservation(
          eventName,
          clientId,
          params,
        );
        break;
      case OcppEvents.ReserveNow:
        responseData = await handleReserveNow(eventName, clientId, params);
        break;
      case OcppEvents.ClearChargingProfile:
        responseData = await handleClearChargingProfile(
          eventName,
          clientId,
          params,
        );
        break;
      case OcppEvents.GetCompositeSchedule:
        responseData = await handleGetCompositeSchedule(
          eventName,
          clientId,
          params,
        );
        break;
      case OcppEvents.SetChargingProfile:
        responseData = await handleSetChargingProfile(
          eventName,
          clientId,
          params,
        );
        break;
      case OcppEvents.TriggerMessage:
        responseData = await handleTriggerMessage(eventName, clientId, params);
        break;
      case OcppEvents.LogStatusNotification:
        responseData = await handleLogStatusNotification(
          eventName,
          clientId,
          params,
        );
        break;
    }
  }

  return res.status(200).json(responseData);
};

// ============================

const handleAuthorize = async (eventName, clientId, params) => {
  let expiryDate = DateTime.utc().plus({ hours: 2 }).toISO();

  let responseData = { idTagInfo: { expiryDate, status: "Invalid" } };

  // Get Charger By Identity
  const charger = await getChargerByIdentity(clientId, {}, true);
  if (charger) {
    if (charger?.status !== ChargerStatuses.INOPERATIVE) {
      await modifyChargerOnChargingStatusUpdate({
        chargerId: charger.id,
        chargingStatus: ChargingStatuses.PREPARING,
      });
    }

    // Checking If IdTag is ClosedLoopCard
    const cardUidRaw = getRawCardUid(params?.idTag);

    const chargerCardData = await ChargerCardRepository.findOne({
      where: { chargerId: charger.id, cardUidRaw, isExpired: false },
    });

    let hasIssue = false;

    if (chargerCardData) {
      console.log("THREE")
      const transactionRes = await startRemoteChargingSession({
        chargeBoxId: charger?.chargeBoxId,
        cardUid: params?.idTag,
        startMethod: "RFID",
        transactionStatus: "rfid",
        sendRemoteEvent: false,
      });

      if (transactionRes?.code != 200) {
        hasIssue = true;
      }
    }

    if (!hasIssue) {
      const transactionWhere = {
        chargeBoxId: charger?.chargeBoxId,
        idTag: params?.idTag,
        charger,
        getOnly: true,
      };

      const [preauthTransaction, remoteTransaction, rfidTransaction] =
        await Promise.all([
          // Getting OCPP Transaction that is created by PreAuth
          getOcppTransaction({
            transactionStatus: "preauth",
            ...transactionWhere,
          }),
          getOcppTransaction({
            transactionStatus: "remote-started",
            ...transactionWhere,
          }),
          getOcppTransaction({
            transactionStatus: "rfid",
            ...transactionWhere,
          }),
        ]);

      const transactionData = preauthTransaction
        ? preauthTransaction
        : remoteTransaction
          ? remoteTransaction
          : rfidTransaction;

      if (transactionData) {
        responseData = { idTagInfo: { expiryDate, status: "Accepted" } };

        await OcppTransactionsRepository.update(
          transactionData.transactionUuid,
          { transactionStatus: "authorized" },
        );
      }
    }
  }

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleBootNotification = async (eventName, clientId, params) => {
  // Get Charger By Identity
  const charger = await getChargerByIdentity(clientId, {}, true);
  let currentTime = DateTime.utc().toISO();

  let responseData = {
    status: "Rejected",
    interval: OcppConstants.BOOT_NOTIFICATION_INTERVAL,
    currentTime,
  };

  if (charger) {
    const chargerOcppConfigData = await ChargerOcppConfigRepository.findOne({
      where: { chargerId: charger.id },
    });

    responseData = {
      status: "Accepted",
      interval: chargerOcppConfigData?.heartbeatIntervalSeconds
        ? Number(chargerOcppConfigData?.heartbeatIntervalSeconds)
        : OcppConstants.BOOT_NOTIFICATION_INTERVAL,
      currentTime,
    };

    if (charger?.status !== ChargerStatuses.INOPERATIVE) {
      // Update charger status activated -> available
      await ChargerRepository.update(charger.id, {
        status: ChargerStatuses.AVAILABLE,
      });
    }

    await sendChargerUpdatedPusherEvent(charger.id);

    // Save OCPP Logs In Database
    await createOcppBootNotificationLog({
      clientId,
      eventName,
      ocppSchema: params,
      requestFrom: OcppSource.CHARGER,
      responseData,
      responseFrom: OcppSource.SERVER,
    });

    const shouldTriggerChangeConfig =
      !!chargerOcppConfigData?.lastConfigUpdatedAt &&
      (!chargerOcppConfigData?.lastConfigSentAt ||
        chargerOcppConfigData.lastConfigSentAt <
          chargerOcppConfigData.lastConfigUpdatedAt);

    if (!shouldTriggerChangeConfig) {
      await OcppGetConfigurationQueue.add(
        { clientId, connectorId: 1 },
        { delay: 10000 },
      );
    } else {
      await OcppChangeConfigurationQueue.add({ clientId }, { delay: 5000 });
    }

    // Add UpdateFirmware Job in the queue
    await OcppUpdatePendingFirmwareQueue.add({ clientId }, { delay: 10000 });

    try {
      if (process.env.CGX_ENV !== "production") {
        const latestListInDb = await ChargerLocalAuthorizationRepository.find({
          where: { chargeBoxId: clientId },
          order: { listVersion: "DESC" },
          take: 1,
        });

        if (latestListInDb && latestListInDb.length > 0) {
          await OcppSendLocalListQueue.add(
            { chargeBoxId: clientId },
            { delay: 15000 }
          );
        }
      }
    } catch (localListError) {
      console.error(`Error checking/queueing local authorization lists for ${clientId}:`, localListError);
    }

    try {
      // upsert the charger firmware version (insert if not found, update if found)
      const existingVersion = await ChargerVersionRepository.findOne({
        where: { chargerId: charger.id },
      });

      if (existingVersion) {
        await ChargerVersionRepository.update(
          { chargerId: charger.id },
          {
            chargeBoxId: charger?.chargeBoxId,
            evseStationId: charger?.evseStationId,
            firmwareVersion: params?.firmwareVersion,
          },
        );
      } else {
        const versionEntity = ChargerVersionRepository.create({
          chargerId: charger.id,
          chargeBoxId: charger?.chargeBoxId,
          evseStationId: charger?.evseStationId,
          firmwareVersion: params?.firmwareVersion,
        });
        await ChargerVersionRepository.save(versionEntity);
      }
    } catch (error) {}

    return responseData;
  }

  // Save OCPP Logs In Database
  await createOcppBootNotificationLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleChangeAvailability = async (eventName, clientId, params) => {
  const responseData = { status: "Accepted" };

  //Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

// const handleChangeConfiguration = async (eventName, clientId, params) => {
//   const responseData = { status: "Accepted" };

//   // Save OCPP Logs In Database
//   await createOcppLog({
//     clientId,
//     eventName,
//     ocppSchema: params,
//     requestFrom: OcppSource.CHARGER,
//     responseData,
//     responseFrom: OcppSource.SERVER,
//   });

//   return responseData;
// };

const handleChangeConfiguration = async (eventName, clientId, params) => {
  const { key, value, readonly } = params;

  const { valid, error } = validateChangeConfig(key, value);

  if (!valid) {
    return { status: "Rejected" };
  }

  if (!isSupportedConfigurationKey(key)) {
    return { status: "NotSupported" };
  }

  let config = await ChargerConfigurationModel.findOne({
    chargeBoxId: clientId,
    key,
  });

  if (!config) {
    config = await ChargerConfigurationModel.create({
      chargeBoxId: clientId,
      key,
      value,
      readonly,
    });

    const responseData = { status: "Accepted" };

    await createOcppLog({
      clientId,
      eventName,
      ocppSchema: params,
      requestFrom: OcppSource.CHARGER,
      responseData,
      responseFrom: OcppSource.SERVER,
    });

    return responseData;
  }

  if (config.readonly) {
    const responseData = { status: "Rejected" };

    await createOcppLog({
      clientId,
      eventName,
      ocppSchema: params,
      requestFrom: OcppSource.CHARGER,
      responseData,
      responseFrom: OcppSource.SERVER,
    });

    return responseData;
  }

  config.value = value;
  await config.save();

  const responseData = { status: "Accepted" };

  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleClearCache = async (eventName, clientId, params) => {
  const responseData = { status: "Accepted" };

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleDataTransfer = async (eventName, clientId, params) => {
  const responseData = { status: "Accepted" };

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  if (params.messageId === "paymentStatus") {
    const paramsData = JSON.parse(params.data);

    const chargerTransactionId = paramsData.transaction_id;
    const paymentStatus = paramsData.status;
    const transactionData = await OcppTransactionsRepository.findOne({
      where: {
        chargerTransactionId,
        chargeBoxId: clientId,
      },
    });

    if (transactionData) {
      // Note: paymentStatus is getting updated from payment (Preauth Complete only)
      // await OcppTransactionsRepository.update(transactionData.transactionUuid, {
      //   paymentStatus,
      // });

      // const updatedTransaction = await OcppTransactionsRepository.findOne({
      //   where: { transactionUuid: transactionData.transactionUuid },
      // });

      await sendDataToPusher({
        channelName: PusherConstants.channels.PUSHER_NODE_APP,
        eventName: PusherConstants.events.transaction.TRANSACTION_UPDATED,
        data: { transactionUuid: transactionData.transactionUuid },
      });

      if (transactionData?.cpoId) {
        await sendDataToPusher({
          channelName: transactionData.cpoId,
          eventName: PusherConstants.events.transaction.TRANSACTION_UPDATED,
          data: { transactionUuid: transactionData.transactionUuid },
        });
      }

      if (paymentStatus === "Accepted") {
        await OcppGenerateInvoiceQueue.add(
          {
            transactionUuid: transactionData.transactionUuid,
            sendDataTransfer: true,
          },
          { delay: 500 },
        );

        try {
          const todayDate = DateTime.utc().toFormat("yyyy-MM-dd");
          await getAnalyticsFromDate(todayDate);
        } catch (error) {}
      }
    }

    // Get Charger By Identity
    const charger = await getChargerByIdentity(clientId);
    if (charger) {
      await modifyChargerOnChargingStatusUpdate({
        chargerId: charger.id,
        chargingStatus: ChargingStatuses.AVAILABLE,
      });
    }
  } else if (params.messageId === "lookup") {
    const lookupParamsData = JSON.parse(params.data);

    const ocppTransactionId = lookupParamsData?.ocppTransactionId;
    const meterStop = lookupParamsData?.meterStop;
    const paymentType = lookupParamsData?.paymentType;

    await OcppAmountLookupQueue.add(
      { ocppTransactionId, meterStop, clientId, paymentType },
      { delay: 500 },
    );
  }

  return responseData;
};

// const handleGetConfiguration = async (eventName, clientId, params) => {
//   const responseData = { status: "Accepted" };

//   // Save OCPP Logs In Database
//   await createOcppLog({
//     clientId,
//     eventName,
//     ocppSchema: params,
//     requestFrom: OcppSource.CHARGER,
//     responseData,
//     responseFrom: OcppSource.SERVER,
//   });

//   return responseData;
// };

const handleGetConfiguration = async (eventName, clientId, params) => {
  const { key: requestedKeys } = params || {};

  const { valid, error } = validateGetConfigurationKeys(requestedKeys);

  if (!valid) {
    return {
      configurationKey: [],
      unknownKey: requestedKeys || [],
    };
  }

  let configs;
  if (!requestedKeys || requestedKeys.length === 0) {
    configs = await ChargerConfigurationModel.find({ chargeBoxId: clientId });
  } else {
    configs = await ChargerConfigurationModel.find({
      chargeBoxId: clientId,
      key: { $in: requestedKeys },
    });
  }

  const configurationKey = configs.map((conf) => ({
    key: conf.key,
    readonly: conf.readonly,
    value: conf.value ?? undefined,
  }));

  const unknownKey =
    requestedKeys?.filter((k) => !configs.some((conf) => conf.key === k)) || [];

  const responseData = {
    configurationKey,
    unknownKey,
  };

  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleHeartbeat = async (eventName, clientId, params) => {
  // Get Charger By Identity
  const charger = await getChargerByIdentity(clientId, {}, true);
  let currentTime = DateTime.utc().toISO();

  const responseData = { currentTime };

  // Get Charger By Identity & status: ACTIVATED
  const activatedCharger = await getChargerByIdentity(clientId, {
    status: In([ChargerStatuses.ACTIVATED, ChargerStatuses.OFFLINE]),
  });

  if (activatedCharger) {
    if (activatedCharger?.chargingStatus == ChargingStatuses.UNAVAILABLE) {
      // Update charger status activated -> available
      await ChargerRepository.update(activatedCharger.id, {
        status: ChargerStatuses.AVAILABLE,
        chargingStatus: ChargingStatuses.AVAILABLE,
      });
    } else {
      if (
        ![
          ChargingStatuses.SUSPENDED_EVSE,
          ChargingStatuses.SUSPENDED_EV,
          ChargingStatuses.FAULTED,
        ].includes(activatedCharger?.chargingStatus)
      ) {
        // Update charger status activated -> available
        await ChargerRepository.update(activatedCharger.id, {
          status: ChargerStatuses.AVAILABLE,
        });
      }
    }

    await sendChargerUpdatedPusherEvent(activatedCharger.id);
  }

  if (charger) {
    // Update last heart beat received for the charger
    await ChargerRepository.update(charger.id, {
      lastHeartbeat: convertDateTimezone(DateTime.utc()),
    });

    await sendChargerUpdatedPusherEvent(charger.id);
  }

  // Save OCPP Logs In Database
  await createOcppHeartbeatLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleMeterValues = async (eventName, clientId, params) => {
  const responseData = {};

  // Get Charger By Identity
  let charger = await getChargerByIdentity(clientId);

  if (!charger) {
    charger = await ChargerRepository.findOne({
      where: { id: clientId },
    });
  }

  if (charger) {
    // Update last heart beat received for the charger
    await ChargerRepository.update(charger.id, {
      lastHeartbeat: convertDateTimezone(DateTime.utc()),
    });

    await sendChargerUpdatedPusherEvent(charger.id);
  }

  // Save OCPP Logs In Database
  const log = await createOcppMeterValueLog({
    clientId,
    eventName,
    ocppSchema: addMeasurandValues(params),
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  const meterValueId = log?._id?.toString();

  if (charger) {
    // Save clean logs/formatted logs in the ChargerMeterValues Collection
    let createFormattedMeterValues = await formatRawMeterValues({
      data: params,
    });

    createFormattedMeterValues = {
      ...createFormattedMeterValues,
      chargeBoxId: charger.chargeBoxId,
    };

    await ChargerMeterValuesRepository.insert(createFormattedMeterValues);
  }

  let transactionData = null;
  if (charger) {
    if (params?.transactionId && params?.connectorId) {
      transactionData = await OcppTransactionsRepository.findOne({
        where: {
          chargerTransactionId: params?.transactionId,
          chargeBoxId: charger.chargeBoxId,
        },
      });
    }
  }

  if (transactionData?.isPaid === false) {
    let meterStop = null;
    const ocppTransactionId = transactionData.transactionUuid;

    let isTransactionStart = false;
    if (params?.meterValue?.length > 0) {
      if (params?.meterValue[0]?.sampledValue?.length > 0) {
        const sampledValuesArray = params?.meterValue[0]?.sampledValue;
        sampledValuesArray.forEach((obj) => {
          if (obj.measurand === "Energy.Active.Import.Register") {
            meterStop = Number(obj.value);
            isTransactionStart = obj?.context === "Transaction.Begin";
          }
        });
      }
    }

    if (meterStop !== null) {
      if (isTransactionStart) {
        await OcppTransactionsRepository.update(ocppTransactionId, {
          meterStart: meterStop,
        });
      }
      await OcppTransactionsRepository.update(ocppTransactionId, {
        meterStop,
      });

      await OcppRealtimeAmountQueue.add(
        { ocppTransactionId, clientId, meterValueId },
        { delay: 500 },
      );
    }
  }

  return responseData;
};

const handleRemoteStartTransaction = async (eventName, clientId, params) => {
  const responseData = { status: "Accepted" };

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleRemoteStopTransaction = async (eventName, clientId, params) => {
  const responseData = { status: "Accepted" };

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleReset = async (eventName, clientId, params) => {
  const responseData = { status: "Accepted" };

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleStartTransaction = async (eventName, clientId, params) => {
  let { meterStart } = params;

  // Get Charger By Identity
  const charger = await getChargerByIdentity(clientId);

  if (!charger) {
    return { idTagInfo: { status: "Invalid" } };
  }
  const testConfig = await TestingConfigurationRepository.findOne({
    where: {
      chargeBoxId: charger["chargeBoxId"],
    },
    select: ["startDate", "meterStart"],
  });
  if (testConfig) {
    // change the status in testing_configuration table
    await TestingConfigurationRepository.update(
      { chargeBoxId: charger["chargeBoxId"] },
      { status: "IN_PROGRESS" },
    );
    meterStart = testConfig["meterStart"];
    params["meterStart"] = meterStart;
    params["timestamp"] = meterStart;
  }
  if (
    charger?.status == ChargerStatuses.INOPERATIVE ||
    charger?.status == ChargerStatuses.DISABLED
  ) {
    return { idTagInfo: { status: "Invalid" } };
  }

  let ocppTransactionData = await getOcppTransaction({
    chargeBoxId: charger.chargeBoxId,
    connectorId: params.connectorId,
    idTag: params.idTag,
    charger,
    getOnly: true,
  });

  if (!ocppTransactionData) {
    // For Auto Authorized from Charger Cache
    ocppTransactionData = await getOcppTransaction({
      chargeBoxId: charger?.chargeBoxId,
      idTag: params?.idTag,
      transactionStatus: "preauth",
      charger,
      getOnly: true,
    });

    if (!ocppTransactionData) {
      // For Auto Authorized If Authorize event not sent from charger (For Remote Only)
      ocppTransactionData = await getOcppTransaction({
        chargeBoxId: charger?.chargeBoxId,
        idTag: params?.idTag,
        transactionStatus: "remote-started",
        charger,
        getOnly: true,
      });
    }

    if (ocppTransactionData?.transactionUuid) {
      await OcppTransactionsRepository.update(
        ocppTransactionData.transactionUuid,
        { transactionStatus: "authorized" },
      );
    }
  }

  if (!ocppTransactionData) {
    // Save OCPP Logs In Database
    await createOcppTransactionLog({
      clientId,
      eventName,
      ocppSchema: params,
      requestFrom: OcppSource.CHARGER,
      responseData: { idTagInfo: { status: "Invalid" } },
      responseFrom: OcppSource.SERVER,
    });

    return { idTagInfo: { status: "Invalid" } };
  }

  const chargerTransactionId = ocppTransactionData.chargerTransactionId;
  const timezone = ocppTransactionData?.timezone ?? "UTC";

  const createTransactionData = {
    meterStart: meterStart,
    meterStop: meterStart,
    transactionStatus: "started",
    startTime: testConfig
      ? testConfig["startDate"]
      : convertDateTimezone(DateTime.utc()),
    chargingSessionDate: testConfig
      ? testConfig["startDate"]
      : convertDateTimezone(DateTime.utc(), "UTC", "yyyy-MM-dd"),
  };

  if (timezone) {
    try {
      if (testConfig) {
        const startTime = DateTime.fromFormat(
          testConfig["startDate"],
          "yyyy-MM-dd HH:mm:ss",
          { zone: "utc" },
        );
        createTransactionData["startTimeLocal"] = convertDateTimezone(
          startTime,
          timezone,
        );
      } else {
        createTransactionData["startTimeLocal"] = convertDateTimezone(
          DateTime.utc(),
          timezone,
        );
      }
    } catch (error) {}
  }

  await OcppTransactionsRepository.update(
    ocppTransactionData?.transactionUuid,
    createTransactionData,
  );

  const responseData = {
    idTagInfo: { status: "Accepted" },
    transactionId: chargerTransactionId,
  };

  // Sending Webhook to whatsapp
  if (
    ocppTransactionData?.startMethod == "WhatsApp" &&
    ocppTransactionData?.customerId
  ) {
    try {
      const customer = await CustomersRepository.findOne({
        where: { id: ocppTransactionData?.customerId },
      });

      await sendSessionStartWebhook({
        mobileNumber: customer?.mobile,
        chargeBoxId: ocppTransactionData?.chargeBoxId,
        sessionId: ocppTransactionData?.transactionUuid,
        status: "started",
        invoicePdfUrl: null,
        refund: null,
      });
    } catch (e) {
      console.log("Error while calling whatsApp Session Start Webhook", e);
    }
  }

  // Save OCPP Logs In Database
  await createOcppTransactionLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  await sendDataToPusher({
    channelName: PusherConstants.channels.PUSHER_NODE_APP,
    eventName: PusherConstants.events.transaction.TRANSACTION_CREATED,
    data: { transactionUuid: ocppTransactionData?.transactionUuid },
  });

  if (ocppTransactionData?.cpoId) {
    await sendDataToPusher({
      channelName: ocppTransactionData.cpoId,
      eventName: PusherConstants.events.transaction.TRANSACTION_CREATED,
      data: { transactionUuid: ocppTransactionData?.transactionUuid },
    });
  }

  return responseData;
};

const handleStatusNotification = async (eventName, clientId, params) => {
  const responseData = {};

  const { status } = params; //refers to charging statuses coming from OCPP charge point

  // Get Charger By Identity
  const charger = await getChargerByIdentity(clientId);
  if (charger) {
    if (charger?.status !== ChargerStatuses.INOPERATIVE) {
      await modifyChargerOnChargingStatusUpdate({
        chargerId: charger.id,
        chargingStatus: status,
      });

      if (charger.chargingStatus !== status) {
        await sendChargerUpdatedPusherEvent(charger.id);
      }
    }
  }
  const cancelCheckStatus = [
    ChargingStatuses.SUSPENDED_EVSE,
    ChargingStatuses.SUSPENDED_EV,
    ChargingStatuses.FAULTED,
  ];
  if (cancelCheckStatus.includes(status)) {
    await ChargerBookingsRepository.update(
      { chargeBoxId: charger.chargeBoxId, isFinished: false },
      { isFinished: true },
    );
  }

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleStopTransaction = async (eventName, clientId, params) => {
  const charger = await getChargerByIdentity(clientId);
  if (!charger) {
    return { idTagInfo: { status: "Invalid" } };
  }

  const testConfig = await TestingConfigurationRepository.findOne({
    where: {
      chargeBoxId: charger["chargeBoxId"],
    },
    select: ["endDate", "meterStop"],
  });

  if (testConfig) {
    // change the status in testing configuration table
    await TestingConfigurationRepository.update(
      { chargeBoxId: charger["chargeBoxId"] },
      { status: "DONE" },
    );
    const meterStop = testConfig["meterStop"];
    params["meterStop"] = meterStop;
  }

  if (
    charger?.status == ChargerStatuses.INOPERATIVE ||
    charger?.status == ChargerStatuses.DISABLED
  ) {
    return { idTagInfo: { status: "Invalid" } };
  }

  await modifyChargerOnChargingStatusUpdate({
    chargerId: charger.id,
    chargingStatus: ChargingStatuses.FINISHING,
  });

  const chargerTransactionId = params.transactionId;
  const transactionData = await OcppTransactionsRepository.findOne({
    where: {
      chargerTransactionId,
      chargeBoxId: charger.chargeBoxId,
    },
  });

  if (transactionData) {
    const transactionUuid = transactionData.transactionUuid;

    const updateTransactionData = { isFinished: true };
    if (transactionData?.endTime == null) {
      updateTransactionData["endTime"] = testConfig
        ? testConfig["endDate"]
        : convertDateTimezone(DateTime.fromISO(params.timestamp));

      try {
        if (testConfig) {
          const stopTime = DateTime.fromFormat(
            testConfig["endDate"],
            "yyyy-MM-dd HH:mm:ss",
            { zone: "utc" },
          );
          updateTransactionData["endTimeLocal"] = convertDateTimezone(
            stopTime,
            transactionData?.timezone ?? "UTC",
          );
        } else {
          updateTransactionData["endTimeLocal"] = convertDateTimezone(
            DateTime.fromISO(params.timestamp),
            transactionData?.timezone ?? "UTC",
          );
        }
      } catch (error) {}
    }

    await OcppTransactionsRepository.update(
      transactionUuid,
      updateTransactionData,
    );

    // const updatedTransaction = await OcppTransactionsRepository.findOne({
    //   where: { transactionUuid },
    // });

    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: PusherConstants.events.transaction.TRANSACTION_UPDATED,
      data: { transactionUuid },
    });

    if (transactionData?.cpoId) {
      await sendDataToPusher({
        channelName: transactionData.cpoId,
        eventName: PusherConstants.events.transaction.TRANSACTION_UPDATED,
        data: { transactionUuid },
      });
    }

    let makePayment = true;
    if (["Local", "Remote"].includes(params?.reason)) {
      makePayment = false;
    }

    if (params?.reason == "Remote") {
      if (transactionData?.isPreauthReached == true) {
        makePayment = true;
      }
    }

    // Send Data Transfer Queue
    await OcppStopTransactionQueue.add(
      { transactionUuid, makePayment },
      { delay: 500 },
    );

    await OcppCalculateAvgChargingRateQueue.add(
      { transactionUuid },
      { delay: 500 },
    );
  }

  const responseData = { idTagInfo: { status: "Accepted" } };

  // Save OCPP Logs In Database
  await createOcppTransactionLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleUnlockConnector = async (eventName, clientId, params) => {
  const responseData = { status: "Unlocked" };

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleGetDiagnostics = async (eventName, clientId, params) => {
  const responseData = { fileName: "diagnostics.txt" };

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleDiagnosticsStatusNotification = async (
  eventName,
  clientId,
  params,
) => {
  const responseData = {};

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleFirmwareStatusNotification = async (
  eventName,
  clientId,
  params,
) => {
  const responseData = {};

  try {
    const charger = await getChargerByIdentity(clientId);
    const chargerOtaUpdate = await OtaUpdatesChargersRepository.findOne({
      where: { chargerId: charger.id },
      order: { createdAt: "DESC" },
    });

    if (chargerOtaUpdate) {
      await OtaUpdatesChargersRepository.update(chargerOtaUpdate.id, {
        status: params.status,
      });

      const allOtaUpdateChargers = await OtaUpdatesChargersRepository.find({
        where: { otaUpdateId: chargerOtaUpdate.otaUpdateId },
      });

      let installedCount = 0;
      let failedCount = 0;
      let inProgressCount = 0;
      let createdCount = 0;

      allOtaUpdateChargers.forEach((chargerUpdate) => {
        const status = chargerUpdate.status;

        if (status === "Installed") {
          installedCount++;
        } else if (
          status === "InstallationFailed" ||
          status === "DownloadFailed"
        ) {
          failedCount++;
        } else if (
          status === "Downloading" ||
          status === "Installing" ||
          status === "Downloaded" ||
          status === "Sent"
        ) {
          inProgressCount++;
        } else if (
          status === "Created" ||
          status === "Idle" ||
          status === "Skipped"
        ) {
          createdCount++;
        }
      });

      const totalChargers = allOtaUpdateChargers.length;
      let otaUpdateStatus = "Created";

      if (installedCount === totalChargers) {
        otaUpdateStatus = "Completed";
      } else if (installedCount > 0 || failedCount > 0) {
        if (inProgressCount === 0 && createdCount === 0) {
          otaUpdateStatus = "Partially-Completed";
        } else {
          otaUpdateStatus = "In-Progress";
        }
      } else if (inProgressCount > 0) {
        otaUpdateStatus = "In-Progress";
      }

      await OtaUpdatesRepository.update(chargerOtaUpdate.otaUpdateId, {
        status: otaUpdateStatus,
      });
    }
  } catch (error) {
    console.log("Error in handleFirmwareStatusNotification", error);
  }

  //Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleGetLocalListVersion = async (eventName, clientId, params) => {
  const responseData = { listVersion: 1 };

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleCancelReservation = async (eventName, clientId, params) => {
  const responseData = { status: "Accepted" };

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleReserveNow = async (eventName, clientId, params) => {
  const responseData = { status: "Accepted" };

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleClearChargingProfile = async (eventName, clientId, params) => {
  const responseData = { status: "Accepted" };

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleGetCompositeSchedule = async (eventName, clientId, params) => {
  const responseData = { status: "Accepted" };

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleSetChargingProfile = async (eventName, clientId, params) => {
  const responseData = { status: "Accepted" };

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleTriggerMessage = async (eventName, clientId, params) => {
  const responseData = { status: "Accepted" };

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

const handleLogStatusNotification = async (eventName, clientId, params) => {
  const responseData = { status: "Uploaded" };

  // Save OCPP Logs In Database
  await createOcppLog({
    clientId,
    eventName,
    ocppSchema: params,
    requestFrom: OcppSource.CHARGER,
    responseData,
    responseFrom: OcppSource.SERVER,
  });

  return responseData;
};

module.exports = {
  handleEvent,
};
