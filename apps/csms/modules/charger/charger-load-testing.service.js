const { DateTime } = require("luxon");
const {
  ChargerConnectorTypeRepository,
  CpoBaseRateRepository,
  ChargerUsageTypeRepository,
  ChargerRepository,
  ChargerOcppConfigRepository,
  CpoRepository,
  CpoUserRoleRepository,
  CpoUserRepository,
  CpoUserCredentialRepository,
  EvseStationRepository,
  ChargerMeterValuesRepository,
  OcppTransactionsRepository,
  TestingConfigurationRepository,
} = require("@shared-libs/db/mysql");
const {
  customErrorMsg,
  ExpireTimeConstants,
  NotificationTypes,
  PusherConstants,
  ChargerStatuses,
} = require("@shared-libs/constants");
const {
  DefaultCpoUserRole,
  DefaultCpoPermissions,
} = require("@shared-libs/constants/cpo");
const {
  generateChargeBoxId,
  generateRandomCode,
  toSnakeCase,
  getBaseRateAndLocationByCharger,
  getConfigConstants,
  generateRandomOtp,
} = require("@shared-libs/helpers");
const { saveNotification } = require("@shared-libs/notification");
const { sendDataToPusher } = require("@shared-libs/pusher");
const { CurrencyData } = require("@shared-libs/constants/country-currency");
const { Like, In } = require("typeorm");
const {
  BootNotificationModel,
  OcppBootNotificationLogModel,
  OcppMeterValueLogModel,
  OcppLogModel,
  OcppHeartbeatLogModel,
  UtilizationRateModel,
  NotificationModel,
  OcppTransactionLogModel,
  OcppAllLogModel,
} = require("@shared-libs/db/mongo-db");

const loadTestingChargerService = async (req, res) => {
  const { chargers } = req.body;
  if (chargers <= 0 || !chargers) {
    return res
      .status(400)
      .json({ success: false, message: "provide valid number of chargers." });
  }
  if (chargers > 100) {
    return res
      .status(400)
      .json({ success: false, message: "Provide number in between 1 to 100" });
  }
  // create all required data for charger
  // connectoreTypeId, cpoId, evseStationId

  // create connectorTypeId
  const connectorTypeData = await ChargerConnectorTypeRepository.findOne({
    where: { displayText: "CC2" },
  });
  const connectorTypeId = connectorTypeData.id;

  // create test cpoId
  const cpoUserData = await addCpoLoadTest();
  const cpoId = cpoUserData.cpoId;

  // create evseStationId
  const evseStationData = await addEvseStationLoadTest({ cpoId });
  const evseStationId = evseStationData.id;

  const country = "IN";
  // const { chargerModel, connectorTypeId, country } =  { "PR"  }
  // let { serialNumber } = payload;

  // now create all chargers by generating serialNumbers
  const serialNumbers = [];
  for (let i = 0; i < chargers; i++) {
    serialNumbers.push(generateSerialNumber());
  }

  const chargersData = await Promise.all(
    serialNumbers.map(async (serialNumber) => {
      const chargerExist = await ChargerRepository.findOne({
        where: { serialNumber },
      });

      if (chargerExist) {
        return res
          .status(400)
          .json({ message: customErrorMsg.charger.CHARGER_ALREADY_EXISTS });
      }

      const connectorType = await ChargerConnectorTypeRepository.findOne({
        where: { id: connectorTypeId },
      });

      if (!connectorType) {
        return res
          .status(404)
          .json({ message: customErrorMsg.charger.INVALID_CONNECTOR_TYPE });
      }

      const chargeUsageType = await ChargerUsageTypeRepository.findOne({
        where: { mappingText: "public" },
      });

      const chargerCreatePayload = {
        serialNumber,
        chargerModel: "PR",
        connectorTypeId,
        country,
        chargingMode: "Online",
        chargeUsageTypeId: chargeUsageType.id,
        deviceAdminPassCode: generateRandomOtp(6),
        activationCode: generateRandomOtp(6),
        registeredBy: cpoId,
        registeredAt: DateTime.utc().toISO(),
      };

      if (country) {
        const { manufacturerInitials, chargerModelPrime } =
          await getConfigConstants([
            "manufacturerInitials",
            "chargerModelPrime",
          ]);

        const generateChargeBoxIdConfig = {
          manufacturerInitials,
          chargerModelPrime,
          country: "IN",
          registeredAt: chargerCreatePayload.registeredAt,
        };

        const { chargeBoxId, uniqueId, timezone } = await generateChargeBoxId(
          generateChargeBoxIdConfig
        );

        chargerCreatePayload["chargeBoxId"] = chargeBoxId;
        chargerCreatePayload["uniqueId"] = uniqueId;
        chargerCreatePayload["timezone"] = timezone;
        chargerCreatePayload["country"] = country;
      }

      const createdCharger = await ChargerRepository.save(chargerCreatePayload);
      if (createdCharger?.id) {
        const chargerOcppConfigData = await ChargerOcppConfigRepository.findOne(
          {
            where: { chargerId: createdCharger.id },
          }
        );
        if (!chargerOcppConfigData?.id) {
          await ChargerOcppConfigRepository.save({
            chargerId: createdCharger.id,
          });
        }
      }

      const chargerCreatedData = await ChargerRepository.findOne({
        where: { id: createdCharger.id },
        relations: ["connectorTypeId"],
      });

      // assign cpo and evsestation to the charger and activate
      const updatedCharger = await assignCpoAndEvseStationLoadTest({
        cpoId,
        evseStationId,
        chargerId: createdCharger.id,
      });
      const activatedCharger = await activateChargerLoadTest({ serialNumber });
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
      return {
        serialNumber: activatedCharger.serialNumber,
        chargeBoxId: activatedCharger.chargeBoxId,
      };
    })
  );

  res.status(201).json(chargersData);
};

function generateSerialNumber(prefix = "LoadTestCGX") {
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${randomString}`;
}

const activateChargerLoadTest = async ({ serialNumber }) => {
  let timezone = "";

  const {
    activationCode = "000000",
    lat = "12.222333",
    lng = "34.334333",
  } = {};

  try {
    const charger = await ChargerRepository.findOne({
      where: { serialNumber },
    });

    if (!charger) {
      throw new Error(customErrorMsg.charger.CHARGER_NOT_FOUND);
    }

    if (charger.status === ChargerStatuses.ACTIVATED) {
      throw new Error(customErrorMsg.charger.CHARGER_ALREADY_ACTIVE);
    }

    //   if (charger.status !== ChargerStatuses.REGISTERED) {
    //     throw new Error(customErrorMsg.charger.CHARGER_NOT_REGISTERED);
    //   }

    if (activationCode !== "000000") {
      if (charger.activationCode !== activationCode) {
        throw new Error(customErrorMsg.charger.INVALID_ACTIVATION_CODE);
      }

      const currentTimestamp = DateTime.utc().toMillis();
      const tokenExpireTimestamp = DateTime.fromJSDate(
        charger.activationExpiresAt
      ).toMillis();

      if (currentTimestamp > tokenExpireTimestamp) {
        throw new Error(customErrorMsg.charger.ACTIVATION_CODE_EXPIRED);
      }
    }

    if (!charger.evseStationId) {
      throw new Error("Evse Station Is Not Assigned To The Charger.");
    }

    const evseStation = await EvseStationRepository.findOne({
      where: { id: charger.evseStationId },
    });

    if (!evseStation) {
      throw new Error("Evse Station Is Not Assigned To The Charger.");
    }

    const distance = await getConfigConstants([
      "maxDistanceBetweenChargerAndStation",
    ]);

    //   const isWithinDistance = arePointsWithinDistance(
    //     lat,
    //     lng,
    //     evseStation.lat,
    //     evseStation.lng,
    //     Number(distance)
    //   );

    //   if (isWithinDistance == false) {
    //     throw new Error(customErrorMsg.charger.EVSE_STATION_AND_CHARGER_LOCATION_NOT_MATCH);
    //   }

    const updateChargerPayload = {
      status: ChargerStatuses.ACTIVATED,
      activationDate: DateTime.utc().toISO(),
      validTill: DateTime.utc()
        .plus({ year: ExpireTimeConstants.CHARGER_VALID_TILL })
        .toISO(),
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

    return {
      serialNumber: updatedCharger.serialNumber,
      chargeBoxId: updatedCharger.chargeBoxId,
    };
  } catch (error) {
    console.error("Error in activateCharger:", error);
    throw new Error("An Error Occurred While Activating The Charger");
  }
};

const assignCpoAndEvseStationLoadTest = async ({
  chargerId,
  cpoId,
  evseStationId,
}) => {
  try {
    const charger = await ChargerRepository.findOne({
      where: { id: chargerId, isDeleted: false },
    });

    if (!charger) {
      throw new Error(customErrorMsg.charger.CHARGER_NOT_FOUND);
    }

    const cpo = await CpoRepository.findOne({
      where: { id: cpoId, isDeleted: false },
    });

    if (!cpo) {
      throw new Error("CPO Not Found");
    }

    if (!charger?.cpoId !== cpoId) {
      // Check Subscription Limit
      // let subscriptionUsage = await getSubscriptionUsage(cpoId);
      // subscriptionUsage = subscriptionUsage?.chargers;
      // if (subscriptionUsage?.limit - subscriptionUsage?.used <= 0) {
      //   return res.status(400).json({
      //     message: "CPO Has Exceeded The Limit Of Assigning Chargers.",
      //   });
      // }
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

    //   const cpoAdminUsers = await CpoUserViewRepository.find({
    //     where: { cpoId, cpoUserRoleCode: "cpo_admin" },
    //     select: ["email"],
    //   });

    //   const toEmails = cpoAdminUsers.map(({ email }) => email);

    //   const { html, data } = await getDynamicHtml({
    //     htmlTemplatePath: "/templates/charger-activation.html",
    //     data: {
    //       serialNumber: await formatSerialNumber(updatedCharger.serialNumber),
    //       deviceAdminPassCode: updatedCharger.deviceAdminPassCode,
    //       activationCode,
    //     },
    //   });

    //   // Send email: Charger Activation
    //   await EmailQueue.add({
    //     to: toEmails,
    //     subject: EmailConstants.subject.CHARGER_ACTIVATION,
    //     html,
    //     templateData: data,
    //   });

    return updatedCharger;
  } catch (error) {
    console.error("Error assigning cpo to charger:", error);
    res.status(500).json({ message: "An Error Occurred." });
  }
};

const addEvseStationLoadTest = async ({ cpoId }) => {
  try {
    const {
      name = "loadTestStation",
      address = "Mumbai",
      city = "Mumbai",
      state = "Maharashtra",
      areaCode = "422605",
      lat = "12.222333",
      lng = "34.334333",
      country = "IN",
    } = {};
    // create baseRateId
    const baseRateData = await addCpoBaseRateLoadTest({ cpoId });
    const baseRateId = baseRateData.id;

    const newEvseStation = {
      name,
      address,
      city,
      state,
      areaCode,
      lat,
      lng,
      country,
      createdBy: cpoId,
    };

    if (cpoId) {
      const cpo = await CpoRepository.findOne({
        where: { id: cpoId, isDeleted: false },
      });
      if (!cpo) {
        throw new Error("CPO Not Found");
      }

      // Check Subscription Limit
      // let subscriptionUsage = await getSubscriptionUsage(cpoId);
      // subscriptionUsage = subscriptionUsage?.stations;

      // if (subscriptionUsage?.limit - subscriptionUsage?.used <= 0) {
      //   return res.status(400).json({
      //     message: "CPO Has Exceeded The Limit Of Assigning EVSE Station",
      //   });
      // }

      newEvseStation["cpoId"] = cpoId;

      // if (!baseRateId) {
      //   const cpoDefaultBaseRate = await CpoBaseRateRepository.findOne({
      //     where: { cpoId, isDefault: true, isDeleted: false },
      //   });
      //   if (cpoDefaultBaseRate) {
      //     baseRateId = cpoDefaultBaseRate.id;
      //   }
      // }
    }

    if (baseRateId) {
      const cpoBaseRate = await CpoBaseRateRepository.findOne({
        where: { id: baseRateId, isDeleted: false },
      });
      if (!cpoBaseRate) {
        return res.status(404).json({ message: "CPO Base Rate Not Found" });
      }
      if (cpoId) {
        if (cpoBaseRate.cpoId !== cpoId) {
          return res.status(404).json({ message: "CPO Base Rate Not Found" });
        }
      }
      newEvseStation["baseRateId"] = baseRateId;
    }

    const createdEvseStation = await EvseStationRepository.save(newEvseStation);

    await sendDataToPusher({
      channelName: PusherConstants.channels.PUSHER_NODE_APP,
      eventName: PusherConstants.events.evse.EVSE_UPDATED,
      data: { evseStationId: createdEvseStation.id },
    });

    if (cpoId) {
      await sendDataToPusher({
        channelName: cpoId,
        eventName: PusherConstants.events.evse.EVSE_UPDATED,
        data: { evseStationId: createdEvseStation.id },
      });
    }

    await saveNotification({
      cpoId,
      data: {
        evseStationId: createdEvseStation.id,
      },
      type: NotificationTypes.EVSE_STATION_CREATED,
    });

    return createdEvseStation;
  } catch (error) {
    console.error("Error in addEvseStation:", error);
    throw error;
  }
};

const addCpoBaseRateLoadTest = async ({ cpoId }) => {
  try {
    const {
      baseRateKWH = "0.56",
      parkingRate = "10",
      taxRate = "6",
      discount = "0",
      penalty = "5",
      name = "BR0",
      currency = "USD",
    } = {};

    //   const checkName = await CpoBaseRateRepository.findOne({
    //     where: { cpoId, name, isDeleted: false },
    //   });

    //   if (checkName) {
    //     return res
    //       .status(400)
    //       .json({ message: "Base Rate Name Already Exists." });
    //   }

    let currencyName = null;
    let currencySymbol = null;
    if (currency) {
      const currencyDetails = CurrencyData[currency] ?? null;

      if (currencyDetails) {
        currencyName = currencyDetails.name;
        currencySymbol = currencyDetails.symbol;
      }
    }

    let isDefault = false;
    const allBaseRates = await CpoBaseRateRepository.find({
      where: { cpoId, isDeleted: false },
    });
    if (allBaseRates.length === 0) {
      isDefault = true;
    }

    const createdCpoBaseRate = await CpoBaseRateRepository.save({
      cpoId,
      baseRateKWH,
      name,
      parkingRate,
      taxRate,
      discount,
      penalty,
      currency,
      currencyName,
      currencySymbol,
      isDefault,
    });

    return createdCpoBaseRate;
  } catch (error) {
    throw error;
  }
};

const addCpoLoadTest = async () => {
  const {
    cpoName = "LoadTest",
    cpoCountry = "IN",
    firstName = "Load",
    lastName = "Test",
    email = `loadtesting@loadtesting.com`,
    phoneNumber = "9999999999",
  } = {};

  try {
    // if (email) {
    //     const checkEmail = await checkUserEmail({ email });
    //     if (checkEmail?.code == 400) {
    //         throw new Error(checkEmail?.data);
    //     }
    // }

    // if (phoneNumber) {
    //     const checkPhone = await checkUserPhone({ phoneNumber });
    //     if (checkPhone?.code == 400) {
    //         throw new Error(checkPhone?.data);
    //     }
    // }

    const createdCpo = await CpoRepository.save({
      name: cpoName,
      country: cpoCountry,
    });
    const createdCpoUserRole = await CpoUserRoleRepository.save({
      cpoId: createdCpo.id,
      name: DefaultCpoUserRole,
      code: toSnakeCase(DefaultCpoUserRole),
      permissions: DefaultCpoPermissions,
      isDefault: true,
    });

    const codeToSend = generateRandomCode(6);
    const resetPasswordExpiresAt = DateTime.utc()
      .plus({ day: ExpireTimeConstants.USER_SET_PASSWORD_CODE })
      .toISO();
    const resetPasswordRequestedAt = DateTime.utc().toISO();

    const createUserPayload = {
      cpoId: createdCpo.id,
      cpoUserRoleId: createdCpoUserRole.id,
      firstName,
      lastName,
      email,
      phoneNumber,
      resetPasswordCode: codeToSend,
      resetPasswordExpiresAt: resetPasswordExpiresAt,
      resetPasswordRequestedAt: resetPasswordRequestedAt,
      isOwner: true,
    };

    const createdCpoUser = await CpoUserRepository.save(createUserPayload);
    await CpoUserCredentialRepository.save({ cpoUserId: createdCpoUser.id });

    // const { html, data } = await getDynamicHtml({
    //     htmlTemplatePath: "/templates/invite-user.html",
    //     data: {
    //         userName: `${createdCpoUser.firstName} ${createdCpoUser.lastName}`,
    //         inviteCode: codeToSend,
    //         registrationLink: `${process.env.CORE_BASEURL}`,
    //     },
    // });

    // // Send registration email
    // await EmailQueue.add({
    //     to: [createdCpoUser.email],
    //     subject: EmailConstants.subject.WELCOME_TO_CHARGE_NEX,
    //     html,
    //     templateData: data,
    // });

    await saveNotification({
      data: {
        cpoId: createdCpo.id,
        cpoUserId: createdCpoUser.id,
        name: `${createdCpoUser.firstName} ${createdCpoUser.lastName}`,
        email: createdCpoUser.email,
      },
      type: NotificationTypes.CPO_REGISTERED,
    });

    return createdCpoUser;
  } catch (error) {
    console.error("Error adding CPO:", error);
    throw error;
  }
};

const clearLoadTestingChargerService = async (req, resp) => {
  try {
    // first fetch all the load testing chargers with serialNumber and chargBoxId
    const chargers_raw = await ChargerRepository.find({
      where: {
        serialNumber: Like("LoadTest%"),
      },
      select: ["serialNumber", "chargeBoxId", "cpoId", "evseStationId", "id"],
    });

    if (!chargers_raw.length) {
      return resp.status(200).json({
        success: true,
        message: "No Testing data found",
      });
    }
    const chargers = chargers_raw.filter((charger) => {
      if (charger.chargeBoxId == "CGXINPRM2025236F4E") {
        return false;
      }
      return true;
    });

    const serialNumbers = chargers.map((charger) => charger.serialNumber);
    const chargeBoxIds = chargers.map((charger) => charger.chargeBoxId);
    const cpoIds = chargers.map((charger) => charger?.cpoId);
    // const evseStationIds = chargers.map(charger => charger?.evseStationId);
    const chargerIds = chargers.map((charger) => charger.id);
    const cpoUserIds = await CpoUserRepository.find({
      where: { cpoId: In(cpoIds) },
      select: ["id"],
    });

    const deletedCounts = {};

    // Delete records from different models and store counts
    deletedCounts.ocppBootNotificationLog =
      await OcppBootNotificationLogModel.deleteMany({
        $or: [
          { clientId: { $in: serialNumbers } },
          { clientId: { $in: chargeBoxIds } },
        ],
      }).then((res) => res.deletedCount);

    deletedCounts.bootNotificationLog = await BootNotificationModel.deleteMany({
      $or: [
        { clientId: { $in: serialNumbers } },
        { clientId: { $in: chargeBoxIds } },
      ],
    }).then((res) => res.deletedCount);

    deletedCounts.ocppMeterValueLog = await OcppMeterValueLogModel.deleteMany({
      $or: [
        { clientId: { $in: serialNumbers } },
        { clientId: { $in: chargeBoxIds } },
      ],
    }).then((res) => res.deletedCount);

    deletedCounts.chargerMeterValues =
      await ChargerMeterValuesRepository.createQueryBuilder()
        .delete()
        .where("chargeBoxId IN (:...serialNumbers)", { serialNumbers })
        .orWhere("chargeBoxId IN (:...chargeBoxIds)", { chargeBoxIds })
        .execute()
        .then((res) => res.affected);

    deletedCounts.ocppLog = await OcppLogModel.deleteMany({
      $or: [
        { clientId: { $in: serialNumbers } },
        { clientId: { $in: chargeBoxIds } },
      ],
    }).then((res) => res.deletedCount);

    deletedCounts.ocppHeartbeatLog = await OcppHeartbeatLogModel.deleteMany({
      $or: [
        { clientId: { $in: serialNumbers } },
        { clientId: { $in: chargeBoxIds } },
      ],
    }).then((res) => res.deletedCount);

    deletedCounts.ocppAllLog = await OcppAllLogModel.deleteMany({
      $or: [
        { clientId: { $in: serialNumbers } },
        { clientId: { $in: chargeBoxIds } },
      ],
    }).then((res) => res.deletedCount);

    deletedCounts.utilizationRate = await UtilizationRateModel.deleteMany({
      $or: [
        { clientId: { $in: serialNumbers } },
        { clientId: { $in: chargeBoxIds } },
      ],
    }).then((res) => res.deletedCount);

    deletedCounts.notificationModel = await NotificationModel.deleteMany({
      cpoId: { $in: cpoIds },
    }).then((res) => res.deletedCount);

    deletedCounts.ocppTransactionLog = await OcppTransactionLogModel.deleteMany(
      {
        $or: [
          { clientId: { $in: serialNumbers } },
          { clientId: { $in: chargeBoxIds } },
        ],
      }
    ).then((res) => res.deletedCount);

    deletedCounts.ocppTransactions =
      await OcppTransactionsRepository.createQueryBuilder()
        .delete()
        .where("chargeBoxId IN (:...serialNumbers)", { serialNumbers })
        .orWhere("chargeBoxId IN (:...chargeBoxIds)", { chargeBoxIds })
        .execute()
        .then((res) => res.affected);

    deletedCounts.cpoUserCredential =
      await CpoUserCredentialRepository.createQueryBuilder()
        .delete()
        .where("cpoUserId IN (:...cpoUserIds)", { cpoUserIds })
        .execute()
        .then((res) => res.affected);

    deletedCounts.cpoUserRole = await CpoUserRoleRepository.createQueryBuilder()
      .delete()
      .where("cpoId IN (:...cpoIds)", { cpoIds })
      .execute()
      .then((res) => res.affected);

    deletedCounts.cpoBaseRate = await CpoBaseRateRepository.createQueryBuilder()
      .delete()
      .where("cpoId IN (:...cpoIds)", { cpoIds })
      .execute()
      .then((res) => res.affected);

    deletedCounts.cpoUser = await CpoUserRepository.createQueryBuilder()
      .delete()
      .where("cpoId IN (:...cpoIds)", { cpoIds })
      .execute()
      .then((res) => res.affected);

    deletedCounts.chargerOcppConfig =
      await ChargerOcppConfigRepository.createQueryBuilder()
        .delete()
        .where("chargerId IN (:...chargerIds)", { chargerIds })
        .orWhere("chargerId IN (:...chargeBoxIds)", { chargeBoxIds })
        .orWhere("chargerId IN (:...serialNumbers)", { serialNumbers })
        .execute()
        .then((res) => res.affected);

    deletedCounts.charger = await ChargerRepository.createQueryBuilder()
      .delete()
      .where("id IN (:...chargerIds)", { chargerIds })
      .orWhere("chargeBoxId IN (:...chargeBoxIds)", { chargeBoxIds })
      .orWhere("serialNumber IN (:...serialNumbers)", { serialNumbers })
      .execute()
      .then((res) => res.affected);

    deletedCounts.evseStation = await EvseStationRepository.createQueryBuilder()
      .delete()
      .where("cpoId IN (:...cpoIds)", { cpoIds })
      .execute()
      .then((res) => res.affected);

    deletedCounts.cpo = await CpoRepository.createQueryBuilder()
      .delete()
      .where("id IN (:...cpoIds)", { cpoIds })
      .execute()
      .then((res) => res.affected);

    // Respond with the deleted counts
    resp.json({
      success: true,
      message: "Testing chargers and associated data cleared",
      deletedCounts,
    });
  } catch (error) {
    console.log(error.message);
    throw error;
    // return resp.status(200).json({
    //     success: false,
    //     message: error.message
    // });
  }
};

const createTestConfiguration = async (req, res) => {
  try {
    const {
      type,
      description,
      startDate,
      endDate,
      serialNumber,
      chargeBoxId,
      meterStart,
      meterStop,
      preAuthAmount,
      captureAmount,
      versionNo,
      status,
    } = req.body;
    const configuration =
      await TestingConfigurationRepository.createQueryBuilder()
        .where("serialNumber = :serialNumber", { serialNumber })
        .orWhere("chargeBoxId = :chargeBoxId", { chargeBoxId })
        .getOne();

    const configPayload = {
      type,
      description,
      startDate,
      endDate,
      serialNumber,
      chargeBoxId,
      meterStart,
      meterStop,
      preAuthAmount,
      captureAmount,
      versionNo,
      status,
    };

    if (configuration) {
      // update the configuration and send updated one
      await TestingConfigurationRepository.update(
        { chargeBoxId, serialNumber },
        configPayload
      );
      const updatedPayload = await TestingConfigurationRepository.findOne({
        where: {
          chargeBoxId,
          serialNumber,
        },
      });
      return res.status(200).json({
        success: true,
        message: `Testing configuration updated for ${chargeBoxId}`,
        ...updatedPayload,
      });
    }

    const createdConfig = await TestingConfigurationRepository.save({
      type,
      description,
      startDate,
      endDate,
      serialNumber,
      chargeBoxId,
      meterStart,
      meterStop,
      preAuthAmount,
      captureAmount,
      versionNo,
      status,
    });

    return res.status(201).json({
      success: true,
      ...createdConfig,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const deleteTestConfiguration = async (req, res) => {
  try {
    const { id } = req.query;

    await TestingConfigurationRepository.createQueryBuilder()
      .delete()
      .where("serialNumber = :serialNumber", { serialNumber: id })
      .orWhere("chargeBoxId = :chargeBoxId", { chargeBoxId: id })
      .execute();

    return res.status(201).json({
      success: true,
      message: `Testing configuration deleted for ${id}`,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
module.exports = {
  loadTestingChargerService,
  clearLoadTestingChargerService,
  createTestConfiguration,
  deleteTestConfiguration,
};
