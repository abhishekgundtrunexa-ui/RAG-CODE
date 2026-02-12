const { DateTime } = require("luxon");
const { randomBytes } = require("crypto");
const i18nIsoCountries = require("i18n-iso-countries");
i18nIsoCountries.registerLocale(require("i18n-iso-countries/langs/en.json"));
const {
  ChargerRepository,
  EvseStationRepository,
  ChargerSerialNumberLogsRepository,
  ConfigConstantsRepository,
  CpoUserRepository,
  UserRepository,
  CpoSubscriptionRepository,
  SubscriptionPlanRepository,
  CpoUserRoleRepository,
  OcppTransactionsRepository,
  ChargerMeteringConfigRepository,
  ChargerOcppConfigRepository,
  ChargerUsageTypeRepository,
  PaymentTransactionsRepository,
  ChargerMeterValuesRepository,
  LocalizationCodesRepository,
  ChargerPaymentConfigRepository,
  TestingConfigurationRepository,
  ChargerEtTestingRepository,
  ChargerLanguageRepository,
  ChargerConstantsRepository,
  RegionalElectricityRateRepository,
  LanguageRepository,
  ChargerAuthCodesRepository,
  ChargerViewRepository,
  ContractViewRepository,
  ChargerCardRepository,
  ChargerRevenueRepository,
  SettlementRepository,
  EMspUserRepository,
  EMspPaymentConfigRepository,
  EMspBusinessTaxDetailsRepository,
  EMspRepository,
} = require("@shared-libs/db/mysql");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const {
  CountryModel,
  TransactionErrorLogsModel,
  OcppLogModel,
  PreauthCompleteLogsModel,
  RolloutDeviceStatesModel,
  MessagesToTranslateModel,
  IpDataModel,
  AnalyticsModel,
} = require("@shared-libs/db/mongo-db");
const geoIp = require("geoip-lite");
const { In, IsNull, Not } = require("typeorm");
const {
  ChargerStatuses,
  PusherConstants,
  MeterValuesFieldMapping,
  ChargingStatuses,
  RolloutDeviceStates,
  OcppEvents,
  OcppConstants,
} = require("@shared-libs/constants");
const { sendDataToPusher } = require("@shared-libs/pusher");
const { getPaymentQrCode } = require("@shared-libs/razorpay");
const { default: axios } = require("axios");

const nodeEmv = require("node-emv");
const { CurrencyData } = require("@shared-libs/constants/country-currency");
const {
  supportedChargerConfigurationKeys,
} = require("@shared-libs/constants/supported-configuration-keys");

const validateEmail = function (email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const generateRandomOtp = (length) => {
  return Math.floor(
    Math.pow(10, length - 1) +
      Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1),
  );
};

const generateRandomCode = (length) => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    code += charset.charAt(randomIndex);
  }
  return code;
};

const getSettlementCode = async (length = 6) => {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const prefix = "CGX";

  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    code += charset.charAt(randomIndex);
  }

  // Loop until a unique code is generated
  while (
    await SettlementRepository.findOne({
      where: { settlementId: `${prefix}${code}` },
    })
  ) {
    let code = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      code += charset.charAt(randomIndex);
    }
  }

  return `${prefix}${code}`;
};

const getEvseStationCode = async (length = 6) => {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const prefix = "CGX";

  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    code += charset.charAt(randomIndex);
  }

  // Loop until a unique code is generated
  while (
    await EvseStationRepository.findOne({
      where: { code: `${prefix}${code}` },
    })
  ) {
    let code = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      code += charset.charAt(randomIndex);
    }
  }

  return `${prefix}${code}`;
};

const getNearByEvseStation = async (partnerId, lat, lng, maxDistance = 500) => {
  return await EvseStationRepository.createQueryBuilder("evseStation")
    .select([
      "evseStation.*",
      `(6371000 * acos(
          cos(radians(:lat)) * cos(radians(evseStation.lat)) *
          cos(radians(evseStation.lng) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(evseStation.lat))
      )) AS distance`,
    ])
    .where("evseStation.lat IS NOT NULL")
    .andWhere("evseStation.lng IS NOT NULL")
    .andWhere("evseStation.partnerId = :partnerId", { partnerId })
    .having("distance < :maxDistance")
    .setParameters({
      lat,
      lng,
      maxDistance: Number(maxDistance),
    })
    .orderBy("distance", "ASC")
    .getRawOne();
};

const getNearByEvseStationWithoutPartner = async (
  lat,
  lng,
  maxDistance = 500,
) => {
  return await EvseStationRepository.createQueryBuilder("evseStation")
    .select([
      "evseStation.*",
      `(6371000 * acos(
          cos(radians(:lat)) * cos(radians(evseStation.lat)) *
          cos(radians(evseStation.lng) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(evseStation.lat))
      )) AS distance`,
    ])
    .where("evseStation.lat IS NOT NULL")
    .andWhere("evseStation.lng IS NOT NULL")
    .having("distance < :maxDistance")
    .setParameters({
      lat,
      lng,
      maxDistance: Number(maxDistance),
    })
    .orderBy("distance", "ASC")
    .getRawOne();
};

const generateRandomCodeForContract = (length = 6) => {
  const charsetNumber = "0123456789";
  const charsetCharacter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "CT";
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * charsetNumber.length);
    code += charsetNumber.charAt(randomIndex);
  }
  for (let i = 0; i < 2; i++) {
    const randomIndex = Math.floor(Math.random() * charsetCharacter.length);
    code += charsetCharacter.charAt(randomIndex);
  }
  return code;
};

const getOrderId = (length = 6) => {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    code += charset.charAt(randomIndex);
  }

  return `ORD-${code}`;
};

const replaceStringWithVariables = (str, vars) => {
  let htmlContent = str;
  if (Object.keys(vars).length > 0) {
    Object.keys(vars).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g"); // Create a RegExp pattern
      htmlContent = htmlContent.replace(regex, vars[key]); // Use RegExp to replace all occurrences
    });
  }
  return htmlContent;
};

const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

const getDefaultOcppResponse = (eventName, isExternal = false) => {
  const expiryDate = DateTime.utc().plus({ hours: 2 }).toISO();
  const currentTime = DateTime.utc().toISO();

  let responseData = { status: "Accepted" };
  if ([OcppEvents.Authorize].includes(eventName)) {
    responseData = {
      idTagInfo: { expiryDate, status: isExternal ? "Accepted" : "Invalid" },
    };
  } else if ([OcppEvents.BootNotification].includes(eventName)) {
    responseData = {
      status: isExternal ? "Accepted" : "Rejected",
      interval: OcppConstants.BOOT_NOTIFICATION_INTERVAL,
      currentTime,
    };
  } else if ([OcppEvents.Heartbeat].includes(eventName)) {
    responseData = { currentTime };
  } else if (
    [
      OcppEvents.MeterValues,
      OcppEvents.StatusNotification,
      OcppEvents.DiagnosticsStatusNotification,
      OcppEvents.FirmwareStatusNotification,
    ].includes(eventName)
  ) {
    responseData = {};
  } else if ([OcppEvents.StartTransaction].includes(eventName)) {
    if (isExternal) {
      responseData = { idTagInfo: { status: "Accepted" }, transactionId: 1 };
    } else {
      responseData = { idTagInfo: { status: "Invalid" } };
    }
  } else if ([OcppEvents.StopTransaction].includes(eventName)) {
    responseData = {
      idTagInfo: { status: isExternal ? "Accepted" : "Invalid" },
    };
  } else if ([OcppEvents.UnlockConnector].includes(eventName)) {
    responseData = { status: "Unlocked" };
  } else if ([OcppEvents.GetDiagnostics].includes(eventName)) {
    responseData = { fileName: "diagnostics.txt" };
  } else if ([OcppEvents.GetLocalListVersion].includes(eventName)) {
    responseData = { listVersion: 1 };
  } else if ([OcppEvents.LogStatusNotification].includes(eventName)) {
    responseData = { status: "Uploaded" };
  }

  return responseData;
};

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

const checkUserEmail = async (params) => {
  const { email, userId = null } = params;

  const whereQuery = { email, isDeleted: false };
  if (userId) {
    whereQuery["id"] = Not(userId);
  }

  const cpoUserEmail = await CpoUserRepository.findOne({
    where: whereQuery,
  });
  if (cpoUserEmail) {
    return { code: 400, data: { message: "Email Already Exists." } };
  }

  const userEmail = await UserRepository.findOne({
    where: whereQuery,
  });
  if (userEmail) {
    return { code: 400, data: { message: "Email Already Exists." } };
  }

  return { code: 200 };
};

const checkUserPhone = async (params) => {
  const { phoneNumber, userId = null } = params;

  const whereQuery = { phoneNumber, isDeleted: false };
  if (userId) {
    whereQuery["id"] = Not(userId);
  }

  const cpoUserPhone = await CpoUserRepository.findOne({
    where: whereQuery,
  });
  if (cpoUserPhone) {
    return { code: 400, data: { message: "Phone Number Already Exists." } };
  }

  const userPhone = await UserRepository.findOne({
    where: whereQuery,
  });
  if (userPhone) {
    return { code: 400, data: { message: "Phone Number Already Exists." } };
  }

  return { code: 200 };
};

const getChargersOverview = async (sqlMatchConditions) => {
  const overviews = {
    available: 0,
    "in-use": 0,
    error: 0,
    offline: 0,
    totalCount: 0,
  };

  try {
    const chargers = await ChargerViewRepository.find({
      where: {
        isDeleted: false,
        ...sqlMatchConditions,
      },
      select: ["status"],
    });

    overviews["totalCount"] = chargers?.length || 0;

    const statusFilterMapping = {
      available: ["available", "activated"],
      "in-use": ["busy"],
      error: ["in-operative"],
      offline: ["offline", "disabled"],
    };

    chargers.forEach(({ status }) => {
      for (const [key, values] of Object.entries(statusFilterMapping)) {
        if (values.includes(status)) {
          overviews[key]++;
          return;
        }
      }
    });

    return overviews;
  } catch (error) {
    console.error("Error fetching charger list:", error);
    return overviews;
  }
};

const getAnalyticDataForDashboard = async (match) => {
  let customUniqueDays = 0;
  try {
    let start = match?.createdAt["$gte"];
    let end = match?.createdAt["$lte"];
    if (start && end) {
      start = DateTime.fromJSDate(start);
      end = DateTime.fromJSDate(end);
      customUniqueDays = Math.ceil(end.diff(start, "days").days);
    }
  } catch (error) {
    customUniqueDays = 0;
  }

  try {
    const analyticsData = await AnalyticsModel.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: 0,
          utilizationRate: { $sum: "$utilizationRate" },
          totalRevenue: { $sum: "$totalRevenue" },
          totalSessions: { $sum: "$totalSessions" },
          totalEnergyDelivered: { $sum: "$totalEnergyDelivered" },
          totalSessionsDuration: { $sum: "$totalDuration" },
          totalSessionsDurationSec: { $sum: "$totalDurationSec" },
          uniqueDates: {
            $addToSet: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
          },
          chargers: { $addToSet: "$chargerId" }, // ✅ collect unique chargers
          evseStations: { $addToSet: "$evseStationId" }, // ✅ collect unique chargers
        },
      },
      {
        $project: {
          _id: 0,
          utilizationRate: 1,
          totalRevenue: 1,
          totalSessions: 1,
          totalEnergyDelivered: 1,
          totalSessionsDuration: 1,
          totalSessionsDurationSec: 1,
          // uniqueDateCount: { $size: "$uniqueDates" },
          uniqueDateCount:
            customUniqueDays > 0
              ? { $literal: customUniqueDays }
              : { $size: "$uniqueDates" },
          totalChargers: { $size: "$chargers" }, // ✅ count chargers
          totalStations: { $size: "$evseStations" }, // ✅ count chargers
        },
      },
      {
        $addFields: {
          avgRevenuePerChargerPerDay: {
            $cond: [
              {
                $and: [
                  { $gt: ["$uniqueDateCount", 0] },
                  { $gt: ["$totalChargers", 0] },
                ],
              },
              {
                $divide: [
                  "$totalRevenue",
                  { $multiply: ["$uniqueDateCount", "$totalChargers"] },
                ],
              },
              0,
            ],
          },
          globalUtilizationRate: {
            $cond: [
              {
                $and: [
                  { $gt: ["$totalSessionsDurationSec", 0] },
                  { $gt: ["$uniqueDateCount", 0] },
                ],
              },
              {
                $multiply: [
                  {
                    $divide: [
                      "$totalSessionsDurationSec",
                      { $multiply: ["$uniqueDateCount", 86400] },
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
          avgRevenuePerChargerPerSession: {
            $cond: [
              { $gt: ["$totalSessions", 0] },
              { $divide: ["$totalRevenue", "$totalSessions"] },
              0,
            ],
          },
        },
      },
    ]);

    const analyticsDataToReturn = analyticsData.map((a) => {
      let durationInHours =
        Number(a["totalSessionsDurationSec"] ?? 0) > 0
          ? Number(a["totalSessionsDurationSec"]) / 3600
          : 0;

      return {
        ...a,
        totalSessionsDuration: durationInHours,
      };
    });

    return analyticsDataToReturn;
  } catch (error) {
    console.error("Error getAnalyticDataForDashboard:", error);
    return [];
  }
};

const getGrossRevenueSplit = async (
  sqlMatchConditionsRaw,
  rangeRaw,
  forChart = false,
) => {
  try {
    // Step 1: subquery for slot counts per day
    const slotSubQuery = ChargerRevenueRepository.createQueryBuilder(
      "chargerRevenue",
    ).select([
      "SUM(chargerRevenue.totalAmount) as totalAmount",
      "COUNT(DISTINCT(chargerRevenue.cpoId)) as cpoCount",
      "SUM(chargerRevenue.cpoAmount) as cpoAmount",
      "SUM(chargerRevenue.siteHostAmount) as siteHostAmount",
      "SUM(COALESCE(chargerRevenue.investor1Amount, 0) + COALESCE(chargerRevenue.investor2Amount, 0) ) AS investorAmount",
    ]);

    if (forChart) {
      slotSubQuery.addSelect("YEAR(chargerRevenue.createdAt) AS year");
      slotSubQuery.addSelect("MONTH(chargerRevenue.createdAt) AS month");
    }

    // Filters applied here BEFORE subquery
    if (sqlMatchConditionsRaw?.evseStationId?.length) {
      slotSubQuery.andWhere(
        "chargerRevenue.evseStationId IN (:...evseStationIds)",
        {
          evseStationIds: sqlMatchConditionsRaw.evseStationId,
        },
      );
    }
    if (sqlMatchConditionsRaw?.chargeBoxId?.length) {
      slotSubQuery.andWhere(
        "chargerRevenue.chargeBoxId IN (:...chargeBoxIds)",
        {
          chargeBoxIds: sqlMatchConditionsRaw.chargeBoxId,
        },
      );
    }
    if (sqlMatchConditionsRaw?.contractId?.length) {
      slotSubQuery.andWhere("chargerRevenue.contractId IN (:...contractIds)", {
        contractIds: sqlMatchConditionsRaw.contractId,
      });
    }
    if (rangeRaw.start && rangeRaw.end) {
      slotSubQuery.andWhere(
        "chargerRevenue.createdAt BETWEEN :start AND :end",
        {
          start: rangeRaw.start,
          end: rangeRaw.end,
        },
      );
    }

    if (!forChart) {
      const revenueSplitResult = await slotSubQuery.getRawOne();
      return revenueSplitResult;
    } else {
      slotSubQuery.groupBy("YEAR(chargerRevenue.createdAt)");
      slotSubQuery.addGroupBy("MONTH(chargerRevenue.createdAt)");
      slotSubQuery.orderBy("YEAR(chargerRevenue.createdAt)", "ASC");
      slotSubQuery.addOrderBy("MONTH(chargerRevenue.createdAt)", "ASC");

      // Step 3: execute query
      const result = await slotSubQuery.getRawMany();
      if (!result || result.length === 0) {
        return [];
      }

      // Step 4: map result to UI structure
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const monthlyTrend = result.map((row) => ({
        month: monthNames[row.month - 1],
        year: Number(row.year),
        cpo: Number(row.cpoAmount || 0),
        siteHost: Number(row.siteHostAmount || 0),
        investor: Number(row.investorAmount || 0),
        total: Number(row.totalAmount || 0),
      }));

      return monthlyTrend;
    }
  } catch (error) {
    if (!forChart) {
      return {};
    } else {
      return [];
    }
  }
};

const getConfigConstants = async (keys = []) => {
  try {
    const where = keys.length > 0 ? { where: { key: In(keys) } } : {};
    const config = await ConfigConstantsRepository.find(where);
    if (!config) {
      throw new Error("Platform configuration not found");
    }
    if (keys.length == 1) {
      return config[0].value;
    }
    return Object.fromEntries(config.map((item) => [item.key, item.value]));
  } catch (error) {
    console.error("Error fetching platform configuration:", error.message);
    throw error;
  }
};

const generateChargeSerialNumber = async (
  fieldToMatch = "serialNumber",
  length = 16,
) => {
  let serialNumber = uuidv4().replace(/-/g, "").slice(0, length).toUpperCase();

  // Loop until a unique serialNumber is generated
  while (
    await ChargerRepository.findOne({
      where: { [fieldToMatch]: serialNumber },
    })
  ) {
    serialNumber = uuidv4().replace(/-/g, "").slice(0, length).toUpperCase();
  }

  return serialNumber;
};

const generateChargerSerialNumber = async (
  payload,
  fieldToMatch = "serialNumber",
  length = 16,
) => {
  let {
    manufacturerInitials: manufacturer,
    chargerVariant: variant,
    chargerEnergyMeter: amperage,
    chargerPaymentModule: paymentModule,
    chargerBatchCode: batchCode,
  } = await getConfigConstants([
    "manufacturerInitials",
    "chargerVariant",
    "chargerEnergyMeter",
    "chargerPaymentModule",
    "chargerBatchCode",
  ]);

  manufacturer = payload["manufacturer_initials"]
    ? payload["manufacturer_initials"]
    : manufacturer;
  variant = payload["variant"] ? payload["variant"] : variant;
  amperage = payload["amperage"] ? payload["amperage"] : amperage;
  paymentModule = payload["payment_module"]
    ? payload["payment_module"]
    : paymentModule;
  batchCode = payload["batch_code"] ? payload["batch_code"] : batchCode;

  const serialNumberCount = await ChargerSerialNumberLogsRepository.count({
    where: { batchCode },
  });

  const yymm = DateTime.fromISO(DateTime.utc().toISO(), {
    setZone: false,
  }).toFormat("yyLL");

  const newSerialNumberCount = `${serialNumberCount + 1}`.padStart(4, 0);

  const serialNumberDashed = `${manufacturer}-${variant}-${amperage}-${paymentModule}-${batchCode}-${yymm}-${newSerialNumberCount}`;
  let serialNumber = serialNumberDashed.replace(/-/g, "");

  await ChargerSerialNumberLogsRepository.save({
    manufacturer,
    variant,
    amperage,
    paymentModule,
    batchCode,
    serialNumber,
    serialNumberDashed,
    generatedAt: DateTime.utc().toISO(),
  });

  return serialNumber;
};

const getChargeUniqueId = async (fieldToMatch = "uniqueId", length = 6) => {
  let uniqueId = uuidv4().replace(/-/g, "").slice(0, length).toUpperCase();

  // Loop until a unique uniqueId is generated
  while (
    await ChargerRepository.findOne({ where: { [fieldToMatch]: uniqueId } })
  ) {
    uniqueId = uuidv4().replace(/-/g, "").slice(0, length).toUpperCase();
  }

  return uniqueId;
};

const generateChargeBoxId = async (config) => {
  const { manufacturerInitials, chargerModelPrime, country, registeredAt } =
    config;

  let registeredAtObj = DateTime.fromJSDate(registeredAt, { setZone: false });
  if (!registeredAtObj.isValid) {
    registeredAtObj = DateTime.fromISO(registeredAt, { setZone: false });
  }
  if (!registeredAtObj.isValid) {
    registeredAtObj = DateTime.fromISO(DateTime.utc().toISO(), {
      setZone: false,
    });
  }

  const year = registeredAtObj.get("year").toString();
  const uniqueId = await getChargeUniqueId();
  const chargeBoxId = `${manufacturerInitials}${country}${chargerModelPrime}${year}${uniqueId}`;

  let timezone = null;
  try {
    if (country == "CA" || country == "ca") {
      timezone = "America/Toronto";
    } else {
      let countryData = await getCountries(country);
      countryData = countryData?.list[0] ?? {};
      if (countryData?.timezones) {
        if (countryData?.timezones[0]) {
          if (countryData?.timezones[0]?.zoneName) {
            timezone = countryData?.timezones[0]?.zoneName;
          }
        }
      }
    }
  } catch (error) {
    timezone = null;
  }

  return { chargeBoxId, uniqueId, timezone, country };
};

const generateChargeBoxIdV2 = async (config) => {
  const {
    manufacturerInitials = "CGX",
    chargerModel = "P1",
    amperage = "80",
    branchCode = "03A",
    registeredAt,
    country = "IN",
  } = config;

  let registeredAtObj = DateTime.fromJSDate(registeredAt, { setZone: false });
  if (!registeredAtObj.isValid) {
    registeredAtObj = DateTime.fromISO(registeredAt, { setZone: false });
  }
  if (!registeredAtObj.isValid) {
    registeredAtObj = DateTime.fromISO(DateTime.utc().toISO(), {
      setZone: false,
    });
  }

  const iso3 = getIsoCode3(country);
  const year = registeredAtObj.toFormat("yyWW");
  const uniqueId = await getChargeUniqueId();
  const chargeBoxId = `${manufacturerInitials}${chargerModel}${amperage}${year}${branchCode}${iso3}${uniqueId}`;
  const chargeBoxIdFormatted = `${manufacturerInitials}-${chargerModel}-${amperage}-${year}-${branchCode}-${iso3}-${uniqueId}`;

  let timezone = null;
  try {
    if (country == "CA" || country == "ca") {
      timezone = "America/Toronto";
    } else {
      let countryData = await getCountries(country);
      countryData = countryData?.list[0] ?? {};
      if (countryData?.timezones) {
        if (countryData?.timezones[0]) {
          if (countryData?.timezones[0]?.zoneName) {
            timezone = countryData?.timezones[0]?.zoneName;
          }
        }
      }
    }
  } catch (error) {
    timezone = null;
  }

  return { chargeBoxId, uniqueId, timezone, country, chargeBoxIdFormatted };
};

const generateChargeBoxIdOld = (config) => {
  const { fieldOrder, chargerCount } = config;
  const currentYear = DateTime.utc().get("year").toString().slice(-2);
  const sequenceLength = 6;

  const valueMapping = {};

  Object.keys(config).forEach((key) => {
    valueMapping[key] = config[key];
  });

  const sequenceValue = (chargerCount + 1)
    .toString()
    .padStart(sequenceLength, "0");

  valueMapping.sequence = sequenceValue;
  valueMapping.year = currentYear;

  const chargeBoxId = fieldOrder.map((field) => valueMapping[field]).join("");
  return chargeBoxId;
};

const convertDateTimezone = (
  dateTime,
  timezone = "UTC",
  format = "yyyy-MM-dd HH:mm:ss",
) => {
  if (!dateTime || !dateTime.isValid) {
    return null;
  }
  return `${dateTime.setZone(timezone).toFormat(format)}`;
};

const formatDateString = (dateTime, timezone) => {
  if (timezone === "UTC") {
    return dateTime.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'+00:00'");
  }
  return dateTime.setZone(timezone).toISO({ includeOffset: true });
};

const calculateChargingTime = (startTime, endTime) => {
  const zone = { zone: "UTC" };
  const start = DateTime.fromJSDate(startTime, zone);
  const end = DateTime.fromJSDate(endTime, zone);

  const hours = end.diff(start, "hours").hours;
  const minutes = end.diff(start, "minutes").minutes;
  const seconds = Math.floor(end.diff(start, "seconds").seconds);

  return { hours, seconds, minutes };
};

const compressImage = async (
  inputPath,
  outputFormat = "jpeg",
  maxSizeKB = 500,
  width = 800,
  height = 800,
) => {
  try {
    const image = await sharp(inputPath).resize({
      width: width,
      height: height,
      fit: sharp.fit.inside,
    });
    // Check if input format supports transparency
    const { hasAlpha } = await image.metadata();

    let finalFormat = outputFormat;
    if (hasAlpha && outputFormat === "jpeg") {
      finalFormat = "png";
    }

    const compressedBuffer = await image
      .toFormat(finalFormat, {
        quality: 85,
      })
      .toBuffer();

    if (compressedBuffer.length > maxSizeKB * 1024) {
      throw new Error(`Unable to compress image to under ${maxSizeKB}KB`);
    }

    return compressedBuffer;
  } catch (error) {
    throw new Error(`Image compression failed: ${error.message}`);
  }
};

const arrayChunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );

const arrayObjStr = (arr, keyColumn, dataColumn) => {
  const returnData = {};
  arr.forEach((v, i) => {
    returnData[arr[i][keyColumn]] = dataColumn ? arr[i][dataColumn] : arr[i];
  });
  return returnData;
};

const arrayObjArr = (arr, keyColumn, dataColumn) => {
  const returnData = {};
  arr.forEach((v, i) => {
    returnData[arr[i][keyColumn]] = returnData[arr[i][keyColumn]] || [];
    returnData[arr[i][keyColumn]].push(
      dataColumn ? arr[i][dataColumn] : arr[i],
    );
  });
  return returnData;
};

const logJson = (obj) => {
  return JSON.stringify(obj, null, 2);
};

const toSnakeCase = (str) => {
  return str
    .toLowerCase() // Convert all characters to lowercase
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^\w_]/g, ""); // Remove any non-word characters
};

const generateInvoiceNumber = (prefix = "RCT") => {
  return `${prefix}-${Math.floor(Math.random() * 1000000)}`;
};

const formatChargingDuration = (hours) => {
  let hrs = Math.floor(hours / 3600);
  let mins = Math.floor((hours % 3600) / 60);
  let secs = Math.floor(hours % 60);
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0",
  )}:${String(secs).padStart(2, "0")}`;
};

const getIpData = async (req, ip = null) => {
  try {
    let ipAddress = ip;
    if (!ip) {
      if (!req) {
        return null;
      }
      ipAddress = req.headers["x-forwarded-for"] || req.ip;
    }

    return getLocationInfo(ipAddress);
  } catch (error) {
    return null;
  }
};

const getIpTimezone = async (req, ip = null) => {
  let timezone = null;
  try {
    const ipData = await getIpData(req, ip);
    timezone = ipData?.timezone ?? null;
  } catch (error) {
    timezone = null;
  }

  return timezone;
};

const getServerDate = (date, timezone = "UTC") => {
  let returnDate = null;
  timezone = timezone === null ? "UTC" : timezone;

  try {
    const dateObj = DateTime.fromJSDate(date).toISO({ includeOffset: false });
    const utcDate = DateTime.fromISO(dateObj, { zone: "UTC" }).toISO();
    const convertedDate = DateTime.fromISO(utcDate)
      .setZone(timezone)
      .toISO({ includeOffset: false });
    returnDate = DateTime.fromISO(convertedDate, { zone: "UTC" }).toISO();
  } catch (error) {
    returnDate = null;
  }

  return returnDate;
};

const getTimezoneByCountry = async (country, returnAll = false) => {
  let timezone = "UTC";
  let countryData = {};
  try {
    countryData = await getCountries(country);
    countryData = countryData?.list[0] ?? null;

    if (country == "CA" || country == "ca") {
      timezone = "America/Toronto";
    } else if (country == "US" || country == "us") {
      timezone = "America/New_York";
    } else {
      if (countryData?.timezones) {
        if (countryData?.timezones[0]) {
          if (countryData?.timezones[0]?.zoneName) {
            timezone = countryData?.timezones[0]?.zoneName;
          }
        }
      }
    }
  } catch (error) {
    timezone = "UTC";
  }
  timezone = timezone ?? "UTC";

  if (returnAll) {
    return { ...countryData, timezone };
  }
  return timezone;
};

const formatSerialNumber = async (serialNumber) => {
  const serialNumberData = await ChargerSerialNumberLogsRepository.findOne({
    where: { serialNumber },
  });
  if (serialNumberData?.serialNumberDashed) {
    return serialNumberData?.serialNumberDashed;
  }

  // Use a regular expression to match the groups and add hyphens
  return serialNumber.replace(/(.{4})(.{4})(.{4})(.{4})/, "$1-$2-$3-$4");
};

const getChargerByIdentity = async (identity, where = {}, getDate = false) => {
  // let charger = await ChargerRepository.findOne({
  //   where: { serialNumber: identity.replace(/-/g, ""), ...where },
  // });
  // if (!charger) {
  //   charger = await ChargerRepository.findOne({
  //     where: { chargeBoxId: identity, ...where },
  //   });
  // }
  // if (!charger) {
  //   charger = await ChargerRepository.findOne({
  //     where: { id: identity, ...where },
  //   });
  // }

  const charger = await ChargerRepository.findOne({
    where: [
      { serialNumber: identity.replace(/-/g, ""), ...where },
      { chargeBoxId: identity, ...where },
      { uniqueId: identity, ...where },
      { id: identity, ...where },
    ],
  });

  if (charger) {
    if (getDate) {
      charger["jsLocalDateTime"] = DateTime.utc().toFormat(
        "yyyy-MM-dd HH:mm:ss",
      );
      charger["isoLocalDateTime"] = DateTime.utc().toISO();
      charger["isoLocalDateTimeExpiry"] = DateTime.utc()
        .plus({ hours: 2 })
        .toISO();

      try {
        const timezone = charger?.timezone ?? "UTC";
        const jsLocalDateTime = convertDateTimezone(DateTime.utc(), timezone);
        if (jsLocalDateTime) {
          const isoLocalDateTime = DateTime.fromFormat(
            jsLocalDateTime,
            "yyyy-MM-dd HH:mm:ss",
            { zone: "UTC" },
          ).toISO();
          const isoLocalDateTimeExpiry = DateTime.fromFormat(
            jsLocalDateTime,
            "yyyy-MM-dd HH:mm:ss",
            { zone: "UTC" },
          )
            .plus({ hours: 2 })
            .toISO();

          charger["jsLocalDateTime"] = jsLocalDateTime;
          charger["isoLocalDateTime"] = isoLocalDateTime;
          charger["isoLocalDateTimeExpiry"] = isoLocalDateTimeExpiry;
        }
      } catch (error) {}
    }
  }

  return charger;
};

const getChargerLanguageByConnectorId = async (
  chargerId,
  connectorId,
  languageOnly = false,
) => {
  const charger = await getChargerByIdentity(chargerId);

  let chargerLanguage = await ChargerLanguageRepository.findOne({
    where: { chargerId: charger.id, connectorId },
  });

  if (!chargerLanguage) {
    await ChargerLanguageRepository.save({
      chargerId: charger.id,
      chargeBoxId: charger.chargeBoxId,
      connectorId,
    });

    chargerLanguage = await ChargerLanguageRepository.findOne({
      where: { chargerId: charger.id, connectorId },
    });
  }

  if (languageOnly) {
    return chargerLanguage?.language;
  }

  return chargerLanguage;
};

const getChargerContract = async (chargerId) => {
  const charger = await getChargerByIdentity(chargerId);

  let chargerViewData = await ChargerViewRepository.findOne({
    where: { id: charger.id },
  });

  let contractData = {};

  if (chargerViewData?.contractId) {
    contractData = await ContractViewRepository.findOne({
      where: { id: chargerViewData?.contractId },
    });

    try {
      if (contractData) {
        delete contractData?.isDeleted;
        delete contractData?.createdAt;
        delete contractData?.updatedAt;
        delete contractData?.createdBy;
        delete contractData?.updatedBy;
        delete contractData?.createdByEmail;
        delete contractData?.createdByName;
        delete contractData?.updatedByEmail;
        delete contractData?.updatedByName;
        delete contractData?.cpoId;
        delete contractData?.cpoCreatedAt;
        delete contractData?.siteHostId;
        delete contractData?.siteHostCreatedAt;
        delete contractData?.partners;
        delete contractData?.evseStations;
        delete contractData?.evseStations;
      }
    } catch (error) {}
  }

  return contractData;
};

const getChargerCards = async (chargerId) => {
  const charger = await getChargerByIdentity(chargerId);

  let chargerCardData = await ChargerCardRepository.find({
    where: { chargerId: charger.id },
    select: ["cardUid", "cardLabel", "createdAt", "expiryDate", "isExpired"],
  });

  return chargerCardData;
};

const getBaseRateAndLocationByCharger = async (
  identity,
  where = {},
  updateData = false,
) => {
  let charger = await getChargerByIdentity(identity, where);

  let baseRate = null;
  let evseStation = null;
  if (charger) {
    if (charger?.evseStationId) {
      evseStation = await EvseStationRepository.findOne({
        where: { id: charger?.evseStationId, isDeleted: false },
      });

      baseRate = {
        baseRateKWH: evseStation?.baseRate,
        parkingRate: evseStation?.parkingRate,
        taxRate: evseStation?.taxRate,
        discount: evseStation?.discount,
        penalty: evseStation?.penalty,
        currency: evseStation?.currency,
        currencyName: evseStation?.currencyName,
        currencySymbol: evseStation?.currencySymbol,
      };
    }

    if (updateData) {
      const newUpdateChargerData = { serialNumber: charger.serialNumber };

      if (evseStation) {
        if (evseStation?.lat) {
          newUpdateChargerData["lat"] = evseStation.lat;
        }
        if (evseStation?.lng) {
          newUpdateChargerData["lng"] = evseStation.lng;
        }
      }

      if (baseRate) {
        if (baseRate?.currency) {
          newUpdateChargerData["currency"] = baseRate?.currency;
        }
        if (baseRate?.currencyName) {
          newUpdateChargerData["currencyName"] = baseRate?.currencyName;
        }
        if (baseRate?.currencySymbol) {
          newUpdateChargerData["currencySymbol"] = baseRate?.currencySymbol;
        }
      }

      await ChargerRepository.update(charger.id, newUpdateChargerData);
      await updateChargerCountryByLatLng(charger.id);
    }
  }

  return { baseRate, evseStation };
};

const getLocationInfo = async (ip) => {
  let returnData = null;

  try {
    if (ip != null) {
      try {
        returnData = await IpDataModel.findOne({
          ip,
        }).lean();

        if (returnData) {
          delete returnData._id;
          delete returnData.createdAt;
          delete returnData.updatedAt;
        }
      } catch (error) {}

      if (returnData) {
        return returnData;
      }

      const response = await axios.get(`https://ipinfo.io/${ip}/json`);

      const locData = response?.data?.loc?.split(",");
      let lat = null;
      let lng = null;
      if (locData?.length == 2) {
        lat = locData[0];
        lng = locData[1];
      }

      const ipDetails = {
        ip: response?.data?.ip,
        city: response?.data?.city,
        region: response?.data?.region,
        country: response?.data?.country,
        location: response?.data?.loc,
        org: response?.data?.org,
        postal: response?.data?.postal,
        lat,
        lng,
        ...response?.data,
      };

      if (ipDetails?.readme) {
        delete ipDetails?.readme;
      }

      const { timezone } = await getLocationByLatLng(lat, lng);

      await IpDataModel.create({
        ip: response?.data?.ip,
        city: response?.data?.city,
        region: response?.data?.region,
        country: response?.data?.country,
        location: response?.data?.loc,
        org: response?.data?.org,
        postal: response?.data?.postal,
        lat,
        lng,
        timezone,
      });

      returnData = await IpDataModel.findOne({
        ip,
      }).lean();
    }
  } catch (error) {}

  return returnData;
};

const getLocationByLatLng = async (lat, lng) => {
  let country = null;
  let timezone = null;
  try {
    lat = parseFloat(lat);
    lng = parseFloat(lng);

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const timezoneUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&key=${apiKey}&timestamp=0`;

    const [geocodeResponse, timezoneResponse] = await Promise.all([
      fetch(geocodeUrl),
      fetch(timezoneUrl),
    ]);

    const [geocodeData, timezoneData] = await Promise.all([
      geocodeResponse.json(),
      timezoneResponse.json(),
    ]);

    if (geocodeData.status === "OK") {
      country = getCountryFromGeocode(geocodeData.results);
    }

    if (country) {
      let countryData = await getCountries(country);
      countryData = countryData?.list[0] ?? null;

      if (!countryData) {
        country = null;
      }
    }

    if (timezoneData.status === "OK") {
      timezone = timezoneData?.timeZoneId ?? null;
    }
  } catch (error) {
    country = null;
    console.error("Error:", error.message);
  }
  return { country, timezone };
};

const getCountryFromGeocode = (results) => {
  return (
    results?.[0]?.address_components?.find((component) =>
      component.types.includes("country"),
    )?.short_name ?? null
  );
};

const updateChargerCountryByLatLng = async (chargerId) => {
  let charger = await getChargerByIdentity(chargerId);
  if (charger) {
    if (charger?.lat && charger?.lng) {
      const { country, timezone } = await getLocationByLatLng(
        charger?.lat,
        charger?.lng,
      );
      if (country) {
        await ChargerRepository.update(charger.id, { country });
      }

      if (timezone) {
        await ChargerRepository.update(charger.id, { timezone });
      }
    }
  }
};

const updateChargerLatLngByEvseStationId = async (
  evseStationId,
  chargerId = null,
) => {
  try {
    const station = await EvseStationRepository.findOne({
      where: { id: evseStationId },
    });

    if (station?.lat && station?.lng) {
      const chargerWhere = { evseStationId, isDeleted: false };
      if (chargerId) {
        chargerWhere["id"] = chargerId;
      }

      const chargers = await ChargerRepository.find({
        where: chargerWhere,
      });

      await Promise.all(
        chargers.map(async (charger) => {
          await ChargerRepository.update(charger.id, {
            lat: station?.lat,
            lng: station?.lng,
          });

          await updateChargerCountryByLatLng(charger.id);

          await sendChargerUpdatedPusherEvent(charger.id);
        }),
      );
    }
  } catch (error) {
    console.error("Error updateChargerLatLngByEvseStationId:", error);
  }

  return true;
};

const formatDuration = async (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const getSubscriptionUsage = async (cpoId) => {
  let testingCpoIds = [
    "f20653e3-18fa-4f3e-b8fe-783d9290a94b",
    "c93621e5-3add-4deb-965d-be4b36ae34e3",
  ];
  let subscriptionUsage = {
    chargers: {
      label: "Chargers",
      limit: testingCpoIds.includes(cpoId) ? 50 : 3,
      used: await ChargerRepository.count({
        where: { cpoId, isDeleted: false },
      }),
    },
    users: {
      label: "Users",
      limit: testingCpoIds.includes(cpoId) ? 50 : 3,
      used: await CpoUserRepository.count({
        where: { cpoId, isDeleted: false },
      }),
    },
    roles: {
      label: "Roles",
      limit: testingCpoIds.includes(cpoId) ? 50 : 3,
      used: await CpoUserRoleRepository.count({
        where: { cpoId, isDeleted: false },
      }),
    },
    stations: {
      label: "EVSE Stations",
      limit: testingCpoIds.includes(cpoId) ? 50 : 3,
      used: await EvseStationRepository.count({
        where: { cpoId, isDeleted: false },
      }),
    },
  };

  if (testingCpoIds.includes(cpoId)) {
    return subscriptionUsage;
  }

  let subscriptionData = {};
  try {
    const subscription = await CpoSubscriptionRepository.findOne({
      where: { cpoId },
    });

    if (subscription) {
      const subscriptionPlan = await SubscriptionPlanRepository.findOne({
        where: { id: subscription.subscriptionPlanId },
      });

      subscriptionData = {
        allowedMaxCharger: subscriptionPlan.allowedMaxCharger,
        allowedMaxUserAccounts: subscriptionPlan.allowedMaxUserAccounts,
        allowedMaxEvseStations: subscriptionPlan.allowedMaxEvseStations,
        allowedMaxRoles: subscriptionPlan.allowedMaxRoles,
      };
    }
  } catch (error) {
    subscriptionData = {};
  }

  if (subscriptionData) {
    if (subscriptionData?.allowedMaxCharger) {
      subscriptionUsage["chargers"]["limit"] =
        subscriptionData?.allowedMaxCharger;
    }

    if (subscriptionData?.allowedMaxUserAccounts) {
      subscriptionUsage["users"]["limit"] =
        subscriptionData?.allowedMaxUserAccounts;
    }

    if (subscriptionData?.allowedMaxEvseStations) {
      subscriptionUsage["stations"]["limit"] =
        subscriptionData?.allowedMaxEvseStations;
    }

    if (subscriptionData?.allowedMaxRoles) {
      subscriptionUsage["roles"]["limit"] = subscriptionData?.allowedMaxRoles;
    }
  }

  return subscriptionUsage;
};

const isEmpty = (obj = {}) => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
};

const removeEmpty = (obj = {}) => {
  for (const propName in obj) {
    if (
      obj[propName] === null ||
      obj[propName] === undefined ||
      obj[propName] === "" ||
      (Array.isArray(obj[propName]) && !obj[propName].length) ||
      (typeof obj[propName] === "object" && isEmpty(obj[propName]))
    ) {
      delete obj[propName];
    }
  }
  return obj;
};

const ObjectDAO = (object, removable = []) => {
  if (!object) {
    return null;
  }
  if (!removable?.length) {
    removable = [];
  }
  delete object.updatedAt;
  delete object.updatedBy;
  delete object.isDeleted;
  for (let item of removable) {
    delete object[`${item}`];
  }
  return object;
};

// format numeric currency codes and country codes to string
function formatNumericToString(num) {
  return num ? num.toString().padStart(4, "0") : num;
}

const getChargerConstants = async (chargerId, chargeBoxId = null) => {
  try {
    let chargerConstants = await ChargerConstantsRepository.findOne({
      where: { chargerId, isDeleted: 0 },
    });
    if (!chargerConstants) {
      await ChargerConstantsRepository.save({
        chargerId,
        chargeBoxId,
        avgChargingDurationInSec: 9000, // 2.5 Hrs
        maxChargerPowerInKw: 19.2,
        contingencyPercentage: 10,
        transactionFeePercentage: 5,
      });

      chargerConstants = await ChargerConstantsRepository.findOne({
        where: { chargerId },
      });
    }

    return chargerConstants;
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ getChargerConstants error:", error?.message);
    console.log("🚀 -----------------🚀");
    return null;
  }
};

const getRegionalElectricityRate = async (country) => {
  try {
    let regionalElectricityRate =
      await RegionalElectricityRateRepository.findOne({
        where: { country, isDeleted: 0 },
      });

    return regionalElectricityRate;
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ getRegionalElectricityRate error:", error?.message);
    console.log("🚀 -----------------🚀");
    return null;
  }
};

const calculatePreauthAmount = async (params) => {
  try {
    let {
      parkingRate = 10,
      penalty = 0,

      avgChargingDurationInSec = 9000, // 2.5 Hrs
      maxChargerPowerInKw = 19.2,
      contingencyPercentage = 10,
      transactionFeePercentage = 5,
      regionalElectricityRate = 0,
    } = params;

    const chargingDurationSec = Number(avgChargingDurationInSec ?? 0);
    const maxChargerPowerKw = Number(maxChargerPowerInKw ?? 0);
    const electricityRatePerKwh = Number(regionalElectricityRate ?? 0);
    const parkingRatePerHr = Number(parkingRate ?? 0);
    const penaltyPerSession = Number(penalty ?? 0);

    contingencyPercentage = Number(contingencyPercentage ?? 0);
    transactionFeePercentage = Number(transactionFeePercentage ?? 0);

    // Convert seconds to hours
    const chargingDurationHrs = chargingDurationSec / 3600;

    // Step 1: Energy cost
    const energyKwh = chargingDurationHrs * maxChargerPowerKw;
    const energyCost = energyKwh * electricityRatePerKwh;

    // Step 2: Parking cost
    const parkingCost = chargingDurationHrs * parkingRatePerHr;

    // Step 3: Penalty
    const penaltyCost = penaltyPerSession;

    // Step 4: Subtotal 1
    const subtotal1 = energyCost + parkingCost + penaltyCost;

    // Step 5: Add contingency
    const contingency = (contingencyPercentage / 100) * subtotal1;
    const subtotal2 = subtotal1 + contingency;

    // Step 6: Add transaction fee
    const transactionFee = (transactionFeePercentage / 100) * subtotal2;

    // Final total, rounded up
    const total = subtotal2 + transactionFee;
    return Math.ceil(total);
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ calculatePreauthAmount error:", error?.message);
    console.log("🚀 -----------------🚀");
    return 40;
  }
};

const getChargerPreAuthAmount = async (identity, where = {}) => {
  try {
    let charger = await getChargerByIdentity(identity, where);
    if (charger) {
      let evseStationAuthAmount = null;
      if (charger?.evseStationId) {
        const evseStation = await EvseStationRepository.findOne({
          where: { id: charger?.evseStationId, isDeleted: false },
        });

        if (evseStation?.preAuthAmount) {
          evseStationAuthAmount = evseStation?.preAuthAmount;
        }
      }

      if (evseStationAuthAmount !== null) {
        return evseStationAuthAmount;
      }

      const [{ baseRate }, chargerConstants, regionalElectricityRate] =
        await Promise.all([
          getBaseRateAndLocationByCharger(charger.id),
          getChargerConstants(charger.id, charger.chargeBoxId),
          getRegionalElectricityRate(charger?.country),
        ]);

      return calculatePreauthAmount({
        parkingRate: baseRate?.parkingRate ?? 0,
        penalty: baseRate?.penalty ?? 0,

        avgChargingDurationInSec:
          chargerConstants?.avgChargingDurationInSec ?? 0, // 2.5 Hrs
        maxChargerPowerInKw: chargerConstants?.maxChargerPowerInKw ?? 0,
        contingencyPercentage: chargerConstants?.contingencyPercentage ?? 0,
        transactionFeePercentage:
          chargerConstants?.transactionFeePercentage ?? 0,
        regionalElectricityRate: regionalElectricityRate?.rate ?? 0,
      });
    }
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ getChargerPreAuthAmount error:", error?.message);
    console.log("🚀 -----------------🚀");
    return 40;
  }
};

const getChargerDetailsData = async (
  inputValue,
  includeCpo = false,
  isMin = null,
) => {
  try {
    let charger = await ChargerRepository.createQueryBuilder("charger")
      .leftJoinAndSelect("charger.connectorTypeId", "connectorTypeId")
      .leftJoinAndSelect("charger.evseStationId", "evseStationId")
      .leftJoinAndSelect("charger.cpoId", "cpoId")
      .where("charger.serialNumber = :inputValue", {
        inputValue: inputValue.replace(/-/g, ""),
      })
      .orWhere("charger.chargeBoxId = :inputValue", { inputValue })
      .orWhere("charger.id = :inputValue", { inputValue })
      .orWhere("charger.uniqueId = :inputValue", { inputValue })
      .getOne();

    if (!charger) {
      return null;
    }

    charger["deviceAdminPassCode"] = charger["deviceAdminPassCode"]
      ? charger["deviceAdminPassCode"]?.toString()
      : null;

    const [
      testConfig,
      { baseRate },
      configData,
      meteringConfig,
      ocppConfig,
      localizationCodeFromCountry,
      chargerPaymentConfig,
      chargerPreAuthAmountData,
      defaultLanguage,
      chargerCards,
    ] = await Promise.all([
      // check if Test Configuration is available for given charger
      TestingConfigurationRepository.findOne({
        where: { chargeBoxId: charger["chargeBoxId"] },
        select: ["preAuthAmount"],
      }),
      getBaseRateAndLocationByCharger(charger.id),
      getConfigConstants([
        "csmsURL",
        "csmsWsURL",
        "csmsWssURL",
        "csmsHttpURL",
        "csmsHttpsURL",
        "ocppVersion",
        "certificatePath",
        "heartbeatIntervalSeconds",
        "heartbeatThreshold",
        "paymentGatewayURL",
        "scanTimeout",
        "preAuthMultiplier",
        "paymentProvider",
        "paymentDeviceId",
        "underVoltageLimitPerPhase",
        "overVoltageLimitPerPhase",
        "underCurrentLimitPerPhase",
        "overCurrentLimitPerPhase",
        "maxCurrentLimitPerPhase",
        "noLoadTimeLimit",
        "emModelName",
        "wiringType",
        "chargerCapacity",
      ]),
      ChargerMeteringConfigRepository.findOne({
        where: { chargerId: charger.id },
        select: [
          "underVoltageLimitPerPhase",
          "overVoltageLimitPerPhase",
          "underCurrentLimitPerPhase",
          "overCurrentLimitPerPhase",
          "maxCurrentLimitPerPhase",
          "noLoadTimeLimit",
          "emModelName",
          "wiringType",
          "chargerCapacity",
        ],
      }),
      ChargerOcppConfigRepository.findOne({
        where: { chargerId: charger.id },
        select: [
          "csmsURL",
          "csmsApiURL",
          "csmsWsURL",
          "csmsWssURL",
          "csmsHttpURL",
          "csmsHttpsURL",
          "ocppVersion",
          "certificatePath",
          "heartbeatIntervalSeconds",
          "heartbeatThreshold",
        ],
      }),
      LocalizationCodesRepository.findOne({
        where: { iso_code: charger?.country },
      }),
      ChargerPaymentConfigRepository.findOne({
        where: { chargerId: charger.id },
      }),
      getChargerPreAuthAmount(charger.id),
      getChargerLanguageByConnectorId(charger.id, 1, true),
      getChargerCards(charger.id),
    ]);

    let isTest = false;
    if (testConfig) {
      isTest = true;
    }

    if (includeCpo) {
      charger.cpo = ObjectDAO(charger.cpoId);
      charger.cpoId = charger.cpo?.id;
      charger = ObjectDAO(charger, ["createdAt", "cpoId"]);
    } else {
      if (charger?.cpoId) {
        delete charger?.cpoId;
      }
      charger = ObjectDAO(charger, [
        "createdAt",
        "updatedBy",
        "isStickerPrinted",
        "stickerPrintedAt",
        "stickerPrintedBy",
      ]);
    }

    charger["defaultLanguage"] = defaultLanguage ?? "en";
    charger["baseRate"] = baseRate ?? {};
    charger["connectors"] = "1";
    charger["cards"] = chargerCards ?? [];

    if (baseRate) {
      charger["baseCost"] = baseRate["baseRateKWH"];
      charger["currency"] = baseRate["currency"];
      charger["currencyName"] = baseRate["currencyName"];
      charger["currencySymbol"] = baseRate["currencySymbol"];
    }

    charger["meteringConfig"] = meteringConfig;
    if (!charger["meteringConfig"]) {
      const {
        underVoltageLimitPerPhase,
        overVoltageLimitPerPhase,
        underCurrentLimitPerPhase,
        overCurrentLimitPerPhase,
        maxCurrentLimitPerPhase,
        noLoadTimeLimit,
        emModelName,
        wiringType,
        chargerCapacity,
      } = configData;

      charger["meteringConfig"] = {
        underVoltageLimitPerPhase: Number(underVoltageLimitPerPhase),
        overVoltageLimitPerPhase: Number(overVoltageLimitPerPhase),
        underCurrentLimitPerPhase: Number(underCurrentLimitPerPhase),
        overCurrentLimitPerPhase: Number(overCurrentLimitPerPhase),
        maxCurrentLimitPerPhase: Number(maxCurrentLimitPerPhase),
        noLoadTimeLimit: Number(noLoadTimeLimit),
        emModelName,
        wiringType,
        chargerCapacity: Number(chargerCapacity),
        typicalVoltage: 240,
      };
    }

    charger["ocppConfig"] = ocppConfig;
    if (!charger["ocppConfig"]) {
      charger["ocppConfig"] = {
        csmsURL: configData["csmsWsURL"],
        csmsApiURL: configData["csmsHttpURL"],
        csmsWsURL: configData["csmsWsURL"],
        csmsWssURL: configData["csmsWssURL"],
        csmsHttpURL: configData["csmsHttpURL"],
        csmsHttpsURL: configData["csmsHttpsURL"],
        ocppVersion: configData["ocppVersion"],
        certificatePath: configData["certificatePath"],
        heartbeatIntervalSeconds: configData["heartbeatIntervalSeconds"],
        heartbeatThreshold: configData["heartbeatThreshold"],
      };
    }

    charger["chargerConnectorType"] = null;
    if (charger?.connectorTypeId?.displayText) {
      charger["chargerConnectorType"] = charger?.connectorTypeId?.displayText;
    }
    delete charger?.connectorTypeId;

    charger["chargerUsageType"] = null;
    if (charger.chargeUsageTypeId) {
      charger["chargerUsageType"] = (
        await ChargerUsageTypeRepository.findOne({
          where: { id: charger.chargeUsageTypeId },
          select: ["displayText"],
        })
      )["displayText"];
    }
    delete charger?.chargeUsageTypeId;

    charger["evseStation"] = null;
    if (charger.evseStationId) {
      delete charger.evseStationId.id;
      delete charger.evseStationId.isDeleted;
      delete charger.evseStationId.createdAt;
      delete charger.evseStationId.updatedAt;
      delete charger.evseStationId.createdBy;
      delete charger.evseStationId.updatedBy;

      charger["evseStation"] = charger.evseStationId;
    }

    delete charger?.evseStationId;

    delete charger?.uniqueId;
    delete charger?.activationCode;
    delete charger?.activationExpiresAt;
    delete charger?.activationRequestedAt;
    delete charger?.lastHeartbeat;
    delete charger?.isDeleted;
    delete charger?.connectorTypeId;
    delete charger?.chargeUsageTypeId;
    delete charger?.registeredBy;
    delete charger?.connectorPair;
    delete charger?.updatedBy;

    // attach localization codes in baseRateObject
    if (charger?.country) {
      // get localization code based on country
      const localizationCodes = localizationCodeFromCountry;
      if (localizationCodes) {
        charger.baseRate["countryName"] = localizationCodes["country_name"];
        charger.baseRate["countryCodeAlpha"] =
          localizationCodes["country_code_alpha"];
        charger.baseRate["countryCodeNumeric"] = formatNumericToString(
          localizationCodes["country_code_numeric"],
        );
        charger.baseRate["currencyCodeAlpha"] =
          localizationCodes["currency_code_alpha"];
        charger.baseRate["currencyCodeNumeric"] = formatNumericToString(
          localizationCodes["currency_code_numeric"],
        );
      }
    }

    let chargerPreAuthAmount = "40.00";
    const useOldPreauth = false;
    if (!useOldPreauth) {
      if (!isTest) {
        chargerPreAuthAmount = chargerPreAuthAmountData;
        if (chargerPreAuthAmount) {
          chargerPreAuthAmount = Number(chargerPreAuthAmount).toFixed(2);
        }
      } else {
        chargerPreAuthAmount = testConfig["preAuthAmount"];
      }
    }

    // add payment config
    const paymentConfigData = {
      currency: charger.baseRate["currency"],
      currencyName: charger.baseRate["currencyName"],
      currencySymbol: charger.baseRate["currencySymbol"],
      countryName: charger.baseRate["countryName"],
      countryCodeAlpha: charger.baseRate["countryCodeAlpha"],
      countryCodeNumeric: formatNumericToString(
        charger.baseRate["countryCodeNumeric"],
      ),
      currencyCodeAlpha: charger.baseRate["currencyCodeAlpha"],
      currencyCodeNumeric: formatNumericToString(
        charger.baseRate["currencyCodeNumeric"],
      ),
      scanTimeout: configData["scanTimeout"],
      preAuthAmount: chargerPreAuthAmount ?? "40.00",
      paymentDeviceId:
        chargerPaymentConfig?.paymentDeviceId ??
        configData["paymentDeviceId"] ??
        null,
      paymentMfgId:
        chargerPaymentConfig?.paymentMfgId ??
        configData["paymentMfgId"] ??
        null,
    };

    if (chargerPaymentConfig) {
      if (useOldPreauth) {
        let preAuthMultiplier = chargerPaymentConfig["preauthAmountMultiplier"]
          ? parseFloat(chargerPaymentConfig["preauthAmountMultiplier"])
          : 10; //preAuth Multiplier to be receive from Business Team
        let preAuthAmount =
          parseFloat(charger.baseRate["baseRateKWH"]) * preAuthMultiplier;

        paymentConfigData.preAuthAmount = isTest
          ? testConfig["preAuthAmount"]
          : preAuthAmount.toFixed(2);
      }

      paymentConfigData.paymentGatewayURL =
        chargerPaymentConfig["paymentGatewayURL"];
      paymentConfigData.paymentGatewayAPIKey = process.env.PAYNEX_API_KEY;

      if (chargerPaymentConfig["scanTimeout"]) {
        paymentConfigData.scanTimeout = chargerPaymentConfig["scanTimeout"];
      }
      paymentConfigData.paymentProvider =
        chargerPaymentConfig["paymentProvider"];
      // paymentConfigData.paymentDeviceId =
      //   chargerPaymentConfig["paymentDeviceId"];
    } else {
      if (useOldPreauth) {
        let preAuthMultiplier = configData["preAuthMultiplier"]
          ? parseFloat(configData["preAuthMultiplier"])
          : 10; //preAuth Multiplier to be receive from Business Team
        let preAuthAmount =
          parseFloat(charger.baseRate["baseRateKWH"]) * preAuthMultiplier;

        paymentConfigData.preAuthAmount = isTest
          ? testConfig["preAuthAmount"]
          : preAuthAmount.toFixed(2);
      }
      paymentConfigData.paymentGatewayURL = configData["paymentGatewayURL"];
      paymentConfigData.paymentGatewayAPIKey = process.env.PAYNEX_API_KEY;
      paymentConfigData.scanTimeout = configData["scanTimeout"];
      paymentConfigData.paymentProvider = configData["paymentProvider"];
      // paymentConfigData.paymentDeviceId = configData["paymentDeviceId"];
    }

    charger["paymentConfig"] = paymentConfigData;

    charger.createdAt = charger.createdAt;
    charger.createdByUserEmail = charger.registeredByUserEmail;
    // add csmsServerURL after cpoId
    // console.log(charger)
    const newObject = Object.fromEntries(
      Object.entries(charger).flatMap(([key, value]) =>
        key === "cpoId"
          ? [
              [key, value],
              ["csmsServerURL", configData["csmsURL"]],
            ]
          : [[key, value]],
      ),
    );

    if (isMin == "min") {
      return {
        serialNumber: newObject?.serialNumber ?? null,
        chargeBoxId: newObject?.chargeBoxId ?? null,
        vendor: newObject?.vendor ?? null,
        chargerModel: newObject?.chargerModel ?? null,
        chargerConnectorType: newObject?.chargerConnectorType ?? null,
        meteringConfig: {
          underCurrentLimitPerPhase: Number(
            meteringConfig?.underCurrentLimitPerPhase ?? 0.5,
          ),
          maxCurrentLimitPerPhase: Number(
            meteringConfig?.maxCurrentLimitPerPhase ?? 80,
          ),
          noLoadTimeLimit: Number(meteringConfig?.noLoadTimeLimit ?? 15),
          wiringType: meteringConfig?.wiringType ?? "1P2W",
          typicalVoltage: Number(meteringConfig?.typicalVoltage ?? 240),
        },
        ocppConfig: {
          csmsURL: newObject?.ocppConfig?.csmsURL ?? null,
          ocppVersion: newObject?.ocppConfig?.ocppVersion ?? null,
          certificatePath: newObject?.ocppConfig?.certificatePath ?? null,
        },
        evseStation: {
          deviceAdminPassCode: newObject?.deviceAdminPassCode ?? null,
          defaultLanguage: newObject?.defaultLanguage ?? null,
          baseRateKWH: newObject?.evseStation?.baseRate ?? null,
          timezone: newObject?.evseStation?.timezone ?? null,
        },
        paymentConfig: {
          currency: newObject?.paymentConfig?.currency ?? null,
          currencyName: newObject?.paymentConfig?.currencyName ?? null,
          currencySymbol: newObject?.paymentConfig?.currencySymbol ?? null,
          countryName: newObject?.paymentConfig?.countryName ?? null,
          countryCodeAlpha: newObject?.paymentConfig?.countryCodeAlpha ?? null,
          countryCodeNumeric:
            newObject?.paymentConfig?.countryCodeNumeric ?? null,
          currencyCodeAlpha:
            newObject?.paymentConfig?.currencyCodeAlpha ?? null,
          currencyCodeNumeric:
            newObject?.paymentConfig?.currencyCodeNumeric ?? null,
          scanTimeout: newObject?.paymentConfig?.scanTimeout ?? null,
          preAuthAmount: newObject?.paymentConfig?.preAuthAmount ?? null,

          paymentGatewayURL:
            newObject?.paymentConfig?.paymentGatewayURL ?? null,
          paymentGatewayAPIKey: process.env.PAYNEX_API_KEY,
          paymentProvider: newObject?.paymentConfig?.paymentProvider ?? null,
        },
      };
    } else if (isMin == "min2") {
      return {
        serialNumber: newObject?.serialNumber ?? null,
        chargeBoxId: newObject?.chargeBoxId ?? null,
        // deviceName: newObject?.deviceName,
        deviceName: null,
        vendor: newObject?.vendor ?? null,
        activationDate: newObject?.activationDate ?? null,
        registeredAt: newObject?.registeredAt ?? null,
        validTill: newObject?.validTill ?? null,
        status: newObject?.status ?? null,
        chargerModel: newObject?.chargerModel ?? null,
        chargerUsageType: newObject?.chargerUsageType ?? null,
        connectors: newObject?.connectors ?? null,
        chargerConnectorType: newObject?.chargerConnectorType ?? null,
        // meteringConfig: {
        //   underVoltageLimitPerPhase:
        //     newObject?.meteringConfig?.underVoltageLimitPerPhase,
        //   overVoltageLimitPerPhase:
        //     newObject?.meteringConfig?.overVoltageLimitPerPhase,
        //   underCurrentLimitPerPhase:
        //     newObject?.meteringConfig?.underCurrentLimitPerPhase,
        //   overCurrentLimitPerPhase:
        //     newObject?.meteringConfig?.overCurrentLimitPerPhase,
        //   maxCurrentLimitPerPhase:
        //     newObject?.meteringConfig?.maxCurrentLimitPerPhase,
        //   noLoadTimeLimit: newObject?.meteringConfig?.noLoadTimeLimit,
        //   wiringType: "1P2W",
        //   typicalVoltage: newObject?.meteringConfig?.typicalVoltage,
        // },
        meteringConfig: {
          underVoltageLimitPerPhase: 190,
          overVoltageLimitPerPhase: 250,
          underCurrentLimitPerPhase: 0.5,
          overCurrentLimitPerPhase: 32,
          maxCurrentLimitPerPhase: 80,
          noLoadTimeLimit: 15,
          wiringType: "1P2W",
          typicalVoltage: 240,
        },
        ocppConfig: {
          csmsURL: newObject?.ocppConfig?.csmsURL ?? null,
          csmsApiURL: newObject?.ocppConfig?.csmsApiURL ?? null,
          csmsWsURL: newObject?.ocppConfig?.csmsWsURL ?? null,
          csmsWssURL: newObject?.ocppConfig?.csmsWssURL ?? null,
          csmsHttpURL: newObject?.ocppConfig?.csmsHttpURL ?? null,
          csmsHttpsURL: newObject?.ocppConfig?.csmsHttpsURL ?? null,
          ocppVersion: newObject?.ocppConfig?.ocppVersion ?? null,
          certificatePath: newObject?.ocppConfig?.certificatePath ?? null,
          heartbeatIntervalSeconds:
            newObject?.ocppConfig?.heartbeatIntervalSeconds ?? null,
          heartbeatThreshold: newObject?.ocppConfig?.heartbeatThreshold ?? null,
        },
        evseStation: {
          name: newObject?.evseStation?.name ?? null,
          address: newObject?.evseStation?.address ?? null,
          city: newObject?.evseStation?.city ?? null,
          state: newObject?.evseStation?.state ?? null,
          areaCode: newObject?.evseStation?.areaCode ?? null,
          lat: newObject?.evseStation?.lat ?? null,
          lng: newObject?.evseStation?.lng ?? null,
          // cpoId: newObject?.evseStation?.cpoId??null,
          deviceAdminPassCode: newObject?.deviceAdminPassCode ?? null,
          country: newObject?.evseStation?.country ?? null,
          timezone: newObject?.evseStation?.timezone ?? null,
          defaultLanguage: newObject?.defaultLanguage ?? null,
          baseRateKWH: newObject?.evseStation?.baseRate ?? null,
          // baseRateId: newObject?.evseStation?.baseRateId??null,
        },
        paymentConfig: {
          currency: newObject?.paymentConfig?.currency ?? null,
          currencyName: newObject?.paymentConfig?.currencyName ?? null,
          currencySymbol: newObject?.paymentConfig?.currencySymbol ?? null,
          countryName: newObject?.paymentConfig?.countryName ?? null,
          countryCodeAlpha: newObject?.paymentConfig?.countryCodeAlpha ?? null,
          countryCodeNumeric:
            newObject?.paymentConfig?.countryCodeNumeric ?? null,
          currencyCodeAlpha:
            newObject?.paymentConfig?.currencyCodeAlpha ?? null,
          currencyCodeNumeric:
            newObject?.paymentConfig?.currencyCodeNumeric ?? null,
          scanTimeout: newObject?.paymentConfig?.scanTimeout ?? null,
          preAuthAmount: newObject?.paymentConfig?.preAuthAmount ?? null,
          paymentGatewayURL:
            newObject?.paymentConfig?.paymentGatewayURL ?? null,
          paymentGatewayAPIKey: process.env.PAYNEX_API_KEY,
          paymentProvider: newObject?.paymentConfig?.paymentProvider ?? null,
        },
      };
    }
    return newObject;
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ getChargerDetailsData error:", error?.message);
    console.log("🚀 -----------------🚀");
    return null;
  }
};

const calculatePeakAndOffPeakTimeOld = (
  startTime,
  endTime,
  peakStart,
  peakEnd,
  offPeakStart,
  offPeakEnd,
) => {
  const format = "yyyy-MM-dd hh:mm:ss a";
  const zone = { zone: "UTC" };

  const startDate = DateTime.fromJSDate(startTime, zone).toFormat("yyyy-MM-dd");

  const start = DateTime.fromJSDate(startTime, zone);
  const end = DateTime.fromJSDate(endTime, zone);
  const peakStartTime = DateTime.fromFormat(
    `${startDate} ${peakStart}`,
    format,
    zone,
  );
  const peakEndTime = DateTime.fromFormat(
    `${startDate} ${peakEnd}`,
    format,
    zone,
  );
  const offPeakStartTime = DateTime.fromFormat(
    `${startDate} ${offPeakStart}`,
    format,
    zone,
  );
  const offPeakEndTime = DateTime.fromFormat(
    `${startDate} ${offPeakEnd}`,
    format,
    zone,
  );

  // Ensure valid input ranges
  if (
    !start.isValid ||
    !end.isValid ||
    !peakStartTime.isValid ||
    !peakEndTime.isValid ||
    !offPeakStartTime.isValid ||
    !offPeakEndTime.isValid
  ) {
    throw new Error("Invalid time format. Use hh:mm:ss A.");
  }

  if (start.toMillis() > end.toMillis()) {
    throw new Error("End time must be after start time.");
  }
  if (peakStartTime.toMillis() > peakEndTime.toMillis()) {
    throw new Error("Peak end time must be after peak start time.");
  }
  if (offPeakStartTime.toMillis() > offPeakEndTime.toMillis()) {
    throw new Error("Peak end time must be after peak start time.");
  }

  // Calculate overlap of time ranges
  const peakStartInRange = DateTime.fromMillis(
    Math.max(start.toMillis(), peakStartTime.toMillis()),
    zone,
  );
  const peakEndInRange = DateTime.fromMillis(
    Math.max(end.toMillis(), peakEndTime.toMillis()),
    zone,
  );
  const offPeakStartInRange = DateTime.fromMillis(
    Math.max(start.toMillis(), offPeakStartTime.toMillis()),
    zone,
  );
  const offPeakEndInRange = DateTime.fromMillis(
    Math.max(end.toMillis(), offPeakEndTime.toMillis()),
    zone,
  );

  let peakDuration = 0;
  let offPeakDuration = 0;

  if (peakEndInRange.toMillis() > peakStartInRange.toMillis()) {
    // Calculate peak duration in hours
    peakDuration = peakEndInRange.diff(peakStartInRange, "hours").hours;
  }

  if (offPeakEndInRange.toMillis() > offPeakStartInRange.toMillis()) {
    // Calculate off-peak duration in hours
    offPeakDuration = offPeakEndInRange.diff(
      offPeakStartInRange,
      "hours",
    ).hours;
  }

  // Total duration in hours
  const totalDuration = end.diff(start, "hours").hours;

  // Calculate standard time (remaining time not covered by peak or off-peak)
  const remainingStandardTime = totalDuration - peakDuration - offPeakDuration;

  return {
    totalPeakTime: toRoundedFloat(peakDuration),
    totalOffPeakTime: toRoundedFloat(offPeakDuration),
    standardTime: Math.max(0, remainingStandardTime),
  };
};

const calculatePeakAndOffPeakTime = (
  startTime,
  endTime,
  peakStart,
  peakEnd,
  offPeakStart,
  offPeakEnd,
) => {
  try {
    const format = "yyyy-MM-dd HH:mm:ss";
    const zone = { zone: "Asia/Kolkata" };
    const start = DateTime.fromJSDate(startTime, zone);
    const end = DateTime.fromJSDate(endTime, zone);

    if (!start.isValid || !end.isValid) {
      throw new Error("Invalid start or end time.");
    }

    const startDate = start.toFormat("yyyy-MM-dd");

    const peakStartTime = DateTime.fromFormat(
      `${startDate} ${peakStart}`,
      "yyyy-MM-dd hh:mm:ss a",
      zone,
    );
    const peakEndTime = DateTime.fromFormat(
      `${startDate} ${peakEnd}`,
      "yyyy-MM-dd hh:mm:ss a",
      zone,
    );
    const offPeakStartTime = DateTime.fromFormat(
      `${startDate} ${offPeakStart}`,
      "yyyy-MM-dd hh:mm:ss a",
      zone,
    );
    const offPeakEndTime = DateTime.fromFormat(
      `${startDate} ${offPeakEnd}`,
      "yyyy-MM-dd hh:mm:ss a",
      zone,
    );

    // Ensure valid input ranges
    if (
      !peakStartTime.isValid ||
      !peakEndTime.isValid ||
      !offPeakStartTime.isValid ||
      !offPeakEndTime.isValid
    ) {
      throw new Error("Invalid peak or off-peak time format.");
    }

    if (start.toMillis() > end.toMillis()) {
      throw new Error("End time must be after start time.");
    }

    if (peakStartTime.toMillis() > peakEndTime.toMillis()) {
      throw new Error("Peak end time must be after peak start time.");
    }

    if (offPeakStartTime.toMillis() > offPeakEndTime.toMillis()) {
      throw new Error("Off-peak end time must be after off-peak start time.");
    }

    let peakDuration = 0;
    if (start < peakEndTime && end > peakStartTime) {
      const peakStartInRange = DateTime.max(start, peakStartTime);
      const peakEndInRange = DateTime.min(end, peakEndTime);
      peakDuration =
        peakEndInRange.diff(peakStartInRange, "minutes").minutes / 60;
    }

    let offPeakDuration = 0;
    if (start < offPeakEndTime && end > offPeakStartTime) {
      const offPeakStartInRange = DateTime.max(start, offPeakStartTime);
      const offPeakEndInRange = DateTime.min(end, offPeakEndTime);
      offPeakDuration =
        offPeakEndInRange.diff(offPeakStartInRange, "minutes").minutes / 60;
    }

    const totalDuration = end.diff(start, "minutes").minutes / 60;
    const standardTime = Math.max(
      0,
      totalDuration - peakDuration - offPeakDuration,
    );

    return {
      totalPeakTime: toRoundedFloat(peakDuration),
      totalOffPeakTime: toRoundedFloat(offPeakDuration),
      standardTime: toRoundedFloat(standardTime),
    };
  } catch (error) {
    throw error;
  }
};

const toRoundedFloat = (value) => {
  const num = parseFloat(value);
  if (!value || isNaN(num)) return "0.00";
  return num.toFixed(2);
  return (Math.round(num * 100) / 100).toFixed(2);
};

const getChargingCalculation = async (body) => {
  let { startTime, endTime, chargeBoxId, effectiveEnergyConsumed } = body;

  try {
    const configConstants = await getConfigConstants([
      "energyLoss",
      "peakRateMultiplier",
      "offPeakRateMultiplier",
      "peakStartTime",
      "peakEndTime",
      "offPeakStartTime",
      "offPeakEndTime",
    ]);

    let {
      peakStartTime = configConstants["peakStartTime"],
      peakEndTime = configConstants["peakEndTime"],
      offPeakStartTime = configConstants["offPeakStartTime"],
      offPeakEndTime = configConstants["offPeakEndTime"],
    } = body;

    let { totalPeakTime, totalOffPeakTime } = calculatePeakAndOffPeakTime(
      startTime,
      endTime,
      peakStartTime,
      peakEndTime,
      offPeakStartTime,
      offPeakEndTime,
    );

    const energyLoss = Number(configConstants["energyLoss"]);
    const peakRateMultiplier = Number(configConstants["peakRateMultiplier"]);
    const offPeakRateMultiplier = Number(
      configConstants["offPeakRateMultiplier"],
    );

    let baseRate,
      parkingRatePerHour,
      penalty,
      discountRate,
      taxRate,
      currency,
      currencyName,
      currencySymbol;

    let testConfig = null;
    // if chargeBoxId is in a bodyData
    if (chargeBoxId) {
      const charger = await getChargerDetailsData(chargeBoxId);

      if (charger?.baseRate) {
        const baseRateData = charger?.baseRate;

        baseRate = baseRateData.baseRateKWH;
        parkingRatePerHour = baseRateData.parkingRate;
        penalty = baseRateData.penalty;
        discountRate = baseRateData.discount;
        taxRate = baseRateData.taxRate;
        currency = baseRateData.currency;
        currencyName = baseRateData.currencyName;
        currencySymbol = baseRateData.currencySymbol;
      }
      // add test config
      testConfig = await TestingConfigurationRepository.findOne({
        where: {
          chargeBoxId,
        },
        select: ["captureAmount"],
      });
    }

    let {
      hours: chargingDurationHours,
      seconds: chargingDurationSeconds,
      minutes: chargingDurationMinutes,
    } = calculateChargingTime(startTime, endTime);

    if (effectiveEnergyConsumed) {
      effectiveEnergyConsumed = Number(effectiveEnergyConsumed);
    } else {
      effectiveEnergyConsumed = 0;
    }

    let baseFare = baseRate * effectiveEnergyConsumed; //Total cost of Energy
    if (totalPeakTime < 0) {
      totalPeakTime = 0;
    }
    let peakCharges = totalPeakTime * peakRateMultiplier; //Total Peak Charges

    if (totalOffPeakTime < 0) {
      totalOffPeakTime = 0;
    }
    let offPeakCharges = totalOffPeakTime * offPeakRateMultiplier; //Total OffPeak Charges

    let parkingFee = chargingDurationHours * parkingRatePerHour; //Parking Fee

    // let grossAmount =
    //   baseFare +
    //   peakCharges +
    //   offPeakCharges +
    //   parkingFee +
    //   parseFloat(penalty);
    let grossAmount = baseFare + peakCharges + offPeakCharges + parkingFee;

    let discountedAmount = grossAmount * (discountRate / 100); //Total Discount Amount
    discountedAmount =
      Math.floor(discountedAmount * Math.pow(10, 2)) / Math.pow(10, 2);

    let taxableAmount = grossAmount + parseFloat(penalty) - discountedAmount;

    let afterDiscountedAmount = taxableAmount; //Amount After Discount Amount

    let tax = taxableAmount * (taxRate / 100);
    tax = Math.floor(tax * Math.pow(10, 2)) / Math.pow(10, 2);

    // let netAmount = afterDiscountedAmount * (1 + taxRate / 100); //regionConstants.taxRate = B16
    let netAmount = taxableAmount + tax; //regionConstants.taxRate = B16

    let response = {
      chargingDuration: toRoundedFloat(chargingDurationSeconds),
      chargingDurationSeconds: toRoundedFloat(chargingDurationSeconds),
      chargingDurationMinutes: toRoundedFloat(chargingDurationMinutes),
      chargingDurationHours: toRoundedFloat(chargingDurationHours),
      effectiveBaseRate: toRoundedFloat(baseRate),
      effectiveEnergyLoss: toRoundedFloat(energyLoss),
      effectiveEnergyConsumed: toRoundedFloat(effectiveEnergyConsumed),
      parkingFee: toRoundedFloat(parkingFee),
      peakCharges: toRoundedFloat(peakCharges),
      offPeakCharges: toRoundedFloat(offPeakCharges),
      penaltyAmount: toRoundedFloat(penalty),
      baseFare: toRoundedFloat(baseFare),
      grossAmount: toRoundedFloat(grossAmount),
      discountedAmount: toRoundedFloat(discountedAmount),
      discount: toRoundedFloat(discountRate),
      taxRate: toRoundedFloat(taxRate),
      tax: toRoundedFloat(tax),
      afterDiscountedAmount: toRoundedFloat(afterDiscountedAmount),
      taxableAmount: toRoundedFloat(taxableAmount),
      netAmount: toRoundedFloat(netAmount),
      parkingRatePerHour: toRoundedFloat(parkingRatePerHour),
      currency,
      currencyName,
      currencySymbol,
    };
    // add test config for netAmount
    if (testConfig) {
      response["netAmount"] = toRoundedFloat(testConfig["captureAmount"]);
    }
    return {
      code: 200,
      message: response,
    };
  } catch (error) {
    return {
      code: 500,
      message: { error: error?.message },
    };
  }
};

const getOcppTransactionCalculation = async (
  transactionUuid,
  extraData = {},
) => {
  const {
    endTime: endTimeFromBody = null,
    meterStop: meterStopFromBody = null,
  } = extraData;

  const transactionData = await OcppTransactionsRepository.findOne({
    where: { transactionUuid },
  });

  let returnData = {
    code: 400,
    data: {},
  };

  try {
    if (transactionData) {
      const startTime = DateTime.fromJSDate(transactionData.startTime)
        .setZone("UTC", { keepLocalTime: true })
        .toJSDate();
      let endTime = DateTime.fromJSDate(transactionData.endTime)
        .setZone("UTC", { keepLocalTime: true })
        .toJSDate();

      if (transactionData?.isPaid === false && endTimeFromBody) {
        endTime = endTimeFromBody;
      }

      let meterStop = transactionData.meterStop;
      if (transactionData?.isPaid === false && meterStopFromBody) {
        meterStop = meterStopFromBody;
      }

      let effectiveEnergyConsumed = meterStop - transactionData.meterStart;
      if (effectiveEnergyConsumed < 0) {
        effectiveEnergyConsumed = 0;
      }

      let { message: chargingCalculationResponse } =
        await getChargingCalculation({
          startTime,
          endTime,
          chargeBoxId: transactionData.chargeBoxId,
          effectiveEnergyConsumed,
        });

      const etTestingData = await ChargerEtTestingRepository.findOne({
        where: { chargeBoxId: transactionData.chargeBoxId },
      });
      if (etTestingData) {
        // Changing the calculation values if it has ET Testing Data
        chargingCalculationResponse = await updateCalculationWithEtData(
          chargingCalculationResponse,
          etTestingData,
        );
      } else {
        const chargerData = await ChargerRepository.findOne({
          where: { chargeBoxId: transactionData.chargeBoxId },
        });

        const { upperLimit = 0 } = await getChargerPaymentConfig(
          chargerData.id,
        );
        if (upperLimit > 0) {
          // Changing the calculation values if it has upperLimit
          chargingCalculationResponse = await updateCalculationWithLimitData(
            upperLimit,
            chargingCalculationResponse,
          );
        }
      }

      // Checking if preauth amount is reached.
      let isPreauthReached = false;
      if (transactionData?.maxAmount) {
        if (Number(transactionData?.maxAmount) > 0) {
          if (
            Number(chargingCalculationResponse.netAmount) >=
            Number(transactionData?.maxAmount)
          ) {
            const scaleFactor =
              Number(transactionData?.maxAmount) /
              Number(chargingCalculationResponse.netAmount);

            // Changing the calculation values if preauth amount is reached
            chargingCalculationResponse =
              await updateCalculationWithPreauthAmount(
                scaleFactor,
                chargingCalculationResponse,
              );

            isPreauthReached = true;
          }
        }
      }

      const updateTransactionData = {
        chargingDuration: chargingCalculationResponse.chargingDuration
          ? Number(chargingCalculationResponse.chargingDuration)
          : 0,
        effectiveBaseRate: chargingCalculationResponse.effectiveBaseRate
          ? Number(chargingCalculationResponse.effectiveBaseRate)
          : 0,
        effectiveEnergyLoss: chargingCalculationResponse.effectiveEnergyLoss
          ? Number(chargingCalculationResponse.effectiveEnergyLoss)
          : 0,
        effectiveEnergyConsumed:
          chargingCalculationResponse.effectiveEnergyConsumed
            ? Number(chargingCalculationResponse.effectiveEnergyConsumed)
            : 0,
        parkingFee: chargingCalculationResponse.parkingFee
          ? Number(chargingCalculationResponse.parkingFee)
          : 0,
        peakCharges: chargingCalculationResponse.peakCharges
          ? Number(chargingCalculationResponse.peakCharges)
          : 0,
        offPeakCharges: chargingCalculationResponse.offPeakCharges
          ? Number(chargingCalculationResponse.offPeakCharges)
          : 0,
        penaltyAmount: chargingCalculationResponse.penaltyAmount
          ? Number(chargingCalculationResponse.penaltyAmount)
          : 0,
        baseFare: chargingCalculationResponse.baseFare
          ? Number(chargingCalculationResponse.baseFare)
          : 0,
        grossAmount: chargingCalculationResponse.grossAmount
          ? Number(chargingCalculationResponse.grossAmount)
          : 0,
        discount: chargingCalculationResponse.discount
          ? Number(chargingCalculationResponse.discount)
          : 0,
        taxRate: chargingCalculationResponse.taxRate
          ? Number(chargingCalculationResponse.taxRate)
          : 0,
        discountedAmount: chargingCalculationResponse.discountedAmount
          ? Number(chargingCalculationResponse.discountedAmount)
          : 0,
        tax: chargingCalculationResponse.tax
          ? Number(chargingCalculationResponse.tax)
          : 0,
        parkingRatePerHour: chargingCalculationResponse.parkingRatePerHour
          ? Number(chargingCalculationResponse.parkingRatePerHour)
          : 0,
        afterDiscountedAmount: chargingCalculationResponse.afterDiscountedAmount
          ? Number(chargingCalculationResponse.afterDiscountedAmount)
          : 0,
        taxableAmount: chargingCalculationResponse.taxableAmount
          ? Number(chargingCalculationResponse.taxableAmount)
          : 0,
        netAmount: chargingCalculationResponse.netAmount
          ? Number(chargingCalculationResponse.netAmount)
          : 0,
        currency: chargingCalculationResponse.currency
          ? chargingCalculationResponse.currency
          : null,
        currencyName: chargingCalculationResponse.currencyName
          ? chargingCalculationResponse.currencyName
          : null,
        currencySymbol: chargingCalculationResponse.currencySymbol
          ? chargingCalculationResponse.currencySymbol
          : null,
        endTime: convertDateTimezone(DateTime.fromJSDate(endTime)),
        endTimeLocal: convertDateTimezone(
          DateTime.fromJSDate(endTime),
          transactionData?.timezone ?? "UTC",
        ),
        isPreauthReached,
      };

      let updatedTransaction = transactionData;
      try {
        await OcppTransactionsRepository.update(
          transactionUuid,
          updateTransactionData,
        );

        updatedTransaction = await OcppTransactionsRepository.findOne({
          where: { transactionUuid },
        });

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
      } catch (error) {
        console.log("🚀 -----------------🚀");
        console.log("🚀 ~ error:", error?.message);
        console.log("🚀 -----------------🚀");
      }
      chargingCalculationResponse.chargingDuration = await formatDuration(
        chargingCalculationResponse.chargingDuration,
      );

      returnData = {
        code: 200,
        data: {
          ...chargingCalculationResponse,
          ocppTransactionId: updatedTransaction.transactionUuid,
          transactionId: updatedTransaction.chargerTransactionId,
          connectorId: updatedTransaction.connectorId,
          chargeBoxId: updatedTransaction.chargeBoxId,
          meterStop,
          region: "NAM",
          country: updatedTransaction?.country ?? "",
          timezone: updatedTransaction?.timezone ?? "",
          startTime: updatedTransaction?.startTime ?? "",
          startTimeLocal: updatedTransaction?.startTimeLocal ?? "",
          endTime: updatedTransaction?.endTime ?? "",
          endTimeLocal: updatedTransaction?.endTimeLocal ?? "",
          isPreauthReached,
        },
      };
    }
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ getOcppTransactionCalculation error:", error?.message);
    console.log("🚀 -----------------🚀");

    returnData = {
      code: 400,
      data: { message: error?.message },
    };
  }

  return returnData;
};

const getChargingLookup = async (
  ocppTransactionId,
  meterStop = null,
  paymentType = null,
) => {
  let extraData = {
    endTime: DateTime.utc({ zone: "UTC" }).toJSDate(),
  };

  if (meterStop) {
    extraData["meterStop"] = meterStop;
  }

  const { code, data } = await getOcppTransactionCalculation(
    ocppTransactionId,
    extraData,
  );

  if (code === 200) {
    const ocppTransactionData = await OcppTransactionsRepository.findOne({
      where: { transactionUuid: ocppTransactionId },
    });

    const pendingPayment = await PaymentTransactionsRepository.findOne({
      where: { ocppTransactionId, status: "Pending" },
    });
    const transactionData = {
      ocppTransactionId,
      cpoId: ocppTransactionData?.cpoId,
      chargeBoxId: ocppTransactionData?.chargeBoxId,
      connectorId: ocppTransactionData?.connectorId,
      paymentProvider: "Pending",
      status: "Pending",
      timezone: ocppTransactionData?.timezone,
      country: ocppTransactionData?.country,
      dateTime: convertDateTimezone(DateTime.utc()),
      dateTimeLocal: convertDateTimezone(
        DateTime.utc(),
        ocppTransactionData?.timezone,
      ),
      meterStop: null,
      requestedAt: convertDateTimezone(
        DateTime.fromJSDate(extraData.endTime, {
          zone: "UTC",
        }),
      ),
      createdAtLocal: convertDateTimezone(
        DateTime.utc(),
        ocppTransactionData?.timezone,
      ),
    };

    if (meterStop) {
      transactionData["meterStop"] = meterStop;
    }

    if (pendingPayment) {
      await PaymentTransactionsRepository.update(
        pendingPayment.paymentTransactionId,
        transactionData,
      );
    } else {
      await PaymentTransactionsRepository.save(transactionData);
    }

    if (paymentType === "razorpay") {
      const paymentTransaction = await PaymentTransactionsRepository.findOne({
        where: { ocppTransactionId, status: "Pending" },
      });

      // TODO: Generate Razorpay QR-Code
      const upiQrCodeLink = await getPaymentQrCode(
        {
          payment_amount: Number(data?.netAmount) * 100,
          notes: {
            paymentTransactionId: paymentTransaction?.paymentTransactionId,
            ocppTransactionId,
          },
        },
        paymentTransaction?.paymentTransactionId,
      );

      await PaymentTransactionsRepository.update(
        paymentTransaction?.paymentTransactionId,
        { upiQrCodeLink: upiQrCodeLink?.cropped },
      );

      data["upiQrCodeLink"] = upiQrCodeLink?.cropped;
    }
  }

  return { code, data };
};

const getChargerCountForDashboard = async () => {
  const query = `
    SELECT
      COALESCE(SUM(CASE WHEN status = 'registered' THEN 1 ELSE 0 END), 0) AS registered,
      COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) AS active,
      COALESCE(SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END), 0) AS available,
      COALESCE(SUM(CASE WHEN status = 'busy' THEN 1 ELSE 0 END), 0) AS busy,
      COALESCE(SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END), 0) AS offline,
      COALESCE(SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END), 0) AS disabled,
      COALESCE(SUM(
        CASE
          WHEN status IN ('available', 'busy', 'offline') THEN 1
          ELSE 0
        END
      ), 0) AS total
    FROM charger
  `;

  const result = await ChargerRepository.query(query);
  return result[0];
};

const getChargerDataForLocationsMap = async (where = {}) => {
  const responseData = {
    [ChargerStatuses.AVAILABLE]: [],
    [ChargerStatuses.BUSY]: [],
    [ChargerStatuses.OFFLINE]: [],
    all: [],
  };

  try {
    const chargerData = await ChargerRepository.find({
      where: {
        status: In([
          ChargerStatuses.AVAILABLE,
          ChargerStatuses.BUSY,
          ChargerStatuses.OFFLINE,
        ]),
        ...where,
      },
      select: [
        "serialNumber",
        "status",
        "lat",
        "lng",
        "country",
        "chargeBoxId",
        "chargingStatus",
      ],
    });

    chargerData.forEach((eachCharger) => {
      responseData[eachCharger.status].push(eachCharger);
      responseData.all.push(eachCharger);
    });

    return responseData;
  } catch (error) {
    console.error("Error fetching charger data for locations map:", error);
    throw new Error(
      "An error occurred while fetching charger data for locations map",
    );
  }
};

const formatRawMeterValues = async (params) => {
  const { transactionId, connectorId } = params.data;

  // Fetch the raw meter values from MySQL
  const rawMeterValues = await ChargerMeterValuesRepository.findOne({
    where: { transactionId, connectorId },
    order: {
      createdAt: "DESC", // Adjust sorting if necessary
    },
  });

  // Format the data
  const responseObj = { connectorId, transactionId };

  if (
    rawMeterValues &&
    rawMeterValues.meterValue &&
    rawMeterValues.meterValue.length > 0 &&
    rawMeterValues.meterValue[0] &&
    rawMeterValues.meterValue[0].sampledValue &&
    rawMeterValues.meterValue[0].sampledValue.length > 0
  ) {
    const sampledValuesArray = rawMeterValues.meterValue[0].sampledValue;
    sampledValuesArray.forEach((obj) => {
      const fieldName = MeterValuesFieldMapping[obj.measurand];
      if (fieldName) {
        responseObj[fieldName] = Number(obj.value);
      }
    });
  }

  return responseObj;
};

const modifyChargerOnChargingStatusUpdate = async (params) => {
  const { chargerId, chargingStatus } = params;

  const updateChargerPayload = { chargingStatus };

  //When update charging status: Preparing | Charging, then update charger status to Busy
  if (
    [ChargingStatuses.CHARGING, ChargingStatuses.PREPARING].includes(
      chargingStatus,
    )
  ) {
    updateChargerPayload["status"] = ChargerStatuses.BUSY;
  }

  if (
    [
      ChargingStatuses.FAULTED,
      ChargingStatuses.SUSPENDED_EVSE,
      ChargingStatuses.SUSPENDED_EV,
    ].includes(chargingStatus)
  ) {
    updateChargerPayload["status"] = ChargerStatuses.OFFLINE;
  }

  //When update charging status: Finishing | Available -> Set last heartbeat to current time and change charger status to Available
  if (
    [ChargingStatuses.FINISHING, ChargingStatuses.AVAILABLE].includes(
      chargingStatus,
    )
  ) {
    updateChargerPayload["status"] = ChargerStatuses.AVAILABLE;
    updateChargerPayload["lastHeartbeat"] = DateTime.utc().toISO();
  }

  await ChargerRepository.update(chargerId, updateChargerPayload);

  // Fetch the updated charger
  const updatedCharger = await ChargerRepository.findOne({
    where: { id: chargerId },
  });

  await sendChargerUpdatedPusherEvent(chargerId);

  try {
    if (chargingStatus === ChargingStatuses.AVAILABLE) {
      const hasRollout = await RolloutDeviceStatesModel.findOne({
        device: updatedCharger?.serialNumber,
        status: RolloutDeviceStates.DEVICE_REMOTE_STATE_SYNCED,
      }).lean();

      if (hasRollout) {
        if (updatedCharger?.status) {
          if (
            ![
              ChargerStatuses.GENERATED,
              ChargerStatuses.REGISTERED,
              ChargerStatuses.DISABLED,
            ].includes(updatedCharger?.status)
          ) {
            await sendOcppEvent(
              updatedCharger?.chargeBoxId,
              OcppEvents.ChangeAvailability,
              { connectorId: 1, type: "Inoperative" },
            );
          }
        }
      }
    }
  } catch (error) {}

  return updatedCharger;
};

const parseTLV = (resp, returnObj = false, removeEmpty = false) => {
  try {
    // Parsing EMV data
    let parsedData = [];
    nodeEmv.parse(resp, (data) => {
      if (data != null) {
        parsedData = data;
      }
    });

    const objResult = {};
    const objResultWithoutEmpty = [];
    const result = parsedData.map((p) => {
      objResult[p.tag] = p.value;

      if (p.value) {
        objResultWithoutEmpty.push({
          key: p.tag,
          value: p.value,
        });
      }
      return {
        key: p.tag,
        value: p.value,
      };
    });

    if (removeEmpty) {
      return objResultWithoutEmpty;
    }

    return returnObj ? objResult : result;
  } catch (error) {
    throw new Error("Error in handling TLV data");
  }
};

const getOcppIdTag = async (fieldToMatch = "idTag", length = 20) => {
  let idTag = uuidv4().replace(/-/g, "").slice(0, length).toUpperCase();

  // Loop until a unique idTag is generated
  while (
    await OcppTransactionsRepository.findOne({
      where: { [fieldToMatch]: idTag },
    })
  ) {
    idTag = uuidv4().replace(/-/g, "").slice(0, length).toUpperCase();
  }

  return idTag;
};

const getRemoteStartIdTag = async (length = 20) => {
  let idTag = uuidv4().replace(/-/g, "").slice(0, length).toUpperCase();

  return idTag;
};

const getOcppTransaction = async (params) => {
  const {
    chargeBoxId,
    hashedPan = null,
    currency = null,
    charger = {},
    connectorId = null,
    idTag: idTagParam = null,
    transactionUuid = null,
    transactionStatus = null,

    language = "en",
    isPurchaseOnly = false,
    startMethod = "By Card",
    paymentProvider = "moneris",
    contractId = null,
    customerId = null,
    maxAmount = 0,
  } = params;
  let { getOnly = false } = params;

  // For PreAuth
  let where = {
    transactionStatus: transactionStatus ? transactionStatus : "preauth",
    chargeBoxId,
    connectorId,
    hashedPan,
  };
  if (getOnly) {
    where = {
      transactionStatus: transactionStatus ? transactionStatus : "authorized",
      chargeBoxId,
      idTag: idTagParam,
    };
    if (connectorId) {
      where["connectorId"] = connectorId;
    }
  }
  if (transactionUuid !== null) {
    where = {
      transactionUuid,
      chargeBoxId,
      connectorId,
      hashedPan,
    };
    getOnly = true;
  }

  const transactionData = await OcppTransactionsRepository.findOne({
    where: { ...where, isTestTransaction: false },
    order: { createdAt: "DESC" },
  });

  if (getOnly) {
    return transactionData;
  }

  if (transactionData?.transactionUuid) {
    await OcppTransactionsRepository.update(transactionData.transactionUuid, {
      transactionStatus: "cancelled",
    });
    const pendingPayment = await PaymentTransactionsRepository.findOne({
      where: {
        ocppTransactionId: transactionData.transactionUuid,
        status: "Pending",
      },
    });
    if (pendingPayment?.paymentTransactionId) {
      await PaymentTransactionsRepository.update(
        pendingPayment?.paymentTransactionId,
        { status: "Cancelled" },
      );
    }
  }

  const timezone = charger?.timezone ?? "UTC";
  // const idTag = await getOcppIdTag();
  const idTag = hashedPan;

  const transactionCount = Number(charger?.latestTransactionId ?? 0);

  let currencyName = null;
  let currencySymbol = null;

  try {
    if (currency) {
      const currencyDetails = CurrencyData[currency] ?? null;

      if (currencyDetails) {
        currencyName = currencyDetails.name;
        currencySymbol = currencyDetails.symbol;
      }
    }
  } catch (error) {}

  const createTransactionData = {
    cpoId: charger?.cpoId,
    orderId: getOrderId(),
    transactionStatus: transactionStatus ? transactionStatus : "preauth",
    connectorId,
    hashedPan,
    chargeBoxId,
    evseStationId: charger?.evseStationId,
    timezone,
    country: charger?.country,
    chargerTransactionId: transactionCount + 1,
    idTag,
    currency,
    currencyName,
    currencySymbol,
    language,
    purchaseOnly: isPurchaseOnly,
    paymentProvider,
    paymentType: isPurchaseOnly ? "Purchase" : "Pre-Auth",
    contractId,
    customerId,
    maxAmount,
    startMethod,
    endMethod: "-",
  };

  if (timezone) {
    try {
      createTransactionData["createdAtLocal"] = convertDateTimezone(
        DateTime.utc(),
        timezone,
      );
    } catch (error) {}
  }

  const createdTransaction = await OcppTransactionsRepository.save(
    createTransactionData,
  );

  if (charger) {
    await ChargerRepository.update(charger.id, {
      latestTransactionId: transactionCount + 1,
    });
  }

  return createdTransaction;
};

const getPaymentTransaction = async (params) => {
  let {
    ocppTransactionData,
    amount,
    currency,
    hashedPan,
    deviceId,
    deviceType = null,
    posCode = null,
    paymentProvider,
    idTag,
  } = params;

  if (paymentProvider == "littlepay") {
    deviceType = null;
    posCode = null;
  }

  const ocppTransactionId = ocppTransactionData?.transactionUuid;

  const pendingPayment = await PaymentTransactionsRepository.findOne({
    where: { ocppTransactionId, status: "Pending" },
  });

  const transactionData = {
    ocppTransactionId,
    cpoId: ocppTransactionData?.cpoId,
    chargeBoxId: ocppTransactionData?.chargeBoxId,
    connectorId: ocppTransactionData?.connectorId,
    paymentProvider,
    timezone: ocppTransactionData?.timezone,
    country: ocppTransactionData?.country,
    dateTime: convertDateTimezone(DateTime.utc()),
    dateTimeLocal: convertDateTimezone(
      DateTime.utc(),
      ocppTransactionData?.timezone,
    ),

    preauthAmount: amount,
    preauthCurrency: currency,
    hashedPan,
    idTag,
    deviceId,
    deviceType,
    posCode,

    createdAtLocal: convertDateTimezone(
      DateTime.utc(),
      ocppTransactionData?.timezone,
    ),
  };

  let paymentTransactionId = null;

  if (pendingPayment) {
    await PaymentTransactionsRepository.update(
      pendingPayment.paymentTransactionId,
      transactionData,
    );
    paymentTransactionId = pendingPayment.paymentTransactionId;
  } else {
    const createdPaymentTransaction =
      await PaymentTransactionsRepository.save(transactionData);
    paymentTransactionId = createdPaymentTransaction?.paymentTransactionId;
  }

  if (paymentTransactionId) {
    const updatedTransactionData = await PaymentTransactionsRepository.findOne({
      where: { paymentTransactionId },
    });

    return updatedTransactionData;
  }

  return {};
};

const getChargerPaymentConfig = async (chargerId) => {
  const paymentConfig = await ChargerPaymentConfigRepository.findOne({
    where: { chargerId },
  });

  let device_type = "idtech_bdk_ctls";
  let pos_code = "27";
  let device_id = null;
  let paymentProvider = null;
  let paymentMfgId = null;
  let upperLimit = 0;
  let lowerLimit = 0;

  if (paymentConfig) {
    if (paymentConfig?.deviceType) {
      device_type = paymentConfig?.deviceType;
    }
    if (paymentConfig?.posCode) {
      pos_code = paymentConfig?.posCode;
    }
    if (paymentConfig?.paymentDeviceId) {
      device_id = paymentConfig?.paymentDeviceId;
    }
    if (paymentConfig?.paymentProvider) {
      paymentProvider = paymentConfig?.paymentProvider;
    }
    if (paymentConfig?.paymentMfgId) {
      paymentMfgId = paymentConfig?.paymentMfgId;
    }
    if (paymentConfig?.lowerLimit > 0) {
      lowerLimit = Number(paymentConfig?.lowerLimit);
    }
    if (paymentConfig?.upperLimit > 0) {
      upperLimit = Number(paymentConfig?.upperLimit);
    }
  }

  return {
    device_type,
    pos_code,
    device_id,
    paymentProvider,
    paymentMfgId,
    upperLimit,
    lowerLimit,
  };
};

const hexToAscii = (hex) => Buffer.from(hex, "hex").toString("utf-8");

const getTranslation = async (
  language = "en",
  paymentStatusMessage,
  langFor = "csms",
) => {
  let returnData = paymentStatusMessage;

  if (paymentStatusMessage) {
    try {
      const langData = await LanguageRepository.findOne({
        where: { langFor, en: paymentStatusMessage },
      });

      if (langData) {
        if (langData[language]) {
          returnData = langData[language];
        }
      } else {
        try {
          await MessagesToTranslateModel.create({
            message: paymentStatusMessage,
          });
        } catch (error) {}
      }
    } catch (error) {
      console.log(error);
    }
  }
  return returnData;
};

const cleanMessage = (message) => {
  let returnMessage = message;
  try {
    if (typeof message !== "string") return message;

    // If message contains '*', handle both parts
    if (message.includes("*")) {
      const [left, right] = message.split("*");
      const leftClean = left.trim();
      const rightClean = right.replace(/=+$/, "").trim();

      if (leftClean && rightClean) {
        return `${leftClean}: ${rightClean}`;
      }

      // If only one part is useful, return it
      return (leftClean || rightClean).trim();
    }

    returnMessage = returnMessage.replace(/\*\s*=+$/, "").trim();

    if (returnMessage) {
      if (returnMessage?.includes("Cancelled: Could not decrypt track2")) {
        returnMessage = "Cancelled: Could not decrypt track2";
      }
    }
  } catch (error) {}

  return returnMessage;
};

const getTransResponse = async (params) => {
  let {
    type = "Preauth",
    hasError = "false",
    chargerInfo,
    paymentProvider = "moneris",
    paymentStatus = "unauthorized",
    paymentStatusMessage = "Request failed.",
    sessionId = null,
    request = null,
    language = "en",
  } = params;

  if (paymentStatusMessage) {
    paymentStatusMessage = cleanMessage(paymentStatusMessage);
    paymentStatusMessage = await getTranslation(language, paymentStatusMessage);
  }

  let id = "cgx:pay:0.1:2025:1:PreauthResponse";
  let title = "PreauthResponse";
  let errorType = "Pre-Auth";

  if (type == "EmvDataAdd") {
    id = "cgx:pay:0.1:2025:1:EmvdataAddResponse";
    title = "EmvdataAddResponse";
    errorType = "EmvData-Add";
  } else if (type == "Capture") {
    id = "cgx:pay:0.1:2025:1:PreauthCompleteResponse";
    title = "PreauthCompleteResponse";
    errorType = "Capture";
  } else if (type == "Cancel") {
    id = "cgx:pay:0.1:2025:1:PreauthCancelResponse";
    title = "PreauthCancelResponse";
    errorType = "Cancel";
  } else if (type == "Refund") {
    id = "cgx:pay:0.1:2025:1:RefundResponse";
    title = "RefundResponse";
    errorType = "Refund";
  } else if (type == "Purchase") {
    id = "cgx:pay:0.1:2025:1:PurchaseResponse";
    title = "PurchaseResponse";
    errorType = "Purchase";
  }

  if (hasError === "true") {
    const errRes = {
      $schema: "http://json-schema.org/draft-04/schema#",
      id,
      title,
      chargerInfo,
      transactionInfo: {
        paymentStatus,
        paymentStatusMessage,
      },
    };

    await saveTransactionErrorLogs({
      paymentProvider,
      transactionId: sessionId,
      type: errorType,
      request,
      response: errRes,
    });

    return errRes;
  }

  const {
    currency = null,
    transactionId = null,
    idTag,
    amount,
    timezone = "UTC",
    country = null,
  } = params;

  let currencyName = null;
  let currencySymbol = null;
  if (currency) {
    const currencyDetails = CurrencyData[currency] ?? null;

    if (currencyDetails) {
      currencyName = currencyDetails.name;
      currencySymbol = currencyDetails.symbol;
    }
  }

  const timestampLocal = convertDateTimezone(DateTime.utc(), timezone);

  const returnResponseData = {
    $schema: "http://json-schema.org/draft-04/schema#",
    id,
    title,
    chargerInfo,
    transactionInfo: {
      transactionId,
      sessionId,
      idTag,
      amount,
      paymentStatus,
      paymentStatusMessage,
      timestamp: convertDateTimezone(DateTime.utc()),
      timestampLocal,
      timezone,
      country,
      currency,
      currencyName,
      currencySymbol,
    },
  };

  return returnResponseData;
};

const saveTransactionErrorLogs = async (params) => {
  try {
    return TransactionErrorLogsModel.create(params);
  } catch (error) {
    return true;
  }
};

const getUtcIsoStr = (dt) => {
  try {
    return `${dt?.replace(" ", "T")}.000Z`;
  } catch (error) {
    return dt;
  }
};

const updateCalculationByCaptureAmount = async (transactionUuid) => {
  try {
    const captureLog = await PreauthCompleteLogsModel.findOne({
      transactionId: transactionUuid,
      "response.transactionInfo.paymentStatus": "success",
    }).sort({ createdAt: -1 });

    if (captureLog?.response?.transactionInfo?.amount) {
      const ocppLog = await OcppLogModel.findOne({
        transactionUuid,
        "ocppSchema.messageId": "chargingAmount",
        "ocppSchema.parsedData.netAmount":
          captureLog?.response?.transactionInfo?.amount,
      }).sort({ createdAt: 1 });

      if (ocppLog?.ocppSchema?.parsedData) {
        const meterValueData = ocppLog?.ocppSchema?.parsedData;
        const updateTransactionData = { transactionUuid };

        if (meterValueData) {
          if (meterValueData?.meterStop) {
            updateTransactionData["meterStop"] = Number(
              meterValueData?.meterStop,
            );
          }
          if (meterValueData?.chargingDurationSeconds) {
            updateTransactionData["chargingDuration"] = Number(
              meterValueData?.chargingDurationSeconds,
            );
          }
          if (meterValueData?.effectiveBaseRate) {
            updateTransactionData["effectiveBaseRate"] = Number(
              meterValueData?.effectiveBaseRate,
            );
          }
          if (meterValueData?.effectiveEnergyLoss) {
            updateTransactionData["effectiveEnergyLoss"] = Number(
              meterValueData?.effectiveEnergyLoss,
            );
          }
          if (meterValueData?.effectiveEnergyConsumed) {
            updateTransactionData["effectiveEnergyConsumed"] = Number(
              meterValueData?.effectiveEnergyConsumed,
            );
          }
          if (meterValueData?.parkingFee) {
            updateTransactionData["parkingFee"] = Number(
              meterValueData?.parkingFee,
            );
          }
          if (meterValueData?.peakCharges) {
            updateTransactionData["peakCharges"] = Number(
              meterValueData?.peakCharges,
            );
          }
          if (meterValueData?.offPeakCharges) {
            updateTransactionData["offPeakCharges"] = Number(
              meterValueData?.offPeakCharges,
            );
          }
          if (meterValueData?.penaltyAmount) {
            updateTransactionData["penaltyAmount"] = Number(
              meterValueData?.penaltyAmount,
            );
          }
          if (meterValueData?.baseFare) {
            updateTransactionData["baseFare"] = Number(
              meterValueData?.baseFare,
            );
          }
          if (meterValueData?.grossAmount) {
            updateTransactionData["grossAmount"] = Number(
              meterValueData?.grossAmount,
            );
          }
          if (meterValueData?.discount) {
            updateTransactionData["discount"] = Number(
              meterValueData?.discount,
            );
          }
          if (meterValueData?.taxRate) {
            updateTransactionData["taxRate"] = Number(meterValueData?.taxRate);
          }
          if (meterValueData?.discountedAmount) {
            updateTransactionData["discountedAmount"] = Number(
              meterValueData?.discountedAmount,
            );
          }
          if (meterValueData?.tax) {
            updateTransactionData["tax"] = Number(meterValueData?.tax);
          }
          if (meterValueData?.parkingRatePerHour) {
            updateTransactionData["parkingRatePerHour"] = Number(
              meterValueData?.parkingRatePerHour,
            );
          }
          if (meterValueData?.afterDiscountedAmount) {
            updateTransactionData["afterDiscountedAmount"] = Number(
              meterValueData?.afterDiscountedAmount,
            );
          }
          if (meterValueData?.taxableAmount) {
            updateTransactionData["taxableAmount"] = Number(
              meterValueData?.taxableAmount ?? 0,
            );
          }
          if (meterValueData?.netAmount) {
            updateTransactionData["netAmount"] = Number(
              meterValueData?.netAmount,
            );
          }
          if (meterValueData?.currency) {
            updateTransactionData["currency"] = meterValueData?.currency;
          }
          if (meterValueData?.currencyName) {
            updateTransactionData["currencyName"] =
              meterValueData?.currencyName;
          }
          if (meterValueData?.currencySymbol) {
            updateTransactionData["currencySymbol"] =
              meterValueData?.currencySymbol;
          }
          if (meterValueData?.endTime) {
            updateTransactionData["endTime"] = convertDateTimezone(
              DateTime.fromISO(meterValueData?.endTime),
            );
          }
          if (meterValueData?.endTimeLocal) {
            updateTransactionData["endTimeLocal"] = convertDateTimezone(
              DateTime.fromISO(meterValueData?.endTimeLocal),
            );
          }
        }

        await OcppTransactionsRepository.update(
          transactionUuid,
          updateTransactionData,
        );
      }
    }
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ updateCalculationByCaptureAmount error:", error?.message);
    console.log("🚀 -----------------🚀");
    return true;
  }
};

const roundToNextFigure = (num) => {
  let magnitude = Math.pow(10, Math.floor(Math.log10(num)));
  return Math.ceil(num / magnitude) * magnitude + magnitude / 2;
};

const addMeasurandValues = (ocppSchema) => {
  try {
    const updatedSchema = { ...ocppSchema };

    let parsedMeterValue = {
      voltageXCurrentImport: 0,
      currentImport: 0,
      currentImportData: {},
      voltage: 0,
      voltageData: {},
      energyActiveImportRegister: 0,
      energyActiveImportRegisterData: {},
      powerActiveImport: 0,
      powerActiveImportData: {},
    };

    const sampledValues =
      Array.isArray(ocppSchema?.meterValue) &&
      Array.isArray(ocppSchema.meterValue[0]?.sampledValue)
        ? ocppSchema.meterValue[0].sampledValue
        : [];

    sampledValues.forEach((item) => {
      if (!item || typeof item !== "object") return;

      const val = parseFloat(item.value) || 0;

      switch (item.measurand) {
        case "Current.Import":
          parsedMeterValue["currentImport"] = val;
          parsedMeterValue["currentImportData"] = item;
          break;
        case "Voltage":
          parsedMeterValue["voltage"] = val;
          parsedMeterValue["voltageData"] = item;
          break;
        case "Energy.Active.Import.Register":
          parsedMeterValue["energyActiveImportRegister"] = val;
          parsedMeterValue["energyActiveImportRegisterData"] = item;
          break;
        case "Power.Active.Import":
          parsedMeterValue["powerActiveImport"] = val;
          parsedMeterValue["powerActiveImportData"] = item;
          break;
      }
    });

    if (parsedMeterValue["voltage"] && parsedMeterValue["currentImport"]) {
      parsedMeterValue["voltageXCurrentImport"] =
        Number(parsedMeterValue["voltage"] ?? 0) *
        Number(parsedMeterValue["currentImport"] ?? 0);
    }

    return {
      ...updatedSchema,
      parsedMeterValue,
    };
  } catch (err) {
    console.warn("Error processing OCPP schema:", err?.message);
    return ocppSchema;
  }
};

const updateCalculationWithEtData = async (
  chargingCalculationResponse,
  etTestingData,
) => {
  try {
    const returnCalculation = deepClone(chargingCalculationResponse);

    returnCalculation["effectiveBaseRate"] = Number(
      etTestingData?.purchaseAmount ?? 0,
    ).toFixed(2);
    returnCalculation["effectiveEnergyConsumed"] = "1.00";
    returnCalculation["parkingFee"] = "0.00";
    returnCalculation["peakCharges"] = "0.00";
    returnCalculation["offPeakCharges"] = "0.00";
    returnCalculation["penaltyAmount"] = "0.00";
    returnCalculation["baseFare"] = Number(
      etTestingData?.purchaseAmount ?? 0,
    ).toFixed(2);
    returnCalculation["grossAmount"] = Number(
      etTestingData?.purchaseAmount ?? 0,
    ).toFixed(2);
    returnCalculation["discount"] = "0.00";
    returnCalculation["taxRate"] = "0.00";
    returnCalculation["discountedAmount"] = "0.00";
    returnCalculation["tax"] = "0.00";
    returnCalculation["parkingRatePerHour"] = "0.00";
    returnCalculation["afterDiscountedAmount"] = "0.00";
    returnCalculation["taxableAmount"] = Number(
      etTestingData?.purchaseAmount ?? 0,
    ).toFixed(2);
    returnCalculation["netAmount"] = Number(
      etTestingData?.purchaseAmount ?? 0,
    ).toFixed(2);

    return returnCalculation;
  } catch (err) {
    console.warn("Error updateCalculationWithEtData:", err?.message);
    return chargingCalculationResponse;
  }
};

const updateCalculationWithLimitData = async (
  upperLimit,
  chargingCalculationResponse,
) => {
  try {
    const returnCalculation = deepClone(chargingCalculationResponse);

    if (Number(returnCalculation["netAmount"] ?? 0) > upperLimit) {
      returnCalculation["netAmount"] = Number(upperLimit).toFixed(2);
      returnCalculation["taxableAmount"] = Number(upperLimit).toFixed(2);
      returnCalculation["afterDiscountedAmount"] =
        Number(upperLimit).toFixed(2);
      returnCalculation["grossAmount"] = Number(upperLimit).toFixed(2);
      returnCalculation["baseFare"] = Number(upperLimit).toFixed(2);

      let effectiveBaseRate = Number(
        returnCalculation["effectiveBaseRate"] ?? 0,
      ).toFixed(2);
      let effectiveEnergyConsumed = Number(
        returnCalculation["effectiveEnergyConsumed"] ?? 0,
      );

      if (effectiveEnergyConsumed > 0) {
        effectiveBaseRate = Number(
          upperLimit / effectiveEnergyConsumed,
        ).toFixed(2);
      } else {
        effectiveBaseRate = upperLimit;
        effectiveEnergyConsumed = 1;
      }

      returnCalculation["effectiveBaseRate"] =
        Number(effectiveBaseRate).toFixed(2);
      returnCalculation["effectiveEnergyConsumed"] = Number(
        effectiveEnergyConsumed,
      ).toFixed(2);
    }

    return returnCalculation;
  } catch (err) {
    console.warn("Error updateCalculationWithLimitData:", err?.message);
    return chargingCalculationResponse;
  }
};

const updateCalculationWithPreauthAmount = async (
  scaleFactor,
  chargingCalculationResponse,
) => {
  try {
    const getScaledAmount = (amt) => {
      return Number(amt * scaleFactor).toFixed(2);
    };

    const returnCalculation = deepClone(chargingCalculationResponse);

    returnCalculation.baseFare = getScaledAmount(returnCalculation.baseFare);
    returnCalculation.discount = getScaledAmount(returnCalculation.discount);
    returnCalculation.parkingFee = getScaledAmount(
      returnCalculation.parkingFee,
    );
    returnCalculation.peakCharges = getScaledAmount(
      returnCalculation.peakCharges,
    );
    returnCalculation.offPeakCharges = getScaledAmount(
      returnCalculation.offPeakCharges,
    );
    returnCalculation.discountedAmount = getScaledAmount(
      returnCalculation.discountedAmount,
    );
    returnCalculation.tax = getScaledAmount(returnCalculation.tax);
    returnCalculation.taxRate = getScaledAmount(returnCalculation.taxRate);
    returnCalculation.taxableAmount = getScaledAmount(
      returnCalculation.taxableAmount,
    );
    returnCalculation.afterDiscountedAmount = getScaledAmount(
      returnCalculation.afterDiscountedAmount,
    );
    returnCalculation.grossAmount = getScaledAmount(
      returnCalculation.grossAmount,
    );
    returnCalculation.penaltyAmount = getScaledAmount(
      returnCalculation.penaltyAmount,
    );
    returnCalculation.netAmount = getScaledAmount(returnCalculation.netAmount);
    returnCalculation.parkingRatePerHour = getScaledAmount(
      returnCalculation.parkingRatePerHour,
    );
    returnCalculation.effectiveBaseRate = getScaledAmount(
      returnCalculation.effectiveBaseRate,
    );

    return returnCalculation;
  } catch (err) {
    console.warn("Error updateCalculationWithPreauthAmount:", err?.message);
    return chargingCalculationResponse;
  }
};

const sendChargerUpdatedPusherEvent = async (chargerId) => {
  try {
    let charger = await getChargerByIdentity(chargerId);
    if (charger) {
      await sendDataToPusher({
        channelName: PusherConstants.channels.PUSHER_NODE_APP,
        eventName: PusherConstants.events.charger.CHARGER_UPDATED,
        data: {
          chargerId: charger.id,
          chargeBoxId: charger.chargeBoxId,
          serialNumber: charger.serialNumber,
          status: charger.status,
          chargingStatus: charger.chargingStatus,
        },
      });

      if (charger?.cpoId) {
        await sendDataToPusher({
          channelName: charger?.cpoId,
          eventName: PusherConstants.events.charger.CHARGER_UPDATED,
          data: {
            chargerId: charger.id,
            chargeBoxId: charger.chargeBoxId,
            serialNumber: charger.serialNumber,
            status: charger.status,
            chargingStatus: charger.chargingStatus,
          },
        });
      }
    }

    return true;
  } catch (err) {
    console.warn("Error sendChargerUpdatedPusherEvent:", err?.message);
    return true;
  }
};

const getRandomElement = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const generateChargerAuthCodes = async (chargerId) => {
  try {
    let charger = await getChargerByIdentity(chargerId);
    if (charger) {
      const hasCode = await ChargerAuthCodesRepository.findOne({
        where: { chargerId: charger?.id },
      });

      if (hasCode) {
        if (hasCode?.isAttempted) {
          await ChargerAuthCodesRepository.delete({
            chargerId: charger?.id,
          });
        } else {
          if (
            DateTime.fromJSDate(charger?.authCodeExpireAt).toUTC().toMillis() <
            DateTime.utc().toMillis()
          ) {
            await ChargerAuthCodesRepository.delete({
              chargerId: charger?.id,
            });
          } else {
            return {
              authCode: charger?.authCode,
              authCodes: [
                hasCode?.authCode1,
                hasCode?.authCode2,
                hasCode?.authCode3,
              ],
              authCodeExpireAt: charger?.authCodeExpireAt,
            };
          }
        }
      }

      let authCodes = [];
      while (true) {
        const tmpCode = generateRandomOtp(2);
        if (!authCodes.includes(tmpCode)) {
          authCodes.push(tmpCode);
        }

        if (authCodes?.length == 3) {
          break;
        }
      }

      const authCode = getRandomElement(authCodes);

      const createdAtLocal = convertDateTimezone(
        DateTime.utc(),
        charger?.timezone ?? "UTC",
      );

      await ChargerAuthCodesRepository.insert({
        chargerId: charger?.id,
        chargeBoxId: charger?.chargeBoxId,
        authCode1: authCodes[0],
        authCode2: authCodes[1],
        authCode3: authCodes[2],
        timezone: charger?.timezone ?? "UTC",
        country: charger?.country,
        createdAtLocal,
      });

      const authCodeExpireAt = convertDateTimezone(
        DateTime.utc().plus({ hours: 6 }),
      );

      await ChargerRepository.update(
        { id: charger?.id },
        { authCode, authCodeExpireAt },
      );

      const finalCharger = await ChargerRepository.findOne({
        where: { id: charger?.id },
      });
      const finalCode = await ChargerAuthCodesRepository.findOne({
        where: { chargerId: charger?.id },
      });

      return {
        authCode: finalCharger?.authCode,
        authCodes: [
          finalCode?.authCode1,
          finalCode?.authCode2,
          finalCode?.authCode3,
        ],
        authCodeExpireAt: finalCharger?.authCodeExpireAt,
      };
    }
  } catch (err) {
    console.warn("Error generateChargerAuthCodes:", err?.message);
  }

  return false;
};

const generateChargerCardPassCode = async (chargerId) => {
  try {
    let charger = await getChargerByIdentity(chargerId);

    if (!charger?.cardPassCode) {
      let cardPassCode = randomBytes(16).toString("hex");

      // Loop until a unique cardPassCode is generated
      while (await ChargerRepository.findOne({ where: { cardPassCode } })) {
        cardPassCode = randomBytes(16).toString("hex");
      }

      await ChargerRepository.update({ id: charger?.id }, { cardPassCode });

      return { cardPassCode };
    } else {
      return { cardPassCode: charger?.cardPassCode };
    }
  } catch (err) {
    console.warn("Error generateChargerAuthCodes:", err?.message);
  }

  return false;
};

const translateAmount = (amount, lang, currencySymbol = null) => {
  const amt = new Intl.NumberFormat(lang, {
    // style: "currency",
    currency: lang === "fr" || lang === "es" ? "EUR" : "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (!currencySymbol) {
    return amt;
  }

  if (lang === "fr") {
    return `${amt} ${currencySymbol}`;
  } else {
    return `${currencySymbol} ${amt}`;
  }
};

const generateOtp = (params = {}) => {
  const { length = 6, timezone = "UTC", minutes = 5 } = params;

  return {
    otp: generateRandomOtp(length).toString(),
    expiry: DateTime.utc().plus({ minutes }).toJSDate(),
  };
};

const convertObjectValuesToString = (obj) => {
  try {
    if (obj === null || typeof obj !== "object") {
      return String(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(convertObjectValuesToString);
    }

    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        convertObjectValuesToString(value),
      ]),
    );
  } catch (error) {
    return obj;
  }
};

const getRawCardUid = (cardUid) => {
  let returnData = cardUid;

  try {
    returnData = returnData.replace(/:/g, "");
  } catch (error) {}

  try {
    returnData = returnData.replace(/ /g, "");
  } catch (error) {}

  try {
    returnData = returnData.toLowerCase();
  } catch (error) {}

  return returnData;
};

const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

let countryListGlobal = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 250,
  list: [],
};

const getCountries = async (countryFilter = null) => {
  try {
    if (!countryListGlobal?.list?.length) {
      const countries = await CountryModel.find({}).lean();

      countryListGlobal = {
        currentPage: 1,
        totalPages: 1,
        totalCount: countries?.length || 0,
        list: countries || [],
      };
    }

    if (countryFilter) {
      const country = countryListGlobal.list.find(
        (item) => item.isoCode === countryFilter,
      );

      return {
        currentPage: 1,
        totalPages: 1,
        totalCount: country ? 1 : 0,
        list: country ? [country] : [],
      };
    }

    return countryListGlobal;
  } catch (error) {
    console.error("Error in getCountries:", error);
    throw error;
  }
};

const getTrendsData = (params) => {
  let returnData = {
    value: 0,
    comparison: "No Change",
    comparisonValue: 0,
    isNeutral: true,
    isPositive: true,
    isDangerous: false,
  };
  try {
    let {
      currency = null,
      isMoney = false,
      isPercentage = false,
      value,
      valueTrends,
      valueDifference,
      prefix = null,
      suffix = null,
    } = params;

    value = Number(value ?? 0);
    valueTrends = Number(valueTrends ?? 0);
    let isDirectValue = valueDifference;
    valueDifference = Number(valueDifference ?? 0);

    prefix = prefix ? `${prefix} ` : null;
    suffix = suffix ? ` ${suffix}` : null;

    // value = valueDifference ? valueDifference : value;
    valueDifference = valueDifference ? valueDifference : value - valueTrends;
    if (isMoney) {
      valueDifference = parseFloat(valueDifference).toFixed(2);
    }

    let valueDifferenceText = valueDifference == 0 ? `No Change` : null;
    valueDifferenceText =
      valueDifference == value ? `No Change` : valueDifferenceText;
    if (isDirectValue && valueDifference == 100) {
      valueDifferenceText = `No Change`;
    }

    if (!valueDifferenceText) {
      if (isMoney) {
        valueDifferenceText = `${parseFloat(Math.abs(valueDifference)).toFixed(
          2,
        )}`;
      } else {
        valueDifferenceText = `${Math.abs(valueDifference)}`;
      }

      if (currency) {
        valueDifferenceText = `${currency}${valueDifferenceText}`;
      }
      if (isPercentage) {
        valueDifferenceText = `${valueDifferenceText}%`;
      }

      valueDifferenceText = `${prefix ? prefix : ""}${valueDifferenceText}${
        suffix ? suffix : ""
      } this month`;

      valueDifferenceText =
        valueDifference > 0
          ? `+${valueDifferenceText}`
          : `-${valueDifferenceText}`;
    }

    if (isDirectValue) {
      value = parseFloat(valueDifference).toFixed(2);
    }

    if (isMoney) {
      valueDifference = parseFloat(valueDifference).toFixed(2);
      value = parseFloat(value).toFixed(2);
    }

    returnData["value"] = value;
    returnData["comparison"] = valueDifferenceText;
    returnData["comparisonValue"] = valueDifference;
    returnData["isPositive"] = valueDifference >= 0;
    returnData["isNeutral"] = valueDifferenceText == "No Change";
    returnData["isDangerous"] = valueDifference < 0;
  } catch (error) {
    console.error("Error in getCountries:", error);
  }

  return returnData;
};

const growthPercentage = (previous, current) => {
  if (previous === 0) {
    if (current === 0) return 0; // no change
    return 100; // treat as 100% growth when previous = 0 & current > 0
  }

  return parseFloat(((current - previous) / previous) * 100).toFixed(2);
};

const getEmspRatesByCountry = async (country) => {
  const emspUser = await EMspUserRepository.findOne({
    where: {
      isDeleted: false,
      isEmsp: true,
      apexEmailVerified: true,
      country,
    },
  });

  if (emspUser?.emspId) {
    const paymentConfig = await EMspPaymentConfigRepository.findOne({
      where: { emspId: emspUser?.emspId },
    });
    const taxConfig = await EMspBusinessTaxDetailsRepository.findOne({
      where: { emspId: emspUser?.emspId },
    });
    const emspData = await EMspRepository.findOne({
      where: { id: emspUser?.emspId },
    });

    let returnData = {};
    if (taxConfig) {
      returnData = {
        taxRate: taxConfig?.federalTax,
      };
    }
    if (paymentConfig) {
      returnData = {
        ...returnData,
        baseRate: paymentConfig?.baseRate,
        electricityGridRate: paymentConfig?.electricityGridRate,
        preAuthAmount: paymentConfig?.preAuthAmount,
      };
    }
    if (emspData?.currency) {
      let currency = emspData?.currency;
      let currencyName = null;
      let currencySymbol = null;
      if (currency) {
        const currencyDetails = CurrencyData[currency] ?? null;
        if (currencyDetails) {
          currencyName = currencyDetails.name;
          currencySymbol = currencyDetails.symbol;
        }
      }

      returnData = {
        ...returnData,
        currency,
        currencyName,
        currencySymbol,
      };
    }
    if (taxConfig || paymentConfig || emspData) {
      return returnData;
    }
  }

  return false;
};

const validateChangeConfig = (key, value) => {
  const maxKeyLength = 50;
  const maxValueLength = 500;

  if (typeof key !== "string") {
    return { valid: false, error: "Key must be a string." };
  }

  if (typeof value !== "string") {
    return { valid: false, error: "Value must be a string." };
  }

  if (key.length > maxKeyLength) {
    return {
      valid: false,
      error: `Key exceeds maxLength (${maxKeyLength}). Received length: ${key.length}`,
    };
  }

  if (value.length > maxValueLength) {
    return {
      valid: false,
      error: `Value exceeds maxLength (${maxValueLength}). Received length: ${value.length}`,
    };
  }

  return { valid: true };
};

const validateGetConfigurationKeys = (keys) => {
  if (!keys) {
    return { valid: true };
  }

  if (!Array.isArray(keys)) {
    return { valid: false, error: "Key must be an array of strings." };
  }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (typeof key !== "string") {
      return { valid: false, error: `Key at index ${i} must be a string.` };
    }

    if (key.length > 50) {
      return {
        valid: false,
        error: `Key at index ${i} exceeds maxLength 50 (length: ${key.length}).`,
      };
    }
  }

  return { valid: true };
};

const isSupportedConfigurationKey = (key) => {
  return supportedChargerConfigurationKeys.includes(key);
};

const getIsoCode3 = (isoCode) => {
  return i18nIsoCountries.alpha2ToAlpha3(isoCode);
};

const sendOcppEvent = async (
  identity,
  eventName,
  ocppSchema,
  logError = false,
) => {
  let charger = null;
  try {
    if (eventName == OcppEvents.ChangeAvailability) {
      charger = await getChargerByIdentity(identity);

      if (
        [
          ChargingStatuses.CHARGING,
          ChargingStatuses.PREPARING,
          ChargingStatuses.FINISHING,
        ].includes(charger?.chargingStatus)
      ) {
        return {
          code: 400,
          message: { message: `Charger is ${charger?.chargingStatus}.` },
        };
      }
    }
  } catch (error) {}

  try {
    const data = await axios.post(
      `${process.env.OCPP_BASEURL}/api/ocpp/trigger-remote-event`,
      { identity, eventName, ocppSchema, logError },
    );

    try {
      if (
        eventName == OcppEvents.ChangeAvailability &&
        charger &&
        data?.status == 200 &&
        data?.data?.status == "Accepted"
      ) {
        if (ocppSchema?.type === "Inoperative") {
          await ChargerRepository.update(charger.id, {
            status: ChargerStatuses.INOPERATIVE,
          });
        } else if (ocppSchema?.type === "Operative") {
          await ChargerRepository.update(charger.id, {
            status: ChargerStatuses.AVAILABLE,
          });
        }
      }
    } catch (error) {}

    return {
      code: data?.status ?? 400,
      message: data?.data ?? { message: `Client is not connected.` },
    };
  } catch (error) {
    console.log("sendOcppEvent Failed: ", eventName, identity, ocppSchema);
  }

  return {
    code: 400,
    message: { message: `Client is not connected.` },
  };
};

const encodeBase64 = (obj) => {
  const json = JSON.stringify(obj);

  return Buffer.from(json)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const decodeBase64 = (base64Str) => {
  let base64 = base64Str.replace(/-/g, "+").replace(/_/g, "/");

  // Restore padding
  while (base64.length % 4) {
    base64 += "=";
  }

  const json = Buffer.from(base64, "base64").toString("utf-8");
  return JSON.parse(json);
};

module.exports = {
  encodeBase64,
  decodeBase64,
  getIsoCode3,
  pick,
  getEmspRatesByCountry,
  getTrendsData,
  getUtcIsoStr,
  getOcppTransaction,
  getPaymentTransaction,
  validateEmail,
  generateRandomOtp,
  generateRandomCode,
  getSettlementCode,
  getEvseStationCode,
  generateRandomCodeForContract,
  replaceStringWithVariables,
  deepClone,
  isValidUrl,
  generateChargeBoxId,
  generateChargeBoxIdV2,
  formatDateString,
  generateChargeSerialNumber,
  calculateChargingTime,
  compressImage,
  arrayChunk,
  arrayObjStr,
  arrayObjArr,
  toSnakeCase,
  generateInvoiceNumber,
  getIpData,
  getIpTimezone,
  getServerDate,
  formatSerialNumber,
  getTimezoneByCountry,
  getChargerByIdentity,
  getBaseRateAndLocationByCharger,
  formatDuration,
  getConfigConstants,
  checkUserEmail,
  checkUserPhone,
  getSubscriptionUsage,
  convertDateTimezone,
  removeEmpty,
  getOcppTransactionCalculation,
  getLocationByLatLng,
  updateChargerCountryByLatLng,
  getChargingCalculation,
  getChargerDetailsData,
  ObjectDAO,
  getChargingLookup,
  calculatePeakAndOffPeakTime,
  getChargerCountForDashboard,
  getChargerDataForLocationsMap,
  formatRawMeterValues,
  modifyChargerOnChargingStatusUpdate,
  parseTLV,
  generateChargerSerialNumber,
  getChargerPaymentConfig,
  hexToAscii,
  getOrderId,
  getTransResponse,
  getTranslation,
  saveTransactionErrorLogs,
  updateCalculationByCaptureAmount,
  getOcppIdTag,
  getRemoteStartIdTag,
  roundToNextFigure,
  updateChargerLatLngByEvseStationId,
  addMeasurandValues,
  sendChargerUpdatedPusherEvent,
  toRoundedFloat,
  getChargerLanguageByConnectorId,
  cleanMessage,
  getChargerConstants,
  translateAmount,
  formatChargingDuration,
  generateOtp,
  generateChargerAuthCodes,
  convertObjectValuesToString,
  generateChargerCardPassCode,
  getLocationInfo,
  getNearByEvseStation,
  getNearByEvseStationWithoutPartner,
  getChargerContract,
  getChargerCards,
  calculatePreauthAmount,
  getCountries,
  getChargersOverview,
  getAnalyticDataForDashboard,
  getGrossRevenueSplit,
  logJson,
  getRawCardUid,
  growthPercentage,
  validateChangeConfig,
  isSupportedConfigurationKey,
  validateGetConfigurationKeys,
  getDefaultOcppResponse,
  sendOcppEvent,
  ...require("./charger-config.helper"),
  ...require("./charger-auth-list.helper"),
};
