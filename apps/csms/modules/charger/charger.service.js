const {
  ChargerStatuses,
  ExpireTimeConstants,
  customErrorMsg,
  PusherConstants,
  EmailConstants,
  ConnectedChargerStatuses,
  ChargingStatuses,
  ValidTimezones,
  NotificationTypes,
  OcppEvents,
} = require("@shared-libs/constants");
const {
  ChargerRepository,
  ChargerConnectorTypeRepository,
  EvseStationRepository,
  ChargerConnectorMappingRepository,
  ChargerMeterValuesRepository,
  ChargerUsageTypeRepository,
  ChargerOcppConfigRepository,
  ChargerMeteringConfigRepository,
  CpoRepository,
  CpoUserViewRepository,
  OcppTransactionsRepository,
  ChargerExperienceFeedbackRepository,
  ChargerVersionRepository,
  ChargerPaymentConfigRepository,
  FeedbackCannedMessagesRepository,
  ChargerLanguageRepository,
  ChargerViewRepository,
  ChargerConstantsRepository,
  ChargingInvoiceRepository,
  ContractChargerViewRepository,
} = require("@shared-libs/db/mysql");
const { sendDataToPusher } = require("@shared-libs/pusher");
const {
  EmailQueue,
  OcppGetConfigurationQueue,
} = require("@shared-libs/queues");
const { DateTime } = require("luxon");
const {
  generateChargeBoxId,
  generateRandomOtp,
  formatSerialNumber,
  getIpData,
  getChargerByIdentity,
  getBaseRateAndLocationByCharger,
  getConfigConstants,
  getSubscriptionUsage,
  convertDateTimezone,
  ObjectDAO,
  getChargingCalculation,
  getChargerDetailsData,
  getChargerCountForDashboard,
  getChargerDataForLocationsMap,
  formatRawMeterValues,
  updateChargerLatLngByEvseStationId,
  sendChargerUpdatedPusherEvent,
  getChargerLanguageByConnectorId,
  getTranslation,
  getChargerConstants,
  getChargerContract,
  getChargerCards,
  generateChargerAuthCodes,
  replaceStringWithVariables,
  arrayObjStr,
  sendOcppEvent,
} = require("@shared-libs/helpers");
const { default: axios } = require("axios");
const { In, Not, IsNull, Like } = require("typeorm");
const { HandleMySqlList, HandleMongoDBList } = require("@shared-libs/db");
const {
  ChargerRapidLogsModel,
  OcppLogModel,
  OcppBootNotificationLogModel,
  OcppHeartbeatLogModel,
  OcppMeterValueLogModel,
  OcppTransactionLogModel,
  OcppAllLogModel,
  ChargerConfigurationModel,
} = require("@shared-libs/db/mongo-db");

const geolib = require("geolib");
const { getDynamicHtml } = require("@shared-libs/email");
const { saveNotification } = require("@shared-libs/notification");
const {
  generateLittlepayCertificates,
} = require("@shared-libs/littlepay-helper");
const { getPartnerAccessData } = require("../auth/auth.service");
const {
  ConfigurationTypeMap,
} = require("@shared-libs/constants/configurations-type-map");

const arePointsWithinDistance = (lat1, lng1, lat2, lng2, distance) => {
  try {
    const distanceBetweenPoints = geolib.getDistance(
      { latitude: lat1, longitude: lng1 },
      { latitude: lat2, longitude: lng2 },
    );

    // return distanceBetweenPoints <= distance;
    return true;
  } catch (error) {
    return true;
  }
};

const registerCharger = async (payload, req, res) => {
  const { chargerModel, connectorTypeId, country } = payload;
  let { serialNumber } = payload;
  serialNumber = serialNumber.replace(/-/g, "");

  const loggedInUserId = req["loggedInUserData"]["user"]["id"];

  const connectorType = await ChargerConnectorTypeRepository.findOne({
    where: { id: connectorTypeId },
  });

  const chargeUsageType = await ChargerUsageTypeRepository.findOne({
    where: { mappingText: "public" },
  });

  const chargerCreatePayload = {
    serialNumber,
    chargerModel,
    connectorTypeId,
    energyMeter: "",
    paymentModule: "IDTech",
    country,
    chargingMode: "Online",
    chargeUsageTypeId: chargeUsageType.id,
    deviceAdminPassCode: generateRandomOtp(6),
    activationCode: generateRandomOtp(6),
    registeredBy: loggedInUserId,
    registeredAt: DateTime.utc().toISO(),
    registeredAtLocal: convertDateTimezone(DateTime.utc()),
  };

  if (country) {
    const { manufacturerInitials, chargerModelPrime } =
      await getConfigConstants(["manufacturerInitials", "chargerModelPrime"]);

    const generateChargeBoxIdConfig = {
      manufacturerInitials,
      chargerModelPrime,
      country,
      registeredAt: chargerCreatePayload.registeredAt,
      registeredAtLocal: convertDateTimezone(chargerCreatePayload.registeredAt),
    };

    const { chargeBoxId, uniqueId, timezone } = await generateChargeBoxId(
      generateChargeBoxIdConfig,
    );

    chargerCreatePayload["chargeBoxId"] = chargeBoxId;
    chargerCreatePayload["uniqueId"] = uniqueId;
    chargerCreatePayload["timezone"] = timezone;
    chargerCreatePayload["country"] = country;
  }

  const createdCharger = await ChargerRepository.save(chargerCreatePayload);
  if (createdCharger?.id) {
    const chargerOcppConfigData = await ChargerOcppConfigRepository.findOne({
      where: { chargerId: createdCharger.id },
    });
    if (!chargerOcppConfigData?.id) {
      await ChargerOcppConfigRepository.save({ chargerId: createdCharger.id });
    }
  }

  const chargerCreatedData = await ChargerRepository.findOne({
    where: { id: createdCharger.id },
    relations: ["connectorTypeId"],
  });

  const registerChargerDataForPusher = {
    serialNumber: chargerCreatedData.serialNumber,
    timestamp: DateTime.now().toISO(),
  };

  await sendDataToPusher({
    channelName: PusherConstants.channels.PUSHER_NODE_APP,
    eventName: PusherConstants.events.charger.CHARGER_REGISTERED,
    data: registerChargerDataForPusher,
  });

  await saveNotification({
    data: registerChargerDataForPusher,
    type: NotificationTypes.CHARGER_REGISTERED,
  });

  res.status(201).json(chargerCreatedData);
};

const assignCpoAndEvseStation = async (chargerId, req, res) => {
  try {
    const charger = await ChargerRepository.findOne({
      where: { id: chargerId, isDeleted: false },
    });

    if (!charger) {
      return res
        .status(404)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const { cpoId, evseStationId } = req.body;
    const cpo = await CpoRepository.findOne({
      where: { id: cpoId, isDeleted: false },
    });

    if (!cpo) {
      return res.status(404).json({ message: "CPO Not Found" });
    }

    if (!charger?.cpoId !== cpoId) {
      // Check Subscription Limit
      let subscriptionUsage = await getSubscriptionUsage(cpoId);
      subscriptionUsage = subscriptionUsage?.chargers;

      if (subscriptionUsage?.limit - subscriptionUsage?.used <= 0) {
        return res.status(400).json({
          message: "CPO Has Exceeded The Limit Of Assigning Chargers.",
        });
      }
    }

    const evseStation = await EvseStationRepository.findOne({
      where: { id: evseStationId, isDeleted: false, cpoId },
    });

    if (!evseStation) {
      return res.status(404).json({ message: "Evse Station Not Found" });
    }

    const activationCode = charger.activationCode
      ? charger.activationCode
      : generateRandomOtp(6);

    const updateChargerPayload = {
      evseStationId,
      cpoId,
      activationCode,
      activationExpiresAt: DateTime.utc()
        .plus({ day: ExpireTimeConstants.CHARGER_ACTIVATION_CODE })
        .toISO(),
      activationRequestedAt: DateTime.utc().toISO(),
    };

    if (!charger.chargeBoxId && cpo.country) {
      const { manufacturerInitials, chargerModelPrime } =
        await getConfigConstants(["manufacturerInitials", "chargerModelPrime"]);

      const generateChargeBoxIdConfig = {
        manufacturerInitials,
        chargerModelPrime,
        country: cpo.country,
        registeredAt: charger.registeredAt,
        registeredAtLocal: convertDateTimezone(charger.registeredAt),
      };

      const { chargeBoxId, uniqueId, timezone, country } =
        await generateChargeBoxId(generateChargeBoxIdConfig);

      updateChargerPayload["chargeBoxId"] = chargeBoxId;
      updateChargerPayload["uniqueId"] = uniqueId;
      updateChargerPayload["timezone"] = timezone;
      updateChargerPayload["country"] = country;
    }

    await ChargerRepository.update(chargerId, updateChargerPayload);

    await getBaseRateAndLocationByCharger(chargerId, {}, true);

    const updatedCharger = await ChargerRepository.findOne({
      where: { id: chargerId, isDeleted: false },
    });

    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: PusherConstants.events.charger.CHARGER_ASSIGNED,
      data: {
        cpoId,
        chargerId: updatedCharger.id,
        chargeBoxId: updatedCharger.chargeBoxId,
        serialNumber: updatedCharger.serialNumber,
      },
    });

    await sendDataToPusher({
      channelName: cpoId,
      eventName: PusherConstants.events.charger.CHARGER_ASSIGNED,
      data: {
        cpoId,
        chargerId: updatedCharger.id,
        chargeBoxId: updatedCharger.chargeBoxId,
        serialNumber: updatedCharger.serialNumber,
      },
    });

    await saveNotification({
      cpoId,
      data: {
        cpoId,
        evseStationId,
        chargerId: updatedCharger.id,
        chargeBoxId: updatedCharger.chargeBoxId,
        serialNumber: updatedCharger.serialNumber,
      },
      type: NotificationTypes.CHARGER_ASSIGNED_TO_CPO,
    });

    await saveNotification({
      cpoId,
      data: {
        cpoId,
        evseStationId,
        chargerId: updatedCharger.id,
        chargeBoxId: updatedCharger.chargeBoxId,
        serialNumber: updatedCharger.serialNumber,
      },
      type: NotificationTypes.CHARGER_ASSIGNED_TO_EVSE,
    });

    const cpoAdminUsers = await CpoUserViewRepository.find({
      where: { cpoId, cpoUserRoleCode: "cpo_admin" },
      select: ["email"],
    });

    const toEmails = cpoAdminUsers.map(({ email }) => email);

    const { html, data } = await getDynamicHtml({
      htmlTemplatePath: "/templates/charger-activation.html",
      data: {
        serialNumber: await formatSerialNumber(updatedCharger.serialNumber),
        deviceAdminPassCode: updatedCharger.deviceAdminPassCode,
        activationCode,
      },
    });

    // Send email: Charger Activation
    await EmailQueue.add({
      to: toEmails,
      subject: EmailConstants.subject.CHARGER_ACTIVATION,
      html,
      templateData: data,
    });

    res.status(200).json(updatedCharger);
  } catch (error) {
    console.error("Error assigning cpo to charger:", error);
    res.status(500).json({ message: "An Error Occurred." });
  }
};

const assignCpo = async (chargerId, req, res) => {
  try {
    const charger = await ChargerRepository.findOne({
      where: { id: chargerId, isDeleted: false },
    });

    if (!charger) {
      return res
        .status(404)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const { cpoId } = req.body;
    const cpo = await CpoRepository.findOne({
      where: { id: cpoId, isDeleted: false },
    });

    if (!cpo) {
      return res.status(404).json({ message: "CPO Not Found" });
    }

    if (!charger?.cpoId !== cpoId) {
      // Check Subscription Limit
      let subscriptionUsage = await getSubscriptionUsage(cpoId);
      subscriptionUsage = subscriptionUsage?.chargers;

      if (subscriptionUsage?.limit - subscriptionUsage?.used <= 0) {
        return res.status(400).json({
          message: "CPO Has Exceeded The Limit Of Assigning Chargers.",
        });
      }
    }

    const activationCode = charger.activationCode
      ? charger.activationCode
      : generateRandomOtp(6);

    const updateChargerPayload = {
      cpoId,
      activationCode,
      activationExpiresAt: DateTime.utc()
        .plus({ day: ExpireTimeConstants.CHARGER_ACTIVATION_CODE })
        .toISO(),
      activationRequestedAt: DateTime.utc().toISO(),
    };

    if (!charger.chargeBoxId && cpo.country) {
      const { manufacturerInitials, chargerModelPrime } =
        await getConfigConstants(["manufacturerInitials", "chargerModelPrime"]);

      const generateChargeBoxIdConfig = {
        manufacturerInitials,
        chargerModelPrime,
        country: cpo.country,
        registeredAt: charger.registeredAt,
        registeredAtLocal: convertDateTimezone(charger.registeredAt),
      };

      const { chargeBoxId, uniqueId, timezone, country } =
        await generateChargeBoxId(generateChargeBoxIdConfig);
      // update the charger connector type according to cpo Country
      const connectorTypeId = await getConnctorTypeIdByCpoCountry(cpo.country);
      updateChargerPayload["connectorTypeId"] = connectorTypeId;
      updateChargerPayload["chargeBoxId"] = chargeBoxId;
      updateChargerPayload["uniqueId"] = uniqueId;
      updateChargerPayload["timezone"] = timezone;
      updateChargerPayload["country"] = country;
    }

    await ChargerRepository.update(chargerId, updateChargerPayload);

    const updatedCharger = await ChargerRepository.findOne({
      where: { id: chargerId, isDeleted: false },
    });

    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: PusherConstants.events.charger.CHARGER_ASSIGNED,
      data: {
        cpoId,
        chargerId: updatedCharger.id,
        chargeBoxId: updatedCharger.chargeBoxId,
        serialNumber: updatedCharger.serialNumber,
      },
    });

    await sendDataToPusher({
      channelName: cpoId,
      eventName: PusherConstants.events.charger.CHARGER_ASSIGNED,
      data: {
        cpoId,
        chargerId: updatedCharger.id,
        chargeBoxId: updatedCharger.chargeBoxId,
        serialNumber: updatedCharger.serialNumber,
      },
    });

    await saveNotification({
      cpoId,
      data: {
        cpoId,
        chargerId: updatedCharger.id,
        chargeBoxId: updatedCharger.chargeBoxId,
        serialNumber: updatedCharger.serialNumber,
      },
      type: NotificationTypes.CHARGER_ASSIGNED_TO_CPO,
    });

    const cpoAdminUsers = await CpoUserViewRepository.find({
      where: { cpoId, cpoUserRoleCode: "cpo_admin" },
      select: ["email"],
    });

    const toEmails = cpoAdminUsers.map(({ email }) => email);

    const { html, data } = await getDynamicHtml({
      htmlTemplatePath: "/templates/charger-activation.html",
      data: {
        serialNumber: await formatSerialNumber(updatedCharger.serialNumber),
        deviceAdminPassCode: updatedCharger.deviceAdminPassCode,
        activationCode,
      },
    });

    // Send email: Charger Activation
    await EmailQueue.add({
      to: toEmails,
      subject: EmailConstants.subject.CHARGER_ACTIVATION,
      html,
      templateData: data,
    });

    res.status(200).json(updatedCharger);
  } catch (error) {
    console.error("Error assigning cpo to charger:", error);
    res.status(500).json({ message: "An Error Occurred." });
  }
};

const assignCpoBulk = async (chargerIds, req, res) => {
  try {
    const chargers = await ChargerRepository.find({
      where: { id: chargerIds },
    });
    const existingIds = chargers.map((entry) => entry.id);
    // Find missing IDs
    const missingIds = chargerIds.filter((id) => !existingIds.includes(id));
    if (missingIds.length > 0) {
      return res.status(200).json({
        success: false,
        message: `Chargers not found for ID: ${JSON.stringify(missingIds)}`,
      });
    }
    const { cpoId } = req.body;
    const cpo = await CpoRepository.findOne({
      where: { id: cpoId, isDeleted: false },
    });

    if (!cpo) {
      return res.status(404).json({ message: "CPO Not Found" });
    }
    const updatedChargers = [];
    await Promise.all(
      chargers.map(async (charger) => {
        if (!charger?.cpoId !== cpoId) {
          // Check Subscription Limit
          let subscriptionUsage = await getSubscriptionUsage(cpoId);
          subscriptionUsage = subscriptionUsage?.chargers;

          if (subscriptionUsage?.limit - subscriptionUsage?.used <= 0) {
            return res.status(400).json({
              message: "CPO Has Exceeded The Limit Of Assigning Chargers.",
            });
          }
        }

        const activationCode = charger.activationCode
          ? charger.activationCode
          : generateRandomOtp(6);

        const updateChargerPayload = {
          cpoId,
          activationCode,
          activationExpiresAt: DateTime.utc()
            .plus({ day: ExpireTimeConstants.CHARGER_ACTIVATION_CODE })
            .toISO(),
          activationRequestedAt: DateTime.utc().toISO(),
        };

        if (!charger.chargeBoxId && cpo.country) {
          const { manufacturerInitials, chargerModelPrime } =
            await getConfigConstants([
              "manufacturerInitials",
              "chargerModelPrime",
            ]);

          const generateChargeBoxIdConfig = {
            manufacturerInitials,
            chargerModelPrime,
            country: cpo.country,
            registeredAt: charger.registeredAt,
            registeredAtLocal: convertDateTimezone(charger.registeredAt),
          };

          const { chargeBoxId, uniqueId, timezone, country } =
            await generateChargeBoxId(generateChargeBoxIdConfig);
          // update the charger connector type according to cpo Country
          const connectorTypeId = await getConnctorTypeIdByCpoCountry(
            cpo.country,
          );
          updateChargerPayload["connectorTypeId"] = connectorTypeId;
          updateChargerPayload["chargeBoxId"] = chargeBoxId;
          updateChargerPayload["uniqueId"] = uniqueId;
          updateChargerPayload["timezone"] = timezone;
          updateChargerPayload["country"] = country;
        }
        await ChargerRepository.update(charger.id, updateChargerPayload);

        const updatedCharger = await ChargerRepository.findOne({
          where: { id: charger.id, isDeleted: false },
        });
        updatedChargers.push(ObjectDAO(updatedCharger));

        await sendDataToPusher({
          channelName: PusherConstants.channels.PUSHER_NODE_APP,
          eventName: PusherConstants.events.charger.CHARGER_ASSIGNED,
          data: {
            cpoId,
            chargerId: updatedCharger.id,
            chargeBoxId: updatedCharger.chargeBoxId,
            serialNumber: updatedCharger.serialNumber,
          },
        });

        await sendDataToPusher({
          channelName: cpoId,
          eventName: PusherConstants.events.charger.CHARGER_ASSIGNED,
          data: {
            cpoId,
            chargerId: updatedCharger.id,
            chargeBoxId: updatedCharger.chargeBoxId,
            serialNumber: updatedCharger.serialNumber,
          },
        });

        await saveNotification({
          cpoId,
          data: {
            cpoId,
            chargerId: updatedCharger.id,
            chargeBoxId: updatedCharger.chargeBoxId,
            serialNumber: updatedCharger.serialNumber,
          },
          type: NotificationTypes.CHARGER_ASSIGNED_TO_CPO,
        });

        const cpoAdminUsers = await CpoUserViewRepository.find({
          where: { cpoId, cpoUserRoleCode: "cpo_admin" },
          select: ["email"],
        });

        const toEmails = cpoAdminUsers.map(({ email }) => email);

        const { html, data } = await getDynamicHtml({
          htmlTemplatePath: "/templates/charger-activation.html",
          data: {
            serialNumber: await formatSerialNumber(updatedCharger.serialNumber),
            deviceAdminPassCode: updatedCharger.deviceAdminPassCode,
            activationCode,
          },
        });

        // Send email: Charger Activation
        await EmailQueue.add({
          to: toEmails,
          subject: EmailConstants.subject.CHARGER_ACTIVATION,
          html,
          templateData: data,
        });
      }),
    );

    res.status(200).json(updatedChargers);
  } catch (error) {
    console.error("Error assigning cpo to charger:", error);
    res.status(500).json({ message: "An Error Occurred." });
  }
};

const getConnctorTypeIdByCpoCountry = async (countryIso) => {
  if (!countryIso || countryIso != "IN") {
    const default_connector = await ChargerConnectorTypeRepository.findOne({
      where: { mappingText: "type_1" },
      select: ["id"],
    });
    return default_connector.id;
  }
  const connector = await ChargerConnectorTypeRepository.findOne({
    where: { mappingText: "type_2" },
    select: ["id"],
  });
  return connector.id;
};

const assignEvseStation = async (chargerId, req, res) => {
  try {
    const charger = await ChargerRepository.findOne({
      where: { id: chargerId, isDeleted: false },
    });

    if (!charger) {
      return res
        .status(404)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const { evseStationId } = req.body;
    const evseStation = await EvseStationRepository.findOne({
      where: { id: evseStationId, isDeleted: false },
    });

    if (!evseStation) {
      return res.status(404).json({ message: "Evse Station Not Found" });
    }

    const updateChargerPayload = { evseStationId };
    await ChargerRepository.update(chargerId, updateChargerPayload);

    await getBaseRateAndLocationByCharger(chargerId, {}, true);

    const updatedCharger = await ChargerRepository.findOne({
      where: { id: chargerId, isDeleted: false },
    });

    await saveNotification({
      cpoId: updatedCharger?.cpoId,
      data: {
        cpoId: updatedCharger?.cpoId,
        evseStationId,
        chargerId: updatedCharger.id,
        chargeBoxId: updatedCharger.chargeBoxId,
        serialNumber: updatedCharger.serialNumber,
      },
      type: NotificationTypes.CHARGER_ASSIGNED_TO_EVSE,
    });

    res.status(200).json(updatedCharger);
  } catch (error) {
    console.error("Error assigning evseStation to charger:", error);
    res.status(500).json({
      message: "An Error Occurred While Assigning Evse Station To Charger.",
    });
  }
};

const assignEvseStationBulk = async (chargerIds, req, res) => {
  try {
    const chargers = await ChargerRepository.find({
      where: { id: In(chargerIds) },
    });
    const existingIds = chargers.map((entry) => entry.id);
    // Find missing IDs
    const missingIds = chargerIds.filter((id) => !existingIds.includes(id));
    if (missingIds.length > 0) {
      return res.status(200).json({
        success: false,
        message: `Chargers not found for ID: ${JSON.stringify(missingIds)}`,
      });
    }

    const { evseStationId } = req.body;
    const evseStation = await EvseStationRepository.findOne({
      where: { id: evseStationId, isDeleted: false },
    });

    if (!evseStation) {
      return res.status(404).json({ message: "Evse Station Not Found" });
    }
    const updatedChargers = [];
    await Promise.all(
      chargers.map(async (charger) => {
        const updateChargerPayload = { evseStationId };
        await ChargerRepository.update(charger.id, updateChargerPayload);

        await getBaseRateAndLocationByCharger(charger.id, {}, true);

        const updatedCharger = await ChargerRepository.findOne({
          where: { id: charger.id, isDeleted: false },
        });
        updatedChargers.push(ObjectDAO(updatedCharger));

        await saveNotification({
          cpoId: updatedCharger?.cpoId,
          data: {
            cpoId: updatedCharger?.cpoId,
            evseStationId,
            chargerId: updatedCharger.id,
            chargeBoxId: updatedCharger.chargeBoxId,
            serialNumber: updatedCharger.serialNumber,
          },
          type: NotificationTypes.CHARGER_ASSIGNED_TO_EVSE,
        });
      }),
    );

    res.status(200).json(updatedChargers);
  } catch (error) {
    console.error("Error assigning evseStation to charger:", error);
    res.status(500).json({
      message: "An Error Occurred While Assigning Evse Station To Charger.",
    });
  }
};

const getChargerList = async (deleted = false, req, res) => {
  try {
    const { location, partnerType, partnerId = null } = req.query;
    const loggedInUserData = req["loggedInUserData"]["user"];
    const loggedInUserRole = req["loggedInUserData"]["userRole"];

    let baseQuery = { isDeleted: deleted };

    const { isPartner, isPartnerTeam } = req?.loggedInUserData;

    let partnerChargerIds = [];

    if (isPartner || isPartnerTeam) {
      const { chargerIds = [] } = req?.allowedIds;

      if (chargerIds.length == 0) {
        return res.status(200).json({
          list: [],
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        });
      }

      baseQuery["id"] = {
        custom: true,
        value: `in("${chargerIds.join('", "')}")`,
      };
      partnerChargerIds = chargerIds;

      req.query["commissioned"] = true;
    } else {
      if (loggedInUserRole == "factory_manager") {
        baseQuery["registeredBy"] = loggedInUserData.id;
      }

      if (partnerId) {
        const { data: allowedIds } = await getPartnerAccessData(partnerId);

        const { chargerIds = [] } = allowedIds;

        if (chargerIds.length == 0) {
          return res.status(200).json({
            list: [],
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
          });
        }

        partnerChargerIds = chargerIds;

        baseQuery["id"] = {
          custom: true,
          value: `in("${chargerIds.join('", "')}")`,
        };

        req.query["commissioned"] = true;
      }
    }

    if (partnerType == "CPO") {
      baseQuery["contractCpoId"] = {
        custom: true,
        value: `IS NOT NULL`,
      };
    } else if (partnerType == "Site Host") {
      baseQuery["contractSiteHostId"] = {
        custom: true,
        value: `IS NOT NULL`,
      };
    } else if (partnerType == "Investor") {
      baseQuery["investorUserNames"] = {
        custom: true,
        value: `IS NOT NULL`,
      };
    }

    // check the query to send the specific listing
    let filter = req.query["filter"];
    if (!filter) {
      filter = {};
    } else {
      filter = JSON.parse(filter);
      if (filter["contractId"]) {
        let tmpWh = { contractId: filter["contractId"] };
        if (partnerChargerIds.length > 0) {
          tmpWh = {
            contractId: filter["contractId"],
            chargerId: In(partnerChargerIds),
          };
        }
        const contractChargers = await ContractChargerViewRepository.find({
          where: tmpWh,
        });
        if (contractChargers?.length == 0) {
          return res.status(200).json({
            list: [],
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
          });
        }

        delete filter["contractId"];
        baseQuery["id"] = {
          custom: true,
          value: `in("${contractChargers
            .map((d) => {
              return d.chargerId;
            })
            .join('", "')}")`,
        };
      }

      if (filter["status"]) {
        if (filter["status"] == "In-Use") {
          filter["status"] = "busy";
        }
        if (filter["status"] == "Available") {
          filter["status"] = ["available", "activated"];
        }
        if (filter["status"] == "Offline") {
          filter["status"] = "offline";
        }
        if (filter["status"] == "Error") {
          filter["status"] = "in-operative";
        }
      }
      if (filter?.startDate && filter?.endDate) {
        const startDateTime = `${filter.startDate} 00:00:00`;
        const endDateTime = `${filter.endDate} 23:59:59`;

        if (deleted) {
          baseQuery["deletedAt"] = {
            custom: true,
            value: `BETWEEN "${startDateTime}" AND "${endDateTime}"`,
          };
        } else {
          baseQuery["createdAt"] = {
            custom: true,
            value: `BETWEEN "${startDateTime}" AND "${endDateTime}"`,
          };
        }

        delete filter.startDate;
        delete filter.endDate;
      }
    }

    const is_commissioned = req.query["commissioned"];

    if (is_commissioned == "true") {
      if (!filter["status"]) {
        baseQuery["partnerId"] = {
          custom: true,
          value: "IS NOT NULL",
        };
      }
      baseQuery["isConfigured"] = true;
    }
    if (is_commissioned == "false") {
      baseQuery["isConfigured"] = false;
      // filter["status"] = "registered";
      // baseQuery["partnerId"] = {
      //   custom: true,
      //   value: "IS NULL",
      // };
    }
    if (filter != {}) {
      req.query["filter"] = JSON.stringify({ ...filter });
    }

    const listParams = {
      entityName: "ChargerView",
      baseQuery,
      req,
    };

    const chargerListResponse = await HandleMySqlList(listParams);
    const detailedChargers = await Promise.all(
      chargerListResponse.list.map(async (charger) => {
        const [chargerInfo, chargerData] = await Promise.all([
          ChargerViewRepository.findOne({
            where: {
              id: charger.id,
            },
          }),
          getChargerDetailsData(charger.id, true),
        ]);

        if (chargerData?.meteringConfig) {
          chargerData.meteringConfig["emModelName"] = chargerData
            .meteringConfig["emModelName"]
            ? chargerData.meteringConfig["emModelName"]?.replace(/\.json$/, "")
            : "";
        }

        return { ...chargerInfo, ...chargerData };
      }),
    );
    chargerListResponse.list = detailedChargers;

    res.status(200).json(chargerListResponse);
  } catch (error) {
    console.error("Error getting deleted chargers:", error);
    res.status(500).json({
      message: "An Error Occurred While Getting Deleted Chargers",
    });
  }
};

const getStatusList = async (req, res) => {
  try {
    // const statusList = [
    //   "Generated",
    //   "Registered",
    //   "Activated",
    //   "Available",
    //   "Busy",
    //   "Offline",
    //   "Disabled",
    //   "In-operative",
    // ];

    const statusList = ["Available", "Offline", "In-Use", "Error"];
    return res.status(200).json({ status: statusList });
  } catch (error) {
    console.log("Error while getting status list!");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getChargersOverview = async (req, res) => {
  try {
    const { loggedInUserData } = req;
    const { evseStationId, location, filter } = req.query;
    let allowedEvseStations = [];

    let baseQuery = { isDeleted: false };

    const { isPartner, isPartnerTeam } = req?.loggedInUserData;

    if (isPartner || isPartnerTeam) {
      const { evseStationIds = [] } = req?.allowedIds;

      if (evseStationId) {
        if (!evseStationIds.includes(evseStationId)) {
          return res
            .status(400)
            .json({ message: customErrorMsg.station.EVSE_STATION_NOT_FOUND });
        }
        allowedEvseStations = [evseStationId];
      } else {
        if (evseStationIds.length == 0) {
          return res.status(200).json({
            available: 0,
            "in-use": 0,
            error: 0,
            maintenance: 0,
            offline: 0,
            totalCount: 0,
          });
        }

        allowedEvseStations = evseStationIds;
      }
    } else if (loggedInUserData?.isCpo) {
      if (evseStationId) {
        const evseStation = await EvseStationRepository.findOne({
          where: { cpoId: loggedInUserData.user?.cpoId, id: evseStationId },
          select: ["id"],
        });
        if (!evseStation) {
          return res
            .status(400)
            .json({ success: false, message: "Evse Station Not Found!" });
        }
        allowedEvseStations = [evseStationId];
      } else {
        const evseStations = await EvseStationRepository.find({
          where: {
            cpoId: loggedInUserData.user?.cpoId,
            isDeleted: false,
            ...(location && { state: Like(`%${location}%`) }),
          },
          select: ["id"],
        });
        allowedEvseStations = evseStations.map(({ id }) => id);
      }
    } else {
      if (evseStationId) {
        allowedEvseStations = [evseStationId];
      } else {
        const evseStations = await EvseStationRepository.find({
          where: { isDeleted: false, ...(location && { country: location }) },
          select: ["id"],
        });
        allowedEvseStations = evseStations.map(({ id }) => id);
      }
    }

    req.query.select = '["serialNumber", "status", "chargingStatus"]';
    req.query.limit = 900000000; // Get overviews for all chargers

    const statusFilterMapping = {
      available: ["available", "activated"],
      "in-use": ["busy"],
      error: ["in-operative"],
      maintenance: ["disabled"],
      offline: ["offline"],
    };

    if (filter) {
      try {
        const filterObj = JSON.parse(filter);
        if (
          filterObj.status &&
          statusFilterMapping[filterObj.status.toLowerCase()]
        ) {
          filterObj.status =
            statusFilterMapping[filterObj.status.toLowerCase()];
          req.query.filter = JSON.stringify(filterObj);
        } else {
          if (!filterObj.status) {
            filterObj["!status"] = ["registered", "generated"];
          }
          req.query.filter = JSON.stringify(filterObj);
        }
      } catch (error) {
        console.error("Error parsing filter JSON:", error);
      }
    } else {
      const filterObj = {};
      filterObj["!status"] = ["registered", "generated"];
      req.query.filter = JSON.stringify(filterObj);
    }

    baseQuery["evseStationId"] = {
      custom: true,
      value: `in(\"${allowedEvseStations.join('", "')}\")`,
    };

    const chargerListResponse = await HandleMySqlList({
      baseQuery,
      entityName: "Charger",
      req,
    });
    const totalCount = chargerListResponse.totalCount || 0;

    const overviews = {
      available: 0,
      "in-use": 0,
      error: 0,
      maintenance: 0,
      offline: 0,
      totalCount,
    };

    chargerListResponse.list.forEach(({ status }) => {
      for (const [key, values] of Object.entries(statusFilterMapping)) {
        if (values.includes(status)) {
          overviews[key]++;
          return;
        }
      }
      // overviews.offline++;
    });

    res.status(200).json(overviews);
  } catch (error) {
    console.error("Error fetching charger list:", error);
    res.status(500).json({ message: error.message });
  }
};

const mapToDbStatus = (status) => {
  try {
    let updated_status = status;
    if (!Array.isArray(status)) {
      updated_status = [status];
    }
    const mappedStatuses = updated_status.flatMap((status) => {
      switch (status) {
        case "available":
          return ["activated", "available"];
        case "in-use":
          return ["busy"];
        case "error":
          return ["in-operative"];
        case "maintenance":
          return ["disabled"];
        case "offline":
          return ["offline"];
        default:
          return ["activated", "available"];
      }
    });
    return mappedStatuses;
  } catch (error) {
    throw error;
  }
};

const getChargerById = async (chargerId, req, res) => {
  try {
    let charger = await ChargerViewRepository.createQueryBuilder("charger")
      .leftJoinAndSelect("charger.connectorTypeId", "connectorTypeId")
      .leftJoinAndSelect("charger.evseStationId", "evseStationId")
      .leftJoinAndSelect("charger.cpoId", "cpoId")
      .leftJoinAndSelect("charger.chargeUsageTypeId", "chargeUsageTypeId")
      .where("charger.id = :chargerId", {
        chargerId,
      })
      .orWhere("charger.chargeBoxId = :chargerId", {
        chargerId,
      })
      .orWhere("charger.serialNumber = :chargerId", {
        chargerId,
      })
      .getOne();

    if (!charger) {
      return res.status(404).json({ message: "Charger Not Found" });
    }

    charger["cpo"] = ObjectDAO(charger.cpoId);
    charger["evseStation"] = ObjectDAO(charger?.evseStationId);
    charger["connectorType"] = ObjectDAO(charger?.connectorTypeId);
    charger["chargeUsageType"] = ObjectDAO(charger?.chargeUsageTypeId);
    charger["cpoId"] = charger?.cpo?.id;
    charger["evseStationId"] = charger?.evseStation?.id;
    charger["connectorTypeId"] = charger?.connectorType?.id;
    charger["chargeUsageTypeId"] = charger?.chargeUsageType?.id;
    charger["noOfConnectors"] = 1;

    charger["contract"] = await getChargerContract(charger.id);
    charger["cards"] = await getChargerCards(charger.id);

    charger["paymentConfig"] = await ChargerPaymentConfigRepository.findOne({
      where: { chargerId: charger.id },
    });

    // attach version related data in response
    let ocppVersion = await ChargerOcppConfigRepository.findOne({
      where: {
        chargerId: charger.id,
      },
      select: ["ocppVersion"],
    });
    if (!ocppVersion) {
      ocppVersion = { ocppVersion: "1.6.0" };
    }
    let versionData = await ChargerVersionRepository.findOne({
      where: {
        chargerId: charger.id,
      },
      select: [
        "chargerAppVersion",
        "voltCheckVersion",
        "deviceAgentVersion",
        "firmwareVersion",
      ],
    });
    const configConstants = await getConfigConstants([
      "chargerAppVersion",
      "voltCheckVersion",
      "deviceAgentVersion",
      "underVoltageLimitPerPhase",
      "overVoltageLimitPerPhase",
      "underCurrentLimitPerPhase",
      "overCurrentLimitPerPhase",
      "maxCurrentLimitPerPhase",
      "noLoadTimeLimit",
      "chargerCapacity",
    ]);

    const chargerMeteringConfig = await ChargerMeteringConfigRepository.findOne(
      {
        where: {
          chargerId: charger.id,
        },
        select: ["chargerCapacity"],
      },
    );
    if (chargerMeteringConfig) {
      charger["chargerCapacity"] = chargerMeteringConfig["chargerCapacity"];
    } else {
      charger["chargerCapacity"] = configConstants["chargerCapacity"];
    }

    if (!versionData) {
      versionData = {
        chargerAppVersion: configConstants["chargerAppVersion"],
        voltCheckVersion: configConstants["voltCheckVersion"],
        deviceAgentVersion: configConstants["deviceAgentVersion"],
        firmwareVersion: "-",
      };
    }
    versionData["ocppVersion"] = ocppVersion["ocppVersion"];
    charger = { ...charger, ...versionData }; //pending activatedBy field in response

    // add settings data
    let settingsData = await ChargerMeteringConfigRepository.findOne({
      where: {
        chargerId,
      },
      select: [
        "underVoltageLimitPerPhase",
        "overVoltageLimitPerPhase",
        "underCurrentLimitPerPhase",
        "overCurrentLimitPerPhase",
        "maxCurrentLimitPerPhase",
        "noLoadTimeLimit",
      ],
    });
    if (!settingsData) {
      settingsData = {
        underVoltageLimitPerPhase: configConstants["underVoltageLimitPerPhase"],
        overVoltageLimitPerPhase: configConstants["overVoltageLimitPerPhase"],
        underCurrentLimitPerPhase: configConstants["underCurrentLimitPerPhase"],
        overCurrentLimitPerPhase: configConstants["overCurrentLimitPerPhase"],
        maxCurrentLimitPerPhase: configConstants["maxCurrentLimitPerPhase"],
        noLoadTimeLimit: configConstants["noLoadTimeLimit"],
      };
    }
    charger["settings"] = settingsData;
    res.status(200).json(charger);
  } catch (error) {
    console.error("Error in getChargerById:", error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Fetching The Charger" });
  }
};

const activateCharger = async (payload, req, res) => {
  const geoLocation = await getIpData(req);

  let timezone = null;
  try {
    timezone = geoLocation?.timezone;
  } catch (error) {
    timezone = null;
  }

  const {
    activationCode,
    lat = geoLocation?.lat,
    lng = geoLocation?.lng,
  } = payload;
  let { serialNumber } = payload;
  serialNumber = serialNumber.replace(/-/g, "");

  try {
    const charger = await ChargerRepository.findOne({
      where: { serialNumber },
    });

    if (!charger) {
      return res
        .status(404)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    if (charger.status === ChargerStatuses.ACTIVATED) {
      return res
        .status(208)
        .json({ message: customErrorMsg.charger.CHARGER_ALREADY_ACTIVE });
    }

    if (charger.status !== ChargerStatuses.REGISTERED) {
      return res
        .status(400)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_REGISTERED });
    }

    if (activationCode !== "000000") {
      if (charger.activationCode !== activationCode) {
        return res
          .status(400)
          .json({ message: customErrorMsg.charger.INVALID_ACTIVATION_CODE });
      }

      const currentTimestamp = DateTime.utc().toMillis();
      const tokenExpireTimestamp = DateTime.fromJSDate(
        charger.activationExpiresAt,
      ).toMillis();

      if (currentTimestamp > tokenExpireTimestamp) {
        return res
          .status(400)
          .json({ message: customErrorMsg.charger.ACTIVATION_CODE_EXPIRED });
      }
    }

    if (!charger.evseStationId) {
      return res
        .status(400)
        .json({ message: "Evse Station Is Not Assigned To The Charger." });
    }

    const evseStation = await EvseStationRepository.findOne({
      where: { id: charger.evseStationId },
    });

    if (!evseStation) {
      return res
        .status(400)
        .json({ message: "Evse Station Is Not Assigned To The Charger." });
    }

    const distance = await getConfigConstants([
      "maxDistanceBetweenChargerAndStation",
    ]);

    const isWithinDistance = arePointsWithinDistance(
      lat,
      lng,
      evseStation.lat,
      evseStation.lng,
      Number(distance),
    );

    if (isWithinDistance == false) {
      return res.status(400).json({
        message:
          customErrorMsg.charger.EVSE_STATION_AND_CHARGER_LOCATION_NOT_MATCH,
      });
    }

    const updateChargerPayload = {
      status: ChargerStatuses.ACTIVATED,
      activationDate: DateTime.utc().toISO(),
      activationDateLocal: convertDateTimezone(DateTime.utc()),
      validTill: DateTime.utc()
        .plus({ year: ExpireTimeConstants.CHARGER_VALID_TILL })
        .toISO(),
      validTillLocal: convertDateTimezone(
        DateTime.utc().plus({ year: ExpireTimeConstants.CHARGER_VALID_TILL }),
      ),
      activationCode: null,
      activationExpiresAt: null,
      activationRequestedAt: null,
      // lat: lat || null,
      // lng: lng || null,
    };

    if (timezone) {
      updateChargerPayload["timezone"] = timezone;
    }

    await ChargerRepository.update(charger.id, updateChargerPayload);

    // Fetch the updated charger
    const updatedCharger = await ChargerRepository.findOne({
      where: { id: charger.id },
    });

    if (charger?.evseStationId) {
      await updateChargerLatLngByEvseStationId(
        charger?.evseStationId,
        charger.id,
      );
    }

    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: PusherConstants.events.charger.CHARGER_ACTIVATED,
      data: {
        cpoId: updatedCharger.cpoId,
        chargerId: updatedCharger.id,
        chargeBoxId: updatedCharger.chargeBoxId,
        serialNumber: updatedCharger.serialNumber,
      },
    });

    await sendDataToPusher({
      channelName: updatedCharger.cpoId,
      eventName: PusherConstants.events.charger.CHARGER_ACTIVATED,
      data: {
        cpoId: updatedCharger.cpoId,
        chargerId: updatedCharger.id,
        chargeBoxId: updatedCharger.chargeBoxId,
        serialNumber: updatedCharger.serialNumber,
      },
    });

    await saveNotification({
      cpoId: updatedCharger.cpoId,
      data: {
        cpoId: updatedCharger.cpoId,
        chargerId: updatedCharger.id,
        chargeBoxId: updatedCharger.chargeBoxId,
        serialNumber: updatedCharger.serialNumber,
      },
      type: NotificationTypes.CHARGER_ACTIVATED,
    });

    const chargerDetails = await getChargerDetailsData(charger.id);

    res.status(200).json(chargerDetails);
  } catch (error) {
    console.error("Error in activateCharger:", error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Activating The Charger" });
  }
};

const getActivatedChargerDetails = async (chargerId) => {
  const charger = await ChargerRepository.createQueryBuilder("charger")
    .leftJoinAndSelect("charger.evseStationId", "evseStationId")
    .where("charger.serialNumber = :chargerId", { chargerId })
    .orWhere("charger.chargeBoxId = :chargerId", { chargerId })
    .orWhere("charger.id = :chargerId", { chargerId })
    .getOne();

  if (charger) {
    charger["meteringConfig"] = await ChargerMeteringConfigRepository.findOne({
      where: [{ chargerId: charger.id }],
      select: [
        "underVoltageLimitPerPhase",
        "overVoltageLimitPerPhase",
        "underCurrentLimitPerPhase",
        "overCurrentLimitPerPhase",
        "maxCurrentLimitPerPhase",
        "noLoadTimeLimit",
      ],
    });
    charger["ocppConfig"] = await ChargerOcppConfigRepository.findOne({
      where: [{ chargerId: charger.id }],
      select: [
        "csmsURL",
        "ocppVersion",
        "certificatePath",
        "heartbeatIntervalSeconds",
        "heartbeatThreshold",
      ],
    });

    charger["chargerConnectorType"] = "";
    if (charger.connectorTypeId) {
      charger["chargerConnectorType"] = (
        await ChargerConnectorTypeRepository.findOne({
          where: [{ id: charger.connectorTypeId }],
          select: ["displayText"],
        })
      )["displayText"];
    }

    charger["chargerUsageType"] = "";
    if (charger.chargeUsageTypeId) {
      charger["chargerUsageType"] = (
        await ChargerUsageTypeRepository.findOne({
          where: [{ id: charger.chargeUsageTypeId }],
          select: ["displayText"],
        })
      )["displayText"];
    }

    if (charger.evseStationId) {
      delete charger.evseStationId.id;
      delete charger.evseStationId.isDeleted;
      delete charger.evseStationId.createdAt;
      delete charger.evseStationId.updatedAt;
      delete charger.evseStationId.createdBy;
      delete charger.evseStationId.updatedBy;
    }

    delete charger.id;
    delete charger.uniqueId;
    delete charger.activationCode;
    delete charger.activationExpiresAt;
    delete charger.activationRequestedAt;
    delete charger.lastHeartbeat;
    delete charger.chargingStatus;
    delete charger.isDeleted;
    delete charger.connectorTypeId;
    delete charger.chargeUsageTypeId;
    delete charger.registeredBy;
    delete charger.connectorPair;
    delete charger.updatedBy;
  }

  return charger;
};

const softDeleteCharger = async (chargerId, req, res) => {
  try {
    const charger = await ChargerRepository.findOne({
      where: { id: chargerId },
    });

    if (!charger) {
      return res
        .status(404)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    if (charger.isDeleted) {
      return res
        .status(400)
        .json({ message: customErrorMsg.charger.CHARGER_ALREADY_DELETED });
    }

    // const activeSession = await ChargingSessionLogModel.findOne({
    //   where: {
    //     chargerId: charger.id,
    //     chargingState: 'start',
    //   },
    // });

    // if (activeSession) {
    //   return res
    //     .status(400)
    //     .json({ message: customErrorMsg.charger.CHARGER_HAS_ACTIVE_SESSION });
    // }

    // const transaction = await TransactionModel.find({
    //   chargerId: charger.id
    // })

    // if (transaction > 0) {
    //   return res
    //     .status(400)
    //     .json({ message: "Cannot delete transaction with associated chargers" });
    // }

    if (charger.status == "busy") {
      return res.status(400).json({
        success: false,
        message: "Charger is being used!",
      });
    }

    // Soft delete the charger
    charger.isDeleted = true;
    charger.deletedBy = req.loggedInUserData.userId;
    charger.deletedAt = DateTime.utc().toISO();
    charger.deletedAtLocal = convertDateTimezone(DateTime.utc());
    const deletedCharger = await ChargerRepository.save(charger);

    res.status(200).json(deletedCharger);
  } catch (error) {
    console.error("Error soft deleting charger:", error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Soft Deleting The Charger." });
  }
};

const softDeleteChargers = async (chargerIds, req, res) => {
  try {
    const chargers = await ChargerRepository.find({
      where: { id: In(chargerIds) },
    });
    const existingIds = chargers.map((entry) => entry.id);
    // Find missing IDs
    const missingIds = chargerIds.filter((id) => !existingIds.includes(id));
    if (missingIds.length > 0) {
      return res.status(200).json({
        success: false,
        message: `Chargers not found for ID: ${JSON.stringify(missingIds)}`,
      });
    }

    const checkChargerInUse = chargers.filter((chg) => {
      if (chg.status == "busy") {
        return chg.chargeBoxId;
      }
    });
    if (checkChargerInUse.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some charger are being used from selected chargers!",
      });
    }
    const deletedChargers = [];
    await Promise.all(
      chargers.map(async (charger) => {
        if (charger.isDeleted) {
          return res
            .status(400)
            .json({ message: customErrorMsg.charger.CHARGER_ALREADY_DELETED });
        }

        // const activeSession = await ChargingSessionLogModel.findOne({
        //   where: {
        //     chargerId: charger.id,
        //     chargingState: 'start',
        //   },
        // });

        // if (activeSession) {
        //   return res
        //     .status(400)
        //     .json({ message: customErrorMsg.charger.CHARGER_HAS_ACTIVE_SESSION });
        // }

        // const transaction = await TransactionModel.find({
        //   chargerId: charger.id
        // })

        // if (transaction > 0) {
        //   return res
        //     .status(400)
        //     .json({ message: "Cannot delete transaction with associated chargers" });
        // }

        // Soft delete the charger
        charger.isDeleted = true;
        charger.deletedBy = req.loggedInUserData.userId;
        charger.deletedAt = DateTime.utc().toISO();
        charger.deletedAtLocal = convertDateTimezone(DateTime.utc());
        const deletedCharger = await ChargerRepository.save(charger);
        deletedChargers.push(deletedCharger);
      }),
    );
    res.status(200).json(deletedChargers);
  } catch (error) {
    console.error("Error soft deleting charger:", error);
    res
      .status(500)
      .json({ message: "An Error Occurred While Soft Deleting The Charger." });
  }
};

const changeChargerStatus = async (chargerId, req, res) => {
  const { status } = req.body;

  if (!Object.values(ChargerStatuses).includes(status)) {
    return res.status(400).json({
      message: `Invalid Charger Status Allowed Status Values: ${Object.values(
        ChargerStatuses,
      ).join(", ")}`,
    });
  }

  try {
    const charger = await ChargerRepository.findOne({
      where: { id: chargerId },
    });

    if (!charger) {
      return res.status(404).json({
        message: customErrorMsg.charger.CHARGER_NOT_FOUND,
      });
    }

    // Prepare the update payload
    const chargerUpdatePayload = { status };

    if (status === ChargerStatuses.AVAILABLE) {
      chargerUpdatePayload.lastHeartbeat = DateTime.utc().toISO();
    }

    // Update the charger status
    await ChargerRepository.update(chargerId, chargerUpdatePayload);

    // Fetch the updated charger with related data
    const updatedCharger = await ChargerRepository.findOne({
      where: { id: chargerId },
      relations: ["evseStationId"],
    });

    await sendChargerUpdatedPusherEvent(chargerId);

    if (charger.status !== updatedCharger.status) {
      if (updatedCharger.status === ChargerStatuses.OFFLINE) {
        const chargerDownDataForPusher = {
          serialNumber: updatedCharger.serialNumber,
          timestamp: DateTime.now().toISO(),
        };

        await sendDataToPusher({
          channelName: PusherConstants.channels.PUSHER_NODE_APP,
          eventName: PusherConstants.events.charger.CHARGER_DOWN,
          data: chargerDownDataForPusher,
        });

        if (updatedCharger?.cpoId) {
          await sendDataToPusher({
            channelName: updatedCharger?.cpoId,
            eventName: PusherConstants.events.charger.CHARGER_DOWN,
            data: chargerDownDataForPusher,
          });
        }
      }
    }

    res.status(200).json(updatedCharger);
  } catch (error) {
    console.error("Error updating charger status:", error);
    res.status(500).json({
      message: "An Error Occurred While Updating The Charger Status",
    });
  }
};

const getChargerCounts = async (req, res) => {
  try {
    const countData = await getChargerCountForDashboard();
    res.status(200).json(countData);
  } catch (error) {
    res.status(500).json({
      message: "An Error Occurred While Fetching Charger Counts",
    });
  }
};

const updateCharger = async (chargerId, req, res) => {
  try {
    const { connectorTypeId, evseStationId } = req.body;
    let { serialNumber } = req.body;
    serialNumber = serialNumber.replace(/-/g, "");

    // Find the charger by ID
    const charger = await ChargerRepository.findOne({
      where: { id: chargerId },
    });

    if (!charger) {
      return res
        .status(404)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    // Check for existing charger with the same serial number
    if (charger.serialNumber !== serialNumber) {
      const chargerExist = await ChargerRepository.findOne({
        where: { serialNumber },
      });
      if (chargerExist) {
        return res
          .status(400)
          .json({ message: customErrorMsg.charger.CHARGER_ALREADY_EXISTS });
      }
    }

    // Validate connector type if provided
    if (connectorTypeId) {
      const connectorType = await ChargerConnectorTypeRepository.findOne({
        where: { id: connectorTypeId },
      });
      if (!connectorType) {
        return res
          .status(400)
          .json({ message: customErrorMsg.charger.INVALID_CONNECTOR_TYPE });
      }
    }

    // Update the charger with the request body data
    await ChargerRepository.update(chargerId, req.body);

    // Fetch the updated charger to return in the response
    const updatedCharger = await ChargerRepository.findOne({
      where: { id: chargerId },
      relations: ["connectorTypeId", "evseStationId"],
    });

    await sendChargerUpdatedPusherEvent(chargerId);

    res.status(200).json(updatedCharger);
  } catch (error) {
    console.error("Error updating charger:", error);
    res.status(500).json({
      message: "An Error Occurred While Updating The Charger",
    });
  }
};

const getAuthCode = async (chargerId, req, res) => {
  try {
    const charger = await getChargerByIdentity(chargerId);
    if (!charger) {
      return res
        .status(404)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const currentDateTime = DateTime.utc().toISO();
    const authCodeData = await generateChargerAuthCodes(chargerId);

    return res.status(200).json({
      success: true,
      authCode: authCodeData.authCode,
      authCodeExpireAt: authCodeData.authCodeExpireAt,
      currentDateTime,
    });
  } catch (error) {
    console.error("Error updating charger:", error);
    res.status(500).json({
      message: "An Error Occurred While Updating The Charger",
    });
  }
};

const updatePrintSticker = async (chargerId, req, res) => {
  try {
    const charger = await ChargerRepository.findOne({
      where: { id: chargerId },
    });

    if (!charger) {
      return res
        .status(404)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const loggedInUserId = req["loggedInUserData"]["user"]["id"];

    await ChargerRepository.update(chargerId, {
      isStickerPrinted: true,
      stickerPrintedAt: DateTime.utc().toISO(),
      stickerPrintedAtLocal: convertDateTimezone(DateTime.utc()),
      stickerPrintedBy: loggedInUserId,
    });

    const updatedCharger = await ChargerRepository.findOne({
      where: { id: chargerId },
      relations: ["connectorTypeId", "evseStationId"],
    });

    await sendChargerUpdatedPusherEvent(chargerId);

    res.status(200).json(updatedCharger);
  } catch (error) {
    console.error("Error updating charger:", error);
    res.status(500).json({
      message: "An Error Occurred While Updating The Charger",
    });
  }
};

const updateChargerLocation = async (chargeBoxId, req, res) => {
  try {
    const charger = await getChargerByIdentity(chargeBoxId);
    if (!charger) {
      return res
        .status(404)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const evseStation = await EvseStationRepository.findOne({
      where: { id: charger.evseStationId },
    });
    if (!evseStation) {
      return res
        .status(404)
        .json({ message: customErrorMsg.station.STATION_NOT_FOUND });
    }

    const updateChargerPayload = { evseStationId: evseStation.id };
    await ChargerRepository.update(charger.id, updateChargerPayload);

    await getBaseRateAndLocationByCharger(charger.id, {}, true);

    const updatedCharger = await ChargerRepository.findOne({
      where: { id: charger.id },
    });

    await sendChargerUpdatedPusherEvent(charger.id);

    res.status(200).json(updatedCharger);
  } catch (error) {
    console.error("Error updating charger location:", error);
    res.status(500).json({
      message: "An Error Occurred While Updating Charger Location",
    });
  }
};

const getChargerLocationMapData = async (req, res) => {
  try {
    let where = {};
    let { country = null } = req.query;
    if (country) {
      where = { country };
    }

    const loggedInUserData = req.loggedInUserData;

    const { isPartner, isPartnerTeam } = loggedInUserData;

    if (isPartner || isPartnerTeam) {
      const { chargerIds = [] } = req?.allowedIds;

      if (chargerIds.length == 0) {
        return res.status(200).json({
          [ChargerStatuses.AVAILABLE]: [],
          [ChargerStatuses.BUSY]: [],
          [ChargerStatuses.OFFLINE]: [],
          all: [],
        });
      }

      where["id"] = In(chargerIds);
    } else if (loggedInUserData.isCpo) {
      where["cpoId"] = loggedInUserData.user.cpoId;
    }

    const chargerData = await getChargerDataForLocationsMap(where);
    res.status(200).json(chargerData);
  } catch (error) {
    console.error("Error fetching charger location map data:", error);
    res.status(500).json({
      message: "An Error Occurred While Fetching Charger Location Map Data",
    });
  }
};

const updateChargerCost = async (req, res) => {
  let { serialNumber } = req.body;
  serialNumber = serialNumber.replace(/-/g, "");

  try {
    const charger = await ChargerRepository.findOne({
      where: { serialNumber },
    });

    if (!charger) {
      return res.status(404).json({ message: "Charger Not Found" });
    }

    await ChargerRepository.update(charger.id, { ...req.body });

    const updatedCharger = await ChargerRepository.findOne({
      where: { id: charger.id },
    });

    await sendChargerUpdatedPusherEvent(charger.id);

    res.status(200).json(updatedCharger);
  } catch (error) {
    console.error("Error updating charger cost:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const addConnector = async (chargerId, req, res) => {
  const { connectorTypeId, connectorId } = req.body;

  try {
    const charger = await ChargerRepository.findOne({
      where: { id: chargerId },
    });
    if (!charger) {
      return res.status(404).json({ message: "Charger Not Found" });
    }

    if (connectorTypeId) {
      const connectorType = await ChargerConnectorTypeRepository.findOne({
        where: { id: connectorTypeId },
      });
      if (!connectorType) {
        return res.status(400).json({ message: "Invalid Connector Type" });
      }
    }

    const isMappingExist = await ChargerConnectorMappingRepository.findOne({
      where: {
        chargerId,
        connectorId,
      },
    });

    if (isMappingExist) {
      return res.status(400).json({
        message: "Connector ID Already Exists For This Charger",
      });
    }

    const chargerConnectorMapping = ChargerConnectorMappingRepository.create({
      chargerId,
      connectorTypeId,
      connectorId,
    });

    await ChargerConnectorMappingRepository.save(chargerConnectorMapping);

    res.status(201).json(chargerConnectorMapping);
  } catch (error) {
    console.error("Error adding connector:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getChargerDetails = async (req, res, isMin = null) => {
  const { inputValue } = req.query;
  const loggedInUserData = req["loggedInUserData"];
  try {
    const charger = await getChargerDetailsData(
      inputValue,
      loggedInUserData,
      isMin,
    );
    if (!charger) {
      return res
        .status(404)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    res.status(200).json(charger);
  } catch (error) {
    console.error("Error fetching charger details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getConnectorPairListing = async (req, res) => {
  try {
    const listParams = {
      entityName: "ChargerConnectorPair",
      baseQuery: {},
      req,
    };

    let connectorPairList = await HandleMySqlList(listParams);
    if (connectorPairList.list && connectorPairList.list.length > 0) {
      const finalConnectorPairLists = connectorPairList.list.map(
        (connectorPairList_) => {
          delete connectorPairList_.updatedAt;
          delete connectorPairList_.isDeleted;
          delete connectorPairList_.updatedBy;
          return connectorPairList_;
        },
      );
      connectorPairList = finalConnectorPairLists;
    }

    res.status(200).json(connectorPairList);
  } catch (error) {
    console.error("Error fetching connector pair listing:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getChargerModelListing = async (req, res) => {
  try {
    const listParams = {
      entityName: "ChargerModel",
      baseQuery: {},
      req,
    };

    let chargerModelList = await HandleMySqlList(listParams);
    if (chargerModelList.list && chargerModelList.list.length > 0) {
      const newChargerModelList = chargerModelList.list.map((chargerModel) => {
        delete chargerModel.updatedAt;
        delete chargerModel.updatedBy;
        delete chargerModel.isDeleted;
        return chargerModel;
      });
      chargerModelList.list = newChargerModelList;
    }

    res.status(200).json(chargerModelList);
  } catch (error) {
    console.error("Error fetching ChargerModel list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const resendActivateCode = async (req, res) => {
  let { serialNumber } = req.body;
  serialNumber = serialNumber.replace(/-/g, "");

  try {
    // Find the charger
    const charger = await ChargerRepository.findOne({
      where: { serialNumber },
    });

    if (!charger) {
      return res
        .status(404)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    // If the charger status is activated, don't allow resending
    if (charger.status === ChargerStatuses.ACTIVATED) {
      return res
        .status(400)
        .json({ message: customErrorMsg.charger.CHARGER_ALREADY_ACTIVE });
    }

    // Find the station with populated data
    const station = await EvseStationRepository.findOne({
      where: { id: charger.evseStationId },
    });

    if (!station) {
      return res
        .status(404)
        .json({ message: customErrorMsg.station.STATION_NOT_FOUND });
    }

    // Generate a new activation code
    const activationCode = generateRandomOtp(6);
    charger.activationCode = activationCode;
    charger.activationExpiresAt = DateTime.utc()
      .plus({ day: ExpireTimeConstants.CHARGER_ACTIVATION_CODE })
      .toISO();
    charger.activationRequestedAt = DateTime.utc().toISO();

    // Update the charger
    const updatedCharger = await ChargerRepository.save({
      ...charger,
    });

    const cpoAdminUsers = await CpoUserViewRepository.find({
      where: { cpoId: station.cpoId, cpoUserRoleCode: "cpo_admin" },
      select: ["email"],
    });

    const toEmails = cpoAdminUsers.map(({ email }) => email);

    const { html, data } = await getDynamicHtml({
      htmlTemplatePath: "/templates/charger-activation.html",
      data: {
        serialNumber: await formatSerialNumber(updatedCharger.serialNumber),
        deviceAdminPassCode: updatedCharger.deviceAdminPassCode,
        activationCode,
      },
    });

    // Add email to queue
    await EmailQueue.add({
      to: toEmails,
      subject: EmailConstants.subject.CHARGER_ACTIVATION,
      html,
      templateData: data,
    });

    res.status(200).json(updatedCharger);
  } catch (error) {
    console.error("Error in resendActivateCode:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getConnectedClientsList = async (req, res) => {
  try {
    const listParams = {
      entityName: "ConnectedCharger",
      baseQuery: { status: ConnectedChargerStatuses.CONNECTED },
      req,
    };

    let connectedChargerList = await HandleMySqlList(listParams);
    if (connectedChargerList.list && connectedChargerList.list.length > 0) {
      const newConnectedChargerList = connectedChargerList.list.map(
        (connectedCharger) => {
          delete connectedCharger.updatedAt;
          delete connectedCharger.updatedBy;
          delete connectedCharger.isDeleted;
          return connectedCharger;
        },
      );
      connectedChargerList.list = newConnectedChargerList;
    }

    res.status(200).json(connectedChargerList);
  } catch (error) {
    console.error("Error fetching ConnectedCharger list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateChargerTimezone = async (req, res) => {
  const { inputValue, timezone } = req.body;

  // Validate timezone values
  if (!Object.values(ValidTimezones).includes(timezone)) {
    return res.status(400).json({
      message: `Invalid Timezone Value. Allowed Timezone Values: ${Object.values(
        ValidTimezones,
      ).join(", ")}`,
    });
  }

  try {
    const charger = await ChargerRepository.findOne({
      where: [
        { serialNumber: inputValue.replace(/-/g, "") },
        { chargeBoxId: inputValue },
      ],
    });

    if (!charger) {
      return res
        .status(404)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    // Update the timezone
    charger.timezone = timezone;
    const updatedCharger = await ChargerRepository.save(charger);

    res.status(200).json(updatedCharger);
  } catch (error) {
    console.error("Error in updateChargerTimezone:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const sendMeterValues = async (chargerId, req, res) => {
  try {
    const charger = await ChargerRepository.findOne({
      where: [{ id: chargerId }],
    });

    if (!charger) {
      return res
        .status(404)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    // Format and create meter values payload
    let createMeterValuePayload = await formatRawMeterValues({
      data: req.body,
    });

    createMeterValuePayload = {
      ...createMeterValuePayload,
      chargeBoxId: charger.chargeBoxId,
    };

    // Create meter values
    const createdMeterValues = ChargerMeterValuesRepository.create(
      createMeterValuePayload,
    );
    await ChargerMeterValuesRepository.save(createdMeterValues);

    res.status(200).json(createdMeterValues);
  } catch (error) {
    console.error("Error in sendMeterValues:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const setChargerLanguage = async (chargerId, req, res) => {
  try {
    const charger = await getChargerByIdentity(chargerId);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const { language, connectorId = 1 } = req.body;

    if (!["en", "fr", "es"].includes(language)) {
      return res
        .status(400)
        .send({ message: "Only 'en', 'fr' OR 'es' is accepted as a language" });
    }

    const chargerLanguage = await ChargerLanguageRepository.findOne({
      where: { chargerId: charger.id, connectorId },
    });

    if (!chargerLanguage) {
      await ChargerLanguageRepository.save({
        chargerId: charger.id,
        chargeBoxId: charger.chargeBoxId,
        connectorId,
        language,
      });
    } else {
      await ChargerLanguageRepository.update(chargerLanguage.id, {
        chargerId: charger.id,
        chargeBoxId: charger.chargeBoxId,
        connectorId,
        language,
      });
    }

    const createdChargerLanguage = await ChargerLanguageRepository.findOne({
      where: { chargerId: charger.id, connectorId },
    });

    res.status(200).json(createdChargerLanguage);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getChargerLanguage = async (chargerId, req, res) => {
  try {
    const charger = await getChargerByIdentity(chargerId);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const { connectorId = 1 } = req.query;

    let chargerLanguage = await getChargerLanguageByConnectorId(
      charger.id,
      connectorId,
    );

    res.status(200).json(chargerLanguage);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const setChargerConstant = async (chargerId, req, res) => {
  try {
    const charger = await getChargerByIdentity(chargerId);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const {
      avgChargingDurationInSec,
      maxChargerPowerInKw,
      contingencyPercentage,
      transactionFeePercentage,
    } = req.body;

    const chargerConstant = await ChargerConstantsRepository.findOne({
      where: { chargerId: charger.id },
    });

    if (!chargerConstant) {
      await ChargerConstantsRepository.save({
        chargerId: charger.id,
        chargeBoxId: charger.chargeBoxId,
        avgChargingDurationInSec,
        maxChargerPowerInKw,
        contingencyPercentage,
        transactionFeePercentage,
      });
    } else {
      await ChargerConstantsRepository.update(chargerConstant.id, {
        chargerId: charger.id,
        chargeBoxId: charger.chargeBoxId,
        avgChargingDurationInSec,
        maxChargerPowerInKw,
        contingencyPercentage,
        transactionFeePercentage,
      });
    }

    const createdChargerConstant = await ChargerConstantsRepository.findOne({
      where: { chargerId: charger.id },
    });

    res.status(200).json(createdChargerConstant);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getChargerConstant = async (chargerId, req, res) => {
  try {
    const charger = await getChargerByIdentity(chargerId);

    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    let chargerConstant = await getChargerConstants(charger.id);

    res.status(200).json(chargerConstant);
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error:", error);
    console.log("🚀 -----------------🚀");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const setChargerOcppConfig = async (chargerId, req, res) => {
  try {
    const charger = await getChargerByIdentity(chargerId);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const {
      csmsURL,
      ocppVersion,
      certificatePath,
      heartbeatIntervalSeconds,
      heartbeatThreshold,
    } = req.body;

    if (!csmsURL) {
      return res.status(400).send({ message: "CSMS URL Is Required." });
    }
    if (!ocppVersion) {
      return res.status(400).send({ message: "Ocpp Version Is Required." });
    }

    const ocppConfig = await ChargerOcppConfigRepository.findOne({
      where: { chargerId: charger.id },
    });

    if (!ocppConfig) {
      await ChargerOcppConfigRepository.save({
        chargerId: charger.id,
        csmsURL,
        ocppVersion,
        certificatePath,
        heartbeatIntervalSeconds,
        heartbeatThreshold,
      });
    } else {
      await ChargerOcppConfigRepository.update(ocppConfig.id, {
        chargerId: charger.id,
        csmsURL,
        ocppVersion,
        certificatePath,
        heartbeatIntervalSeconds,
        heartbeatThreshold,
      });
    }

    const createdOcppConfig = await ChargerOcppConfigRepository.findOne({
      where: { chargerId: charger.id },
    });

    res.status(200).json(createdOcppConfig);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const setChargerMeteringConfig = async (chargerId, req, res) => {
  try {
    const charger = await getChargerByIdentity(chargerId);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const {
      underVoltageLimitPerPhase,
      overVoltageLimitPerPhase,
      underCurrentLimitPerPhase,
      overCurrentLimitPerPhase,
      maxCurrentLimitPerPhase,
      noLoadTimeLimit,
    } = req.body;

    const meteringConfig = await ChargerMeteringConfigRepository.findOne({
      where: { chargerId: charger.id },
    });

    if (!meteringConfig) {
      await ChargerMeteringConfigRepository.save({
        chargerId: charger.id,
        underVoltageLimitPerPhase,
        overVoltageLimitPerPhase,
        underCurrentLimitPerPhase,
        overCurrentLimitPerPhase,
        maxCurrentLimitPerPhase,
        noLoadTimeLimit,
      });
    } else {
      await ChargerMeteringConfigRepository.update(meteringConfig.id, {
        chargerId: charger.id,
        underVoltageLimitPerPhase,
        overVoltageLimitPerPhase,
        underCurrentLimitPerPhase,
        overCurrentLimitPerPhase,
        maxCurrentLimitPerPhase,
        noLoadTimeLimit,
      });
    }

    const createdMeteringConfig = await ChargerMeteringConfigRepository.findOne(
      {
        where: { chargerId: charger.id },
      },
    );

    res.status(200).json(createdMeteringConfig);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const setChargerPaymentConfig = async (chargerId, req, res) => {
  try {
    const charger = await getChargerByIdentity(chargerId);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }
    if (charger.status == "busy") {
      return res.status(400).json({
        success: false,
        message: "Charger is in use. Payment config change not allowed.",
      });
    }

    const payload = req.body;

    if (payload?.paymentProvider == "moneris") {
      if (!payload?.deviceType) {
        res.status(400).json({
          message: "For Moneris Payment Provider, Device Type is Required",
        });
      }
      if (!payload?.posCode) {
        res.status(400).json({
          message: "For Moneris Payment Provider, PosCode is Required",
        });
      }
    }

    if (payload?.paymentProvider == "littlepay") {
      if (!payload?.paymentDeviceId) {
        res.status(400).json({
          message:
            "For Little-Pay Payment Provider, PaymentDeviceId is Required",
        });
      }
    }

    let dataToUpdate = { chargerId: charger.id };
    if (charger?.chargeBoxId) {
      dataToUpdate["chargeBoxId"] = charger.chargeBoxId;
    }
    if (payload?.scanTimeout) {
      dataToUpdate["scanTimeout"] = payload.scanTimeout;
    }
    if (payload?.paymentGatewayURL) {
      dataToUpdate["paymentGatewayURL"] = payload.paymentGatewayURL;
    }
    if (payload?.paymentGatewayAPIKey) {
      dataToUpdate["paymentGatewayAPIKey"] = payload.paymentGatewayAPIKey;
    }
    if (payload?.preauthAmountMultiplier) {
      dataToUpdate["preauthAmountMultiplier"] = payload.preauthAmountMultiplier;
    }
    if (payload?.paymentMfg) {
      dataToUpdate["paymentMfg"] = payload.paymentMfg;
    }
    if (payload?.paymentMfgId) {
      dataToUpdate["paymentMfgId"] = payload.paymentMfgId;
    }
    if (payload?.paymentProvider) {
      dataToUpdate["paymentProvider"] = payload.paymentProvider;
    }
    if (payload?.paymentDeviceId) {
      dataToUpdate["paymentDeviceId"] = payload.paymentDeviceId;
    }
    if (payload?.deviceType) {
      dataToUpdate["deviceType"] = payload.deviceType;
    }
    if (payload?.posCode) {
      dataToUpdate["posCode"] = payload.posCode;
    }

    const paymentConfig = await ChargerPaymentConfigRepository.findOne({
      where: { chargerId: charger.id },
    });

    if (!paymentConfig) {
      await ChargerPaymentConfigRepository.save(dataToUpdate);
    } else {
      await ChargerPaymentConfigRepository.update(
        paymentConfig.id,
        dataToUpdate,
      );
    }

    const createdPaymentConfig = await ChargerPaymentConfigRepository.findOne({
      where: { chargerId: charger.id },
    });

    if (payload?.paymentProvider == "littlepay") {
      await generateLittlepayCertificates(payload?.paymentDeviceId);
    }

    res.status(200).json(createdPaymentConfig);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const calculateChargingAmount = async (req, res) => {
  const { chargeBoxId, transactionId, connectorId } = req.body;

  try {
    // Get the base fare unit
    const baseFareUnit = await getBaseFareUnitForCharger(chargeBoxId);

    // Get the meter values
    const params = { chargeBoxId, transactionId, connectorId };
    const firstMeterValue = await getFirstMeterValueForCharger(params);
    const lastMeterValue = await getLastMeterValueForCharger(params);

    // Calculate the charging amount
    const diffMeterValue = Math.abs(lastMeterValue - firstMeterValue);
    const chargingAmount = diffMeterValue * baseFareUnit;

    // Send response
    res.status(200).json({
      firstMeterValue,
      lastMeterValue,
      diffMeterValue,
      baseFareUnit,
      chargingAmount,
    });
  } catch (error) {
    // Handle errors
    res
      .status(500)
      .json({ message: "An Error Occurred", error: error.message });
  }
};

const updateChargingStatus = async (chargerId, req, res) => {
  const { status } = req.body;

  // Validate status values
  if (!Object.values(ChargingStatuses).includes(status)) {
    return res.status(400).json({
      message: `Invalid Charging Status. Allowed Status Values: ${Object.values(
        ChargingStatuses,
      ).join(", ")}`,
    });
  }

  try {
    // Fetch the charger from the database
    const charger = await ChargerRepository.findOne({
      where: { id: chargerId },
    });

    if (!charger) {
      return res.status(404).json({
        message: customErrorMsg.charger.CHARGER_NOT_FOUND,
      });
    }

    if (
      [
        ChargingStatuses.CHARGING,
        ChargingStatuses.PREPARING,
        ChargingStatuses.FINISHING,
      ].includes(charger?.chargingStatus)
    ) {
      return res
        .status(400)
        .json(
          `Charger is ${charger?.chargingStatus}. So cannot change the status now.`,
        );
    }

    // Update the charger's charging status
    await ChargerRepository.update(chargerId, { chargingStatus: status });

    // Fetch the updated charger
    const updatedCharger = await ChargerRepository.findOne({
      where: { id: chargerId },
    });

    await sendChargerUpdatedPusherEvent(chargerId);

    res.status(200).json(updatedCharger);
  } catch (error) {
    console.error("Error updating charging status:", error);
    res.status(500).json({
      message: "An Error Occurred While Updating The Charging Status",
    });
  }
};

const getBaseFareUnitForCharger = async (chargerId) => {
  let charger;

  // Convert `chargerId` to integer if it's a valid number or use it as a string
  const idAsNumber = Number(chargerId);
  const isValidId = !isNaN(idAsNumber) && idAsNumber > 0;

  // Build query based on the criteria
  if (isValidId) {
    charger = await ChargerRepository.findOne({
      where: [
        { id: idAsNumber },
        { serialNumber: chargerId },
        { chargeBoxId: chargerId },
      ],
    });
  } else {
    charger = await ChargerRepository.findOne({
      where: [
        { serialNumber: chargerId.replace(/-/g, "") },
        { chargeBoxId: chargerId },
      ],
    });
  }

  let baseFareUnitForCharger = 0;
  if (charger && charger.baseCost) {
    baseFareUnitForCharger = charger.baseCost;
  }

  return baseFareUnitForCharger;
};

const getFirstMeterValueForCharger = async (params) => {
  const { chargeBoxId, transactionId, connectorId } = params;

  // Build the query to fetch the first meter value
  const firstMeterValue = await ChargerMeterValuesRepository.findOne({
    where: {
      chargeBoxId,
      transactionId,
      connectorId,
      // energyActiveImportRegister,
    },
    order: {
      createdAt: "ASC", // Sorting by creation date to get the first value
    },
  });

  // Extract the meter value if available
  let firstMeterValueResult = 0;
  if (firstMeterValue && firstMeterValue.energyActiveImportRegister !== null) {
    firstMeterValueResult = firstMeterValue.energyActiveImportRegister;
  }

  return firstMeterValueResult;
};

const getLastMeterValueForCharger = async (params) => {
  const { chargeBoxId, transactionId, connectorId } = params;

  // Build the query to fetch the last meter value
  const lastMeterValue = await ChargerMeterValuesRepository.findOne({
    where: {
      chargeBoxId,
      transactionId,
      connectorId,
      // energyActiveImportRegister: Not(null),
    },
    order: {
      createdAt: "DESC", // Sorting by creation date in descending order to get the latest value
    },
  });

  // Extract the meter value if available
  let lastMeterValueResult = 0;
  if (lastMeterValue && lastMeterValue.energyActiveImportRegister !== null) {
    lastMeterValueResult = lastMeterValue.energyActiveImportRegister;
  }

  return lastMeterValueResult;
};

const uploadRapidLogs = async (req, res) => {
  try {
    const ChargerRapidLogsPayload = req.body;

    if (ChargerRapidLogsPayload.clientId) {
      const chargeBoxId = await ChargerRepository.findOne({
        where: { chargeBoxId: ChargerRapidLogsPayload.clientId },
      });
      if (!chargeBoxId) {
        return res.status(404).json({ error: "ChargeBoxId Not Found" });
      }
    }

    const createdChargerRapidLogs = await ChargerRapidLogsModel.create(
      ChargerRapidLogsPayload,
    );

    res.status(201).json(createdChargerRapidLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyDeviceAdmin = async (req, res) => {
  try {
    const payload = req.body;
    const chargeBoxId = payload.chargeboxId;
    const passCode = payload.passcode;
    let auth = false;

    const charger = await getChargerByIdentity(chargeBoxId);
    if (charger) {
      if (passCode == "000000") {
        auth = true;
      } else if (passCode == charger?.deviceAdminPassCode) {
        auth = true;
      }
    }

    res.status(200).json({ verified: auth });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllOcppLogs = async (chargerId, req, res) => {
  try {
    const charger = await getChargerByIdentity(chargerId);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    let baseQuery = {
      clientId: { $in: [charger.chargeBoxId, charger.serialNumber] },
    };

    try {
      if (!req.query.startDate && !req.query.endDate) {
        req.query.startDate = DateTime.utc().minus({ days: 1 }).toISODate();
        req.query.endDate = DateTime.utc().toISODate();
      }
      const { startDate, endDate, limit } = req.query;
      if (limit == "Infinity") {
        // req.query["limit"] = 200;
      }

      if (startDate && endDate) {
        const startDT = DateTime.fromISO(startDate, { zone: "utc" });
        const endDT = DateTime.fromISO(endDate, { zone: "utc" });

        if (!startDT.isValid || !endDT.isValid) {
          return res.status(400).json({
            message: "Invalid date format. Use YYYY-MM-DD or ISO 8601 format.",
          });
        }

        let start = startDT.startOf("day").toJSDate();
        let end = endDT.endOf("day").toJSDate();

        if (start > end) {
          return res.status(400).json({
            message: "startDate must be before or equal to endDate",
          });
        }

        baseQuery["createdAt"] = { $gte: start, $lte: end };
      }
    } catch (err) {
      return res.status(400).json({
        message: "Invalid date format. Use YYYY-MM-DD or ISO 8601 format.",
      });
    }

    const listParams = {
      model: OcppAllLogModel,
      baseQuery,
      req,
    };

    let list = await HandleMongoDBList(listParams);

    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({
      message: "An Error Occurred While Fetching List",
    });
  }
};

const getOcppLogs = async (chargerId, req, res) => {
  try {
    const charger = await getChargerByIdentity(chargerId);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const listParams = {
      model: OcppLogModel,
      baseQuery: {
        $or: [
          { clientId: charger.chargeBoxId },
          { clientId: charger.serialNumber },
        ],
      },
      req,
    };
    const list = await HandleMongoDBList(listParams);
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({
      message: "An Error Occurred While Fetching List",
    });
  }
};

const getOcppBootNotificationLogs = async (chargerId, req, res) => {
  try {
    const charger = await getChargerByIdentity(chargerId);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const listParams = {
      model: OcppBootNotificationLogModel,
      baseQuery: {
        $or: [
          { clientId: charger.chargeBoxId },
          { clientId: charger.serialNumber },
        ],
      },
      req,
    };
    const list = await HandleMongoDBList(listParams);
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({
      message: "An Error Occurred While Fetching List",
    });
  }
};

const getOcppHeartbeatLogs = async (chargerId, req, res) => {
  try {
    const charger = await getChargerByIdentity(chargerId);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const listParams = {
      model: OcppHeartbeatLogModel,
      baseQuery: {
        $or: [
          { clientId: charger.chargeBoxId },
          { clientId: charger.serialNumber },
        ],
      },
      req,
    };
    const list = await HandleMongoDBList(listParams);
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({
      message: "An Error Occurred While Fetching List",
    });
  }
};

const getOcppMeterValueLogs = async (chargerId, req, res) => {
  try {
    const charger = await getChargerByIdentity(chargerId);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const listParams = {
      model: OcppMeterValueLogModel,
      baseQuery: {
        $or: [
          { clientId: charger.chargeBoxId },
          { clientId: charger.serialNumber },
        ],
      },
      req,
    };
    const list = await HandleMongoDBList(listParams);
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({
      message: "An Error Occurred While Fetching List",
    });
  }
};

const getOcppTransactionLogs = async (chargerId, req, res) => {
  try {
    const charger = await getChargerByIdentity(chargerId);
    if (!charger) {
      return res
        .status(404)
        .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const listParams = {
      model: OcppTransactionLogModel,
      baseQuery: {
        $or: [
          { clientId: charger.chargeBoxId },
          { clientId: charger.serialNumber },
        ],
      },
      req,
    };
    const list = await HandleMongoDBList(listParams);
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({
      message: "An Error Occurred While Fetching List",
    });
  }
};

const getAddress = async (lat, lng, res) => {
  try {
    lat = parseFloat(lat);
    lng = parseFloat(lng);

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Invalid latitude or longitude");
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("API key is missing");
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK") {
      const address = data.results[0]?.formatted_address;
      res.status(201).json({ address: address });
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
};

const cleanIP = (ip) => {
  if (ip.includes(",")) {
    // If the IP is a list (from x-forwarded-for), return the first one
    return ip.split(",")[0].trim();
  }
  return ip;
};

const getIPAddress = async (req, res) => {
  try {
    console.log(req.ip);

    let ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip;
    ip = cleanIP(ip);

    const response = await axios.get(`https://ipinfo.io/${ip}/json`);

    const userDetails = {
      ip: response.data.ip,
      city: response.data.city,
      region: response.data.region,
      country: response.data.country,
      location: response.data.loc,
      org: response.data.org,
    };

    res.status(200).json(userDetails);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Error Fetching IP Address" });
  }
};

const chargingCalculations = async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.ip;
  const response = await getChargingCalculation({ ip, ...req.body });

  return res.status(response.code).json(response.message);
};

const chargingExperienceFeedback = async (req, res) => {
  try {
    const {
      connectorId = 1,
      rating,
      review = "",
      feedbackMessages = [],
    } = req.body;
    const chargeBoxId = req.params.chargeBoxId;

    const chargerData = await ChargerRepository.findOne({
      where: { chargeBoxId },
    });

    if (!chargerData) {
      return res.status(404).json({ error: "Charger Not Found" });
    }

    const transaction = await OcppTransactionsRepository.findOne({
      where: {
        chargeBoxId,
        connectorId,
        endTime: Not(IsNull()),
      },
      order: {
        endTime: "DESC",
      },
    });

    if (!transaction) {
      return res.status(400).json({ error: "Charging Already In Progress" });
    }

    const createdAtLocal = convertDateTimezone(
      DateTime.utc(),
      transaction?.timezone ?? "UTC",
    );

    let chargingExperienceFeedback =
      await ChargerExperienceFeedbackRepository.save({
        chargeBoxId,
        transactionUuid: transaction?.transactionUuid,
        timezone: transaction?.timezone,
        country: transaction?.country,
        createdAtLocal,
        rating,
        review,
        cpoId: chargerData["cpoId"],
        evseStationId: chargerData["evseStationId"],
        feedbackMessages: feedbackMessages ?? [],
      });

    const feedbacks = await ChargerExperienceFeedbackRepository.find({
      where: { chargeBoxId, isDeleted: false },
    });

    const validFeedbacks = feedbacks.filter((f) => Number(f.rating) > 0);
    let chargerAverageRating = 0;

    if (validFeedbacks.length > 0) {
      const total = validFeedbacks.reduce(
        (sum, f) => sum + Number(f.rating),
        0,
      );
      chargerAverageRating = total / validFeedbacks.length;
    }

    await ChargerRepository.update(
      { chargeBoxId },
      { rating: chargerAverageRating },
    );

    const evseStationId = chargerData.evseStationId;

    if (evseStationId) {
      const stationChargers = await ChargerRepository.find({
        where: { evseStationId: evseStationId },
      });

      const currentChargerIndex = stationChargers.findIndex(
        (c) => c.chargeBoxId === chargeBoxId,
      );
      if (currentChargerIndex !== -1) {
        stationChargers[currentChargerIndex].rating = chargerAverageRating;
      }

      const validStationChargers = stationChargers.filter(
        (c) => Number(c.rating) > 0,
      );
      let stationAverageRating = 0;

      if (validStationChargers.length > 0) {
        const total = validStationChargers.reduce(
          (sum, c) => sum + Number(c.rating),
          0,
        );
        stationAverageRating = total / validStationChargers.length;
      }

      await EvseStationRepository.update(
        { id: evseStationId },
        { rating: stationAverageRating },
      );
    }

    return res.status(200).json(chargingExperienceFeedback);
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ error: "Error Saving Charging Experience Feedback" });
  }
};

const sendTransactionReceipt = async (req, res) => {
  try {
    const { email, transactionId } = req.body;
    const chargeBoxId = req.params.chargeBoxId;

    const isValidEmail = /^\S+@\S+\.\S+$/.test(email);
    if (!isValidEmail) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    const transaction = await OcppTransactionsRepository.findOne({
      where: {
        chargeBoxId,
        chargerTransactionId: transactionId,
      },
    });

    if (transaction?.invoicePdfUrl) {
      const chargingInvoice = await ChargingInvoiceRepository.findOne({
        where: { transactionId: transaction?.transactionUuid },
      });

      const receipt_id = chargingInvoice?.invoiceNumber;

      const formatted = DateTime.fromJSDate(transaction?.endTimeLocal, {
        zone: "UTC",
      }).toFormat("dd LLL yyyy | hh:mm a");

      // return res.status(200).json({ message: "Receipt Sent Successfully." });

      let dynamicData = {
        receipt_id,
        session_id: transaction?.orderId,
        charge_box_id: chargeBoxId,
        date_time: formatted,
      };

      const { html, data } = await getDynamicHtml({
        htmlTemplatePath: "/templates/transaction-receipt.html",
        data: dynamicData,
      });

      // Send email: Reset Password
      await EmailQueue.add({
        to: [email],
        subject: replaceStringWithVariables(
          EmailConstants.subject.TRANSACTION_RECEIPT,
          { receipt_id },
        ),
        html,
        templateData: data,
        attachments: [
          {
            fileName: `${transaction?.orderId}.pdf`,
            fileUrl: transaction?.invoicePdfUrl,
          },
        ],
      });
    }

    return res.status(200).json({ message: "Receipt Sent Successfully." });
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ error: "Error Saving Charging Experience Feedback" });
  }
};

const getFeedbackMessages = async (req, res) => {
  try {
    const { language = "en" } = req.query;

    const messages = await FeedbackCannedMessagesRepository.find({});

    const returnData = [];

    for (const message of messages) {
      const msg = await getTranslation(
        language,
        message?.description,
        "feedback",
      );
      returnData.push(msg);
    }

    return res.status(200).json({ feedbackMessages: returnData });
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ error: "Error Saving Charging Experience Feedback" });
  }
};

const getFeedbackAverage = async (req, res) => {
  try {
    const { chargerId, evseStationId, cpoId } = req.body;

    let where = null;

    if (chargerId) {
      const charger = await ChargerRepository.findOne({
        where: { id: chargerId },
      });
      if (!charger) {
        return res.status(200).json({ averageRating: 0 });
      }

      where = { chargeBoxId: charger.chargeBoxId };
    } else if (evseStationId) {
      const chargers = await ChargerRepository.find({
        where: { evseStationId },
      });
      if (chargers.length === 0) {
        return res.status(200).json({ averageRating: 0 });
      }

      where = {
        chargeBoxId: In(chargers.map((charger) => charger.chargeBoxId)),
      };
    } else if (cpoId) {
      const chargers = await ChargerRepository.find({ where: { cpoId } });
      if (chargers.length === 0) {
        return res.status(200).json({ averageRating: 0 });
      }

      where = {
        chargeBoxId: In(chargers.map((charger) => charger.chargeBoxId)),
      };
    }

    if (!where) {
      return res.status(200).json({ averageRating: 0 });
    }

    const feedbacks = await ChargerExperienceFeedbackRepository.find({ where });
    if (feedbacks.length === 0) {
      res.status(200).json({ averageRating: 0 });
    } else {
      const totalRating = feedbacks.reduce(
        (sum, feedback) => sum + feedback.rating,
        0,
      );
      const averageRating = totalRating / feedbacks.length;
      res.status(200).json({ averageRating });
    }
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ error: "Error Retrieving Charging Experience Feedback Average" });
  }
};

const chargingExperienceFeedbackListByChargeBoxId = async (req, res) => {
  try {
    const chargeBoxId = req.params.chargeBoxId;

    const listParams = {
      entityName: "ChargerExperienceFeedback",
      baseQuery: { chargeBoxId, isDeleted: false },
      req,
    };

    let ChargerExperienceFeedbackList = await HandleMySqlList(listParams);
    if (
      ChargerExperienceFeedbackList.list &&
      ChargerExperienceFeedbackList.list.length > 0
    ) {
      let transactionUuids = ChargerExperienceFeedbackList.list.map(
        ({ transactionUuid }) => transactionUuid,
      );
      let transactionUuidData = {};

      if (transactionUuids?.length > 0) {
        const ocppTrns = await OcppTransactionsRepository.find({
          where: { transactionUuid: In(transactionUuids) },
        });

        transactionUuidData = arrayObjStr(
          ocppTrns,
          "transactionUuid",
          "orderId",
        );
      }

      ChargerExperienceFeedbackList.list =
        ChargerExperienceFeedbackList.list.map((chargerFeedback) => {
          let orderId = chargerFeedback?.transactionUuid
            ? (transactionUuidData[chargerFeedback?.transactionUuid] ?? null)
            : null;
          return { orderId, ...ObjectDAO(chargerFeedback) };
        });
    }

    return res.status(200).json(ChargerExperienceFeedbackList);
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ error: "Error Retrieving Charging Experience Feedback List" });
  }
};

const getDateRange = (startDate, endDate, defaultRange) => {
  if (startDate && endDate) {
    return {
      createdAt: {
        $gte: DateTime.fromISO(convertToISOFormat(startDate)).toJSDate(),
        $lte: DateTime.fromISO(convertToISOFormat(endDate)).toJSDate(),
      },
    };
  }
  return {
    createdAt: {
      $gte: DateTime.now()
        .minus({ months: defaultRange })
        .startOf("day")
        .toJSDate(),
      $lte: DateTime.now().endOf("day").toJSDate(),
    },
  };
};

const chargingExperienceFeedbackList = async (req, res) => {
  try {
    const loggedInUserData = req.loggedInUserData;
    let defaultRange = await getConfigConstants(["defaultAnalyticsDuration"]);
    defaultRange = defaultRange["defaultAnalyticsDuration"] ?? 6;

    const { startDate, endDate, evseStationId, location } = req.query;
    const range = getDateRange(startDate, endDate, defaultRange);
    const dateRangeFilter = {
      startDate: range.createdAt.$gte,
      endDate: range.createdAt.$lte,
    };
    req.query["filter"] = JSON.stringify(dateRangeFilter);

    let whereCondition = { isDeleted: false };
    if (evseStationId) {
      let evseStationWhere = { id: evseStationId };
      if (loggedInUserData.isCpo) {
        evseStationWhere = {
          id: evseStationId,
          cpoId: loggedInUserData.user.cpoId,
        };
      }

      const evseStation = await EvseStationRepository.findOne({
        where: evseStationWhere,
      });
      if (!evseStation) {
        return res
          .status(400)
          .json({ message: customErrorMsg.station.EVSE_STATION_NOT_FOUND });
      }

      whereCondition.id = evseStationId;
    }

    if (loggedInUserData?.isCpo) {
      whereCondition.cpoId = loggedInUserData.user.cpoId;
    }

    if (location) {
      if (loggedInUserData?.isCpo) {
        whereCondition.state = Like(`%${location}%`);
      } else if (loggedInUserData?.user?.eMspId) {
        whereCondition.country = location;
      } else {
        whereCondition.country = location;
      }
    }
    let allowedEvseStations = await EvseStationRepository.find({
      where: whereCondition,
      select: ["id"],
    });

    if (allowedEvseStations.length === 0) {
      return res.status(200).json({
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
      });
    }

    const stationIds = allowedEvseStations.map((station) => station.id);
    let baseQuery = {
      isDeleted: false,
    };
    baseQuery["evseStationId"] = {
      custom: true,
      value: `in("${stationIds.join('", "')}")`,
    };
    const listParams = {
      entityName: "ChargerExperienceFeedback",
      baseQuery,
      req,
    };

    const listResponse = await HandleMySqlList(listParams);
    const finalList = listResponse.list.map((feedback) => {
      return {
        rating: feedback.rating,
        review: feedback.review,
        createdAt: feedback.createdAt,
        createdAtLocal: feedback.createdAtLocal,
        timezone: feedback.timezone,
        id: feedback.id,
      };
    });
    listResponse.list = finalList;
    return res.status(200).json(listResponse);
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ error: "Error Retrieving Charging Experience Feedback List" });
  }
};

const updateConfiguration = async (chargerId, req, res) => {
  try {
    const { chargerModel, connectorTypeId, energyMeter, paymentModule } =
      req.body;
    const loggedInUserData = req.loggedInUserData;
    const charger = await ChargerViewRepository.findOne({
      where: { id: chargerId, isDeleted: false },
      select: ["id", "cpoId"],
    });
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: "Charger Not found!",
      });
    }
    if (
      !loggedInUserData?.user?.eMspId &&
      charger.cpoId != loggedInUserData?.user?.cpoId
    ) {
      return res.status(400).json({
        success: false,
        message: "Not a valid permissions!",
      });
    }
    const connectorData = await ChargerConnectorTypeRepository.findOne({
      where: {
        id: connectorTypeId,
      },
      select: ["id"],
    });
    if (!connectorData) {
      return res.status(400).json({
        success: false,
        message: "Connector type not found!",
      });
    }
    await ChargerRepository.update(
      { id: chargerId },
      { chargerModel, connectorTypeId, energyMeter, paymentModule },
    );
    const updatedCharger = await ChargerRepository.findOne({
      where: { id: chargerId },
    });
    return res.status(200).json(ObjectDAO(updatedCharger));
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ error: "Error Updating charger configurations" });
  }
};

const checkEligibility = async (req, res) => {
  try {
    const { id } = req.query;

    let charger = await ChargerRepository.createQueryBuilder("charger")
      .leftJoinAndSelect("charger.evseStationId", "evseStationId")
      .leftJoinAndSelect("charger.cpoId", "cpoId")
      .where("charger.serialNumber = :id", { id })
      .orWhere("charger.chargeBoxId = :id", { id })
      .orWhere("charger.id = :id", { id })
      .getOne();

    if (!charger) {
      return res.status(400).json({
        success: false,
        message: "Charger not found!",
      });
    }
    let reasonMessage = [];
    const response = {
      canOcppConnectWithCSMS: true,
      cpoAssiged: true,
      evseStationAssigned: true,
      registrationStatus: true,
      registrationDate: null,
      activationStatus: "activated",
      activationDate: null,
      currentStatus: "active",
      validTill: null,
      messages: [],
    };

    if (!charger?.cpoId?.id) {
      reasonMessage.push("CPO is not assigned to a Charger");
      response.cpoAssiged = false;
      response.canOcppConnectWithCSMS = false;
    }
    if (!charger?.evseStationId?.id) {
      reasonMessage.push("EvseStation is not assigned to a Charger");
      response.evseStationAssigned = false;
      response.canOcppConnectWithCSMS = false;
    }
    if (charger?.registeredBy) {
      response.registrationStatus = "registered";
      response.registrationDate = charger["registeredAt"];
      response.registrationDateLocal = charger["registeredAtLocal"];
    } else {
      response.registrationStatus = "not registered";
      response.canOcppConnectWithCSMS = false;
      reasonMessage.push("Charger is not registered");
    }
    let statusType = "activate";
    const notActivatedStatus = ["registered", "generated"];
    if (notActivatedStatus.includes(charger["status"])) {
      statusType = "not-activate";
    }

    if (statusType == "not-active") {
      response.activationStatus = "not activated";
      response.canOcppConnectWithCSMS = false;
      reasonMessage.push("Charger is not activated.");
    } else {
      response.activationStatus = "activated";
      response.activationDate = charger["activationDate"] || null;
      response.activationDateLocal = charger["activationDateLocal"] || null;
    }
    const notConnectStatus = ["disabled", "in-operative"];
    if (notConnectStatus.includes(charger["status"])) {
      ((response["canOcppConnectWithCSMS"] = false),
        reasonMessage.push(`Charger status is ${charger["status"]}`));
    }
    response.currentStatus = charger["status"];
    response.validTill = charger["validTill"] || null;
    response.validTillLocal = charger["validTillLocal"] || null;
    response["messages"] = reasonMessage;
    res.status(200).json({ ...response });
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ error: "Error while checking charger eligibility" });
  }
};

const getChargerConfigurations = async (req, res) => {
  try {
    const { chargeBoxId } = req.params;
    const charger = await ChargerRepository.findOne({
      where: { chargeBoxId, isDeleted: false },
      select: ["id"],
    });
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: "Charger Not found!",
      });
    }
    const response = await ChargerConfigurationModel.find({
      chargeBoxId,
    }).lean();
    if (response.length <= 0) {
      return res.status(200).json({
        success: true,
        configurations: [],
      });
    }
    // now process the configurations to parse the Json type configs
    const configurations = [];
    response.map((config) => {
      if (config.key?.startsWith("cnx_")) {
        const configs = JSON.parse(config.value);
        for (const key in configs) {
          configurations.push({
            key,
            value: configs[key],
            readonly: config?.readonly,
            isCnxKey: true,
          });
        }
      } else {
        configurations.push({
          key: config.key,
          value: config.value,
          readonly: config?.readonly,
          isCnxKey: false,
        });
      }
    });
    // attache types of configurations
    const configurations_with_type = configurations.map((config) => {
      if (ConfigurationTypeMap[config.key]) {
        config.type = ConfigurationTypeMap[config.key]["type"];
        return config;
      } else {
        return config;
      }
    });
    return res.status(200).json({
      success: true,
      configurations: configurations_with_type,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ error: "Error Retrieving Charger Configurations" });
  }
};

const changeConfigurations = async (req, res) => {
  try {
    const { chargeBoxId } = req.params;
    const { configurations } = req.body;

    const charger = await ChargerRepository.findOne({
      where: { chargeBoxId, isDeleted: false },
      select: ["id"],
    });

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: "Charger not found!",
      });
    }

    let getConfigResponse;
    try {
      getConfigResponse = await sendOcppEvent(
        chargeBoxId,
        OcppEvents.GetConfiguration,
        { key: [] },
      );
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Charger is not connected!",
      });
    }

    const { code: httpStatus, message: getConfigData } = getConfigResponse;

    if (httpStatus !== 200 || !getConfigData?.configurationKey) {
      return res.status(400).json({
        success: false,
        message: "Charger is not connected!",
      });
    }

    const currentConfigs = [];
    for (const item of getConfigData.configurationKey) {
      if (item.key?.startsWith("cnx_")) {
        try {
          const parsed = JSON.parse(item.value);
          for (const k in parsed) {
            currentConfigs.push({
              key: k,
              value: parsed[k],
              readonly: item.readonly,
            });
          }
        } catch {}
      } else {
        currentConfigs.push(item);
      }
    }

    const configMap = {};
    currentConfigs.forEach((c) => (configMap[c.key] = c));

    const noValue = [];
    const readOnly = [];
    const maxLen = [];

    for (const conf of configurations) {
      if (!conf.value) noValue.push(conf.key);

      if (configMap[conf.key]) {
        if (configMap[conf.key].readonly) readOnly.push(conf.key);
      }

      if (conf.value && conf.value.length > 500) maxLen.push(conf.key);
    }

    if (noValue.length)
      return res.status(400).json({
        success: false,
        message: `Values are required for keys: ${noValue.join(", ")}`,
      });

    if (readOnly.length)
      return res.status(400).json({
        success: false,
        message: `Cannot update readonly keys: ${readOnly.join(", ")}`,
      });

    if (maxLen.length)
      return res.status(400).json({
        success: false,
        message: `Max length exceeded for keys: ${maxLen.join(", ")}`,
      });

    for (const conf of configurations) {
      let changeResponse;

      try {
        changeResponse = await sendOcppEvent(
          chargeBoxId,
          OcppEvents.ChangeConfiguration,
          {
            key: conf.key,
            value: conf.value,
          },
        );
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: `Failed to update key: ${conf.key}`,
          error: err.message,
        });
      }

      const { code: changeHttp, message: ocppRes } = changeResponse;

      if (changeHttp !== 200) {
        return res.status(400).json({
          success: false,
          message: `HTTP error applying key: ${conf.key}`,
        });
      }

      if (ocppRes?.status !== "Accepted") {
        return res.status(400).json({
          success: false,
          message: `Charger rejected key: ${conf.key}`,
          detail: ocppRes,
        });
      }
    }

    // now trigger GetConfiguration event to update all configurations in DB
    await OcppGetConfigurationQueue.add(
      { clientId: chargeBoxId, connectorId: 1 },
      { delay: 0 },
    );

    return res.status(200).json({
      success: true,
      message: "All configurations applied successfully.",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const getChargerDetailsConfig = async (req, res) => {
  try {
    const { inputValue } = req.query;
    const charger = await getChargerDetailsData(inputValue, false, "min");
    if (!charger) {
      return res
        .status(404)
        .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
    }

    const { chargeBoxId } = charger;

    const chargerConfigs = await ChargerConfigurationModel.find({
      chargeBoxId: chargeBoxId,
    });

    const getConfigValue = (key) => {
      const config = chargerConfigs.find((conf) => conf.key === key);
      return config ? config.value : null;
    };

    const getJsonConfigValue = (key) => {
      const value = getConfigValue(key);
      try {
        return value ? JSON.parse(value) : {};
      } catch (error) {
        console.error(`Error parsing JSON for key ${key}:`, error);
        return {};
      }
    };

    const chargerInfo = getJsonConfigValue("cnx_ChargerInfo");
    const meteringConfig = getJsonConfigValue("cnx_meteringConfig");
    const ocppConfig = getJsonConfigValue("cnx_ocppConfig");
    const evseStation = getJsonConfigValue("cnx_evseStation");
    const paymentConfig = getJsonConfigValue("cnx_paymentConfig");

    const response = {
      serialNumber: chargerInfo.serialNumber || charger.serialNumber,
      chargeBoxId: chargeBoxId,
      vendor: chargerInfo.vendor || charger.vendor,
      chargerModel: chargerInfo.chargerModel || charger.chargerModel,
      chargerConnectorType:
        chargerInfo.chargerConnectorType || charger.chargerConnectorType,
      meteringConfig: {
        underCurrentLimitPerPhase:
          Number(meteringConfig.underCurrentLimitPerPhase) ||
          charger.meteringConfig?.underCurrentLimitPerPhase,
        maxCurrentLimitPerPhase:
          Number(meteringConfig.maxCurrentLimitPerPhase) ||
          charger.meteringConfig?.maxCurrentLimitPerPhase,
        noLoadTimeLimit:
          Number(meteringConfig.noLoadTimeLimit) ||
          charger.meteringConfig?.noLoadTimeLimit,
        wiringType:
          meteringConfig.wiringType || charger.meteringConfig?.wiringType,
        typicalVoltage:
          Number(meteringConfig.typicalVoltage) ||
          charger.meteringConfig?.typicalVoltage,
      },
      ocppConfig: {
        csmsURL: ocppConfig.csmsURL || charger.ocppConfig?.csmsURL,
        ocppVersion: ocppConfig.ocppVersion || charger.ocppConfig?.ocppVersion,
        certificatePath:
          ocppConfig.certificatePath || charger.ocppConfig?.certificatePath,
      },
      evseStation: {
        deviceAdminPassCode:
          evseStation.deviceAdminPassCode ||
          charger.evseStation?.deviceAdminPassCode,
        defaultLanguage:
          evseStation.defaultLanguage || charger.evseStation?.defaultLanguage,
        baseRateKWH:
          evseStation.baseRateKWH || charger.evseStation?.baseRateKWH,
        timezone: evseStation.timezone || charger.evseStation?.timezone
      },
      paymentConfig: {
        ...charger.paymentConfig,
        ...paymentConfig,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = {
  registerCharger,
  getChargerList,
  getChargerById,
  activateCharger,
  softDeleteCharger,
  changeChargerStatus,
  getChargerCounts,
  updateChargerLocation,
  updateCharger,
  getChargerLocationMapData,
  updateChargerCost,
  addConnector,
  getChargerDetails,
  getConnectorPairListing,
  getChargerModelListing,
  resendActivateCode,
  getConnectedClientsList,
  updateChargerTimezone,
  sendMeterValues,
  calculateChargingAmount,
  updateChargingStatus,
  getBaseFareUnitForCharger,
  getFirstMeterValueForCharger,
  getLastMeterValueForCharger,
  uploadRapidLogs,
  verifyDeviceAdmin,
  getAddress,
  getIPAddress,
  getAllOcppLogs,
  getOcppLogs,
  getOcppBootNotificationLogs,
  getOcppHeartbeatLogs,
  getOcppMeterValueLogs,
  getOcppTransactionLogs,
  chargingCalculations,
  setChargerOcppConfig,
  setChargerMeteringConfig,
  setChargerPaymentConfig,
  assignCpoAndEvseStation,
  assignCpo,
  assignEvseStation,
  updatePrintSticker,
  chargingExperienceFeedback,
  sendTransactionReceipt,
  getFeedbackAverage,
  chargingExperienceFeedbackList,
  chargingExperienceFeedbackListByChargeBoxId,
  getChargersOverview,
  checkEligibility,
  assignCpoBulk,
  softDeleteChargers,
  assignEvseStationBulk,
  getFeedbackMessages,
  getChargerLanguage,
  setChargerLanguage,
  updateConfiguration,
  getStatusList,
  setChargerConstant,
  getChargerConstant,
  getAuthCode,
  getChargerConfigurations,
  changeConfigurations,
  getChargerDetailsConfig,
};
