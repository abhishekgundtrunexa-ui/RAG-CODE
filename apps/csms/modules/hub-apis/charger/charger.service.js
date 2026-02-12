const {
  PusherConstants,
  NotificationTypes,
  ChargerStatuses,
  ExpireTimeConstants,
} = require("@shared-libs/constants");
const {
  ChargerRepository,
  ChargerUsageTypeRepository,
  ChargerOcppConfigRepository,
  ChargerMeteringConfigRepository,
  ChargerVersionRepository,
  ChargerPaymentConfigRepository,
  ChargerViewRepository,
  ContractChargerViewRepository,
  ChargerModelRepository,
  ChargerConnectorTypeRepository,
  EvseStationRepository,
} = require("@shared-libs/db/mysql");
const { DateTime } = require("luxon");
const {
  generateRandomOtp,
  getConfigConstants,
  convertDateTimezone,
  ObjectDAO,
  getChargerDetailsData,
  getChargerContract,
  getChargerCards,
  getIpData,
  getNearByEvseStationWithoutPartner,
  getEvseStationCode,
  getEmspRatesByCountry,
} = require("@shared-libs/helpers");
const { In } = require("typeorm");
const { HandleMySqlList } = require("@shared-libs/db");

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

const getChargerList = async (deleted = false, req, res) => {
  try {
    const { partnerType, partnerId = null } = req.query;
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

const registerCharger = async (payload, req, res) => {
  let { serialNumber, country, meteringConfig } = payload;
  serialNumber = serialNumber.replace(/-/g, "");
  serialNumber = serialNumber.replace(/ /g, "");

  if (serialNumber != null) {
    const existingCharger = await ChargerRepository.findOne({
      where: { serialNumber },
    });
    if (existingCharger) {
      return res
        .status(400)
        .json({ message: "Charger with this Serial Number already exists" });
    }
  }

  const [chargeUsageType, connectorType1, connectorType2, geoLocation] =
    await Promise.all([
      ChargerUsageTypeRepository.findOne({
        where: { mappingText: "public" },
      }),

      ChargerConnectorTypeRepository.findOne({
        where: { mappingText: "type_1" },
        select: ["id"],
      }),

      ChargerConnectorTypeRepository.findOne({
        where: { mappingText: "type_2" },
        select: ["id"],
      }),

      getIpData(req),
    ]);

  let timezone = null;

  try {
    timezone = geoLocation?.timezone ?? "Asia/Kolkata";
    country = geoLocation?.country ?? "IN";
  } catch (error) {
    timezone = null;
    country = "IN";
  }

  const chargeBoxId = serialNumber;
  const uniqueId = serialNumber;

  const createdCharger = await ChargerRepository.save({
    serialNumber,
    chargeBoxId,
    uniqueId,
    country,
    timezone,
    chargerModel: "Lite",
    connectorTypeId: country == "IN" ? connectorType2?.id : connectorType1?.id,
    energyMeter: "",
    paymentModule: "IDTech",
    deviceAdminPassCode: generateRandomOtp(6),
    activationCode: generateRandomOtp(6),
    chargingMode: "Online",
    chargeUsageTypeId: chargeUsageType.id,
    registeredAt: DateTime.utc().toISO(),
    status: ChargerStatuses.ACTIVATED,
    isConfigured: true,
    activationDate: DateTime.utc().toISO(),
    activationDateLocal: convertDateTimezone(DateTime.utc(), timezone ?? "UTC"),
    validTill: DateTime.utc()
      .plus({ year: ExpireTimeConstants.CHARGER_VALID_TILL })
      .toISO(),
    validTillLocal: convertDateTimezone(
      DateTime.utc().plus({ year: ExpireTimeConstants.CHARGER_VALID_TILL }),
      timezone ?? "UTC",
    ),
    registeredAtLocal: convertDateTimezone(DateTime.utc(), timezone ?? "UTC"),
    createdAtLocal: convertDateTimezone(DateTime.utc(), timezone ?? "UTC"),
    updatedAtLocal: convertDateTimezone(DateTime.utc(), timezone ?? "UTC"),
  });

  const returnData = {};

  if (createdCharger?.id) {
    await ChargerOcppConfigRepository.save({
      chargerId: createdCharger.id,
    });

    await ChargerMeteringConfigRepository.save({
      chargerId: createdCharger.id,
      ...meteringConfig,
    });

    returnData["chargerId"] = createdCharger.id;
    returnData["chargeBoxId"] = createdCharger.chargeBoxId;
    returnData["serialNumber"] = createdCharger.serialNumber;
  }
  return res.status(200).json(returnData);
};

module.exports = {
  registerCharger,
  getChargerList,
  getChargerById,
};
