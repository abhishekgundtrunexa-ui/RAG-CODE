const { Between, MoreThanOrEqual, In } = require("typeorm");
const {
  OcppTransactionsRepository,
  ChargerRepository,
  EvseStationRepository,
} = require("@shared-libs/db/mysql");
const { DateTime } = require("luxon");
const { customErrorMsg } = require("@shared-libs/constants");
const {
  DiscoverChargerLogModel,
  UtilizationRateModel,
} = require("@shared-libs/db/mongo-db");
const { getConfigConstants } = require("@shared-libs/helpers");

const convertToISOFormat = (dateString) => {
  const parts = dateString.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString;
};

const getEnergyConsumed = async (req, res) => {
  const loggedInUserData = req.loggedInUserData;

  try {
    const {
      startDate,
      endDate,
      duration,
      evseStationId,
      chargerId,
      cpoId,
      location,
    } = req.query;

    let whereCondition = { isDeleted: false };

    const { isPartner, isPartnerTeam } = loggedInUserData;

    if (isPartner || isPartnerTeam) {
      const {
        evseStationIds = [],
        chargerIds = [],
        chargeBoxIds = [],
      } = req?.allowedIds;
      if (evseStationId) {
        if (!evseStationIds.includes(evseStationId)) {
          return res
            .status(400)
            .json({ message: customErrorMsg.station.EVSE_STATION_NOT_FOUND });
        }
        whereCondition.evseStationId = evseStationId;
      }

      if (chargerId) {
        if (!chargerIds.includes(chargerId)) {
          return res
            .status(400)
            .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
        }

        const charger = await ChargerRepository.findOne({
          where: { id: chargerId },
        });
        whereCondition.chargeBoxId = charger?.chargeBoxId;
      }

      if (!evseStationId && !chargerId) {
        if (chargeBoxIds.length == 0) {
          return res.status(200).json([]);
        }
        whereCondition.chargeBoxId = In(chargeBoxIds);
      }
    } else {
      if (loggedInUserData.isCpo) {
        if (evseStationId) {
          const evseStation = await EvseStationRepository.findOne({
            where: { id: evseStationId, cpoId: loggedInUserData.user.cpoId },
          });
          if (!evseStation) {
            return res
              .status(400)
              .json({ message: customErrorMsg.station.EVSE_STATION_NOT_FOUND });
          }
        }
        if (chargerId) {
          const charger = await ChargerRepository.findOne({
            where: { id: chargerId, cpoId: loggedInUserData.user.cpoId },
          });
          if (!charger) {
            return res
              .status(400)
              .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
          }
        }
        if (cpoId) {
          if (cpoId !== loggedInUserData.user.cpoId) {
            return res
              .status(400)
              .json({ message: customErrorMsg.cpo.CPO_ID_NOT_FOUND });
          }
        }
      }

      if (cpoId) whereCondition.cpoId = cpoId;
      if (evseStationId) whereCondition.evseStationId = evseStationId;
      if (chargerId) {
        const charger = await ChargerRepository.findOne({
          where: { id: chargerId, cpoId },
        });
        whereCondition.chargeBoxId = charger?.chargeBoxId;
      }
      if (loggedInUserData.isCpo)
        whereCondition.cpoId = loggedInUserData.user.cpoId;
    }

    if (location) whereCondition.country = location;

    let start, end;

    if (startDate && endDate) {
      start = DateTime.fromISO(convertToISOFormat(startDate)).startOf("month");
      end = DateTime.fromISO(convertToISOFormat(endDate)).endOf("month");
    } else if (duration) {
      start = DateTime.now()
        .minus({ months: duration - 1 })
        .startOf("month");
      end = DateTime.now().endOf("month");
    } else {
      const minMaxDates = await OcppTransactionsRepository.createQueryBuilder(
        "transaction"
      )
        .select([
          "MIN(transaction.createdAt) AS minDate",
          "MAX(transaction.createdAt) AS maxDate",
        ])
        .getRawOne();

      if (!minMaxDates.minDate || !minMaxDates.maxDate) {
        return res
          .status(404)
          .json({ message: "No energy consumption data available." });
      }

      start = DateTime.fromJSDate(new Date(minMaxDates.minDate)).startOf(
        "month"
      );
      end = DateTime.fromJSDate(new Date(minMaxDates.maxDate)).endOf("month");
    }

    whereCondition.createdAt = Between(start.toJSDate(), end.toJSDate());

    const energyConsumedData = await OcppTransactionsRepository.find({
      where: whereCondition,
      select: [
        "effectiveEnergyConsumed",
        "createdAt",
        "cpoId",
        "currency",
        "currencyName",
        "currencySymbol",
      ],
    });

    const returnData = {};
    let currentMonth = start;

    while (currentMonth <= end) {
      const formattedMonth = currentMonth.toFormat("MMMM-yyyy");
      returnData[formattedMonth] = {
        month: currentMonth.toFormat("MMMM"),
        year: currentMonth.year,
        energyConsumed: 0,
        currency: null,
        currencyName: null,
        currencySymbol: null,
      };
      currentMonth = currentMonth.plus({ months: 1 });
    }

    energyConsumedData.forEach((data) => {
      const createdAt = DateTime.fromJSDate(data.createdAt);
      const formattedMonth = createdAt.toFormat("MMMM-yyyy");

      if (returnData[formattedMonth]) {
        returnData[formattedMonth].energyConsumed +=
          parseFloat(data.effectiveEnergyConsumed) || 0;
        returnData[formattedMonth].currency = data.currency;
        returnData[formattedMonth].currencyName = data.currencyName;
        returnData[formattedMonth].currencySymbol = data.currencySymbol;
      }
    });

    const resultArray = Object.values(returnData).map((data) => ({
      ...data,
      energyConsumed: data.energyConsumed.toFixed(2),
    }));

    return res.status(200).json(resultArray);
  } catch (error) {
    console.error("Error fetching energy consumed:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getRevenueGenerated = async (req, res) => {
  const loggedInUserData = req.loggedInUserData;

  try {
    const {
      startDate,
      endDate,
      duration,
      evseStationId,
      chargerId,
      cpoId,
      location,
    } = req.query;

    let whereCondition = { isDeleted: false };

    const { isPartner, isPartnerTeam } = req?.loggedInUserData;

    if (isPartner || isPartnerTeam) {
      const {
        evseStationIds = [],
        chargerIds = [],
        chargeBoxIds = [],
      } = req?.allowedIds;

      if (evseStationId) {
        if (!evseStationIds.includes(evseStationId)) {
          return res
            .status(400)
            .json({ message: customErrorMsg.station.EVSE_STATION_NOT_FOUND });
        }
        whereCondition.evseStationId = evseStationId;
      }

      if (chargerId) {
        if (!chargerIds.includes(chargerId)) {
          return res
            .status(400)
            .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
        }

        const charger = await ChargerRepository.findOne({
          where: { id: chargerId },
        });
        whereCondition.chargeBoxId = charger?.chargeBoxId;
      }

      if (!evseStationId && !chargerId) {
        if (chargeBoxIds.length == 0) {
          return res.status(200).json([]);
        }
        whereCondition.chargeBoxId = In(chargeBoxIds);
      }
    } else {
      if (loggedInUserData.isCpo) {
        if (evseStationId) {
          const evseStation = await EvseStationRepository.findOne({
            where: { id: evseStationId, cpoId: loggedInUserData.user.cpoId },
          });
          if (!evseStation) {
            return res
              .status(400)
              .json({ message: customErrorMsg.station.EVSE_STATION_NOT_FOUND });
          }
        }
        if (chargerId) {
          const charger = await ChargerRepository.findOne({
            where: { id: chargerId, cpoId: loggedInUserData.user.cpoId },
          });
          if (!charger) {
            return res
              .status(400)
              .json({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
          }
        }
        if (cpoId) {
          if (cpoId !== loggedInUserData.user.cpoId) {
            return res
              .status(400)
              .json({ message: customErrorMsg.cpo.CPO_ID_NOT_FOUND });
          }
        }
      }

      let evseStation, charger;

      if (evseStationId) {
        evseStation = await EvseStationRepository.findOne({
          where: {
            id: evseStationId,
            ...(cpoId ? { cpoId } : {}),
          },
        });

        if (!evseStation) {
          return res.status(400).json({
            message: cpoId
              ? "EVSE Station Does Not Belong To The Specified CPO."
              : "EVSE Station Not Found.",
          });
        }
      }

      if (chargerId) {
        charger = await ChargerRepository.findOne({
          where: {
            id: chargerId,
            ...(cpoId ? { cpoId } : {}),
            ...(evseStationId ? { evseStationId } : {}),
          },
        });

        if (!charger) {
          return res.status(403).json({
            message: cpoId
              ? "Charger Does Not Belong To The Specified CPO."
              : "Charger Does Not Belong To The Specified EVSE Station.",
          });
        }
      }

      if (cpoId) {
        whereCondition.cpoId = cpoId;
      }
      if (evseStationId) {
        whereCondition.evseStationId = evseStationId;
      }
      if (chargerId) {
        const charger = await ChargerRepository.findOne({
          where: { id: chargerId, cpoId },
        });
        whereCondition.chargeBoxId = charger.chargeBoxId;
      }

      if (loggedInUserData.isCpo) {
        whereCondition.cpoId = loggedInUserData.user.cpoId;
      }
    }

    if (location) {
      whereCondition.country = location;
    }

    let start = DateTime.now().startOf("month");
    let end = DateTime.now().endOf("month");

    if (duration) {
      start = DateTime.now()
        .minus({ months: duration - 1 })
        .startOf("month");
      end = DateTime.now().endOf("month");
    }

    if (startDate && endDate) {
      const startDateISO = convertToISOFormat(startDate);
      const endDateISO = convertToISOFormat(endDate);

      start = DateTime.fromISO(startDateISO);
      end = DateTime.fromISO(endDateISO);
    }

    const startDateObj = start.isValid ? start.toJSDate() : null;
    const endDateObj = end.isValid ? end.toJSDate() : null;

    if (startDateObj && endDateObj) {
      whereCondition.createdAt = Between(startDateObj, endDateObj);

      const revenueData = await OcppTransactionsRepository.find({
        where: whereCondition,
        select: [
          "netAmount",
          "tax",
          "discountedAmount",
          "parkingFee",
          "baseFare",
          "cpoId",
          "createdAt",
          "currency",
          "currencyName",
          "currencySymbol",
        ],
      });

      const returnData = {};

      let currentMonth = start;
      while (currentMonth <= end) {
        const formattedMonth = currentMonth.toFormat("MMMM-yyyy");

        returnData[formattedMonth] = {
          month: currentMonth.toFormat("MMMM"),
          year: currentMonth.year,
          totalNetAmount: 0,
          totalTax: 0,
          totalDiscountedAmount: 0,
          totalParkingFee: 0,
          totalBaseFare: 0,
          currency: null,
          currencyName: null,
          currencySymbol: null,
        };

        currentMonth = currentMonth.plus({ months: 1 });
      }

      revenueData.forEach((data) => {
        const createdAt = DateTime.fromJSDate(data.createdAt);
        const formattedMonth = createdAt.toFormat("MMMM-yyyy");

        returnData[formattedMonth].totalNetAmount +=
          parseFloat(data.netAmount) || 0;
        returnData[formattedMonth].totalTax += parseFloat(data.tax) || 0;
        returnData[formattedMonth].totalDiscountedAmount +=
          parseFloat(data.discountedAmount) || 0;
        returnData[formattedMonth].totalParkingFee +=
          parseFloat(data.parkingFee) || 0;
        returnData[formattedMonth].totalBaseFare +=
          parseFloat(data.baseFare) || 0;
        returnData[formattedMonth].currency = data.currency;
        returnData[formattedMonth].currencyName = data.currencyName;
        returnData[formattedMonth].currencySymbol = data.currencySymbol;
      });

      const resultArray = Object.values(returnData).map((data) => ({
        ...data,
        totalNetAmount: data.totalNetAmount.toFixed(2),
        totalTax: data.totalTax.toFixed(2),
        totalDiscountedAmount: data.totalDiscountedAmount.toFixed(2),
        totalParkingFee: data.totalParkingFee.toFixed(2),
        totalBaseFare: data.totalBaseFare.toFixed(2),
      }));

      return res.status(200).json(resultArray);
    }

    return res.status(400).json({ message: "Invalid Date Range" });
  } catch (error) {
    console.error("Error fetching revenue generated:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const calculatePeakHours = async (req, res) => {
  try {
    const {
      standardThreshold,
      peakThreshold,
      offpeakThreshold,
      peakRateMultiplier,
      offPeakRateMultiplier,
    } = await getConfigConstants([
      "standardThreshold",
      "peakThreshold",
      "offpeakThreshold",
      "peakRateMultiplier",
      "offPeakRateMultiplier",
    ]);

    const [standardMin, standardMax] = standardThreshold.split("-").map(Number);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await DiscoverChargerLogModel.find({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const hourlyData = Array(24).fill(0);
    const transactionData = Array(24).fill(0);

    logs.forEach((log) => {
      const hour = new Date(log.createdAt).getUTCHours();
      hourlyData[hour] += 1;
    });

    const transactions = await OcppTransactionsRepository.find({
      where: {
        startTime: MoreThanOrEqual(thirtyDaysAgo),
        endTime: MoreThanOrEqual(thirtyDaysAgo),
      },
    });

    transactions.forEach((transaction) => {
      const startHour = new Date(transaction.startTime).getHours();
      const endHour = new Date(transaction.endTime).getHours();

      transactionData[startHour] += 1;
      transactionData[endHour] += 1;
    });

    // Calculate the results
    const results = hourlyData.map((count, hour) => {
      const totalCount = count + transactionData[hour];
      const averageCount = totalCount / 2;

      const percentage = (averageCount / peakThreshold) * 100;

      let peakStatus = "standard";
      let rate = 1;

      if (percentage > standardMax) {
        peakStatus = "peak";
        rate = peakRateMultiplier;
      } else if (percentage < standardMin) {
        peakStatus = "offpeak";
        rate = offPeakRateMultiplier;
      }

      return {
        startHour: hour,
        endHour: (hour + 1) % 24,
        discoverCount: count,
        transactionCount: transactionData[hour],
        peakStatus,
        rate,
      };
    });

    res.status(200).json(results);
  } catch (error) {
    console.error("Error calculating peak hours:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getPreviousDayRange = () => {
  const start = DateTime.utc().minus({ days: 1 }).startOf("day");
  const end = DateTime.utc().minus({ days: 1 }).endOf("day");
  return { start: start.toJSDate(), end: end.toJSDate() };
};

const utilisationRateCalculation = async (req, res) => {
  try {
    const { clientId, pastDays, from, to } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: "Invalid clientId provided." });
    }

    if (pastDays) {
      const previousDayRange = getPreviousDayRange();
      startDate = previousDayRange.start;
      endDate = previousDayRange.end;
    } else if (from && to) {
      startDate = DateTime.fromISO(from).toJSDate();
      endDate = DateTime.fromISO(to).toJSDate();
    } else {
      startDate = DateTime.now().startOf("day").toJSDate();
      endDate = new Date();
    }

    const result = await UtilizationRateModel.aggregate([
      { $match: { clientId } },
      {
        $group: {
          _id: null,
          avgAvailableRate: { $avg: "$utilizationRates.Available" },
          avgIdleRate: { $avg: "$utilizationRates.Idle" },
          avgOfflineRate: { $avg: "$utilizationRates.Offline" },
          avgInUseRate: { $avg: "$utilizationRates.In-Use" },
          avgErrorRate: { $avg: "$utilizationRates.Error" },
          avgMaintainanceRate: { $avg: "$utilizationRates.Maintainance" },
          avgAvailableDuration: { $avg: "$statusDurations.Available" },
          avgIdleDuration: { $avg: "$statusDurations.Idle" },
          avgOfflineDuration: { $avg: "$statusDurations.Offline" },
          avgInUseDuration: { $avg: "$statusDurations.In-Use" },
          avgErrorDuration: { $avg: "$statusDurations.Error" },
          avgMaintainanceDuration: { $avg: "$statusDurations.Maintainance" },
        },
      },
    ]);

    if (result.length === 0) {
      return res.status(200).json({
        success: true,
        utilizationRates: {
          Available: 0,
          Idle: 0,
          Offline: 0,
          "In-Use": 0,
          Error: 0,
          Maintainance: 0,
        },
        statusDurations: {
          Available: 0,
          Idle: 0,
          Offline: 0,
          "In-Use": 0,
          Error: 0,
          Maintainance: 0,
          time_unit: "Minute",
        },
        totalDurationInMinutes: 0,
      });
    }

    // The result will be an array with the average values
    const averages = result[0];
    const totalHours =
      averages.avgAvailableDuration +
      averages.avgIdleDuration +
      averages.avgOfflineDuration +
      averages.avgInUseDuration +
      averages.avgErrorDuration +
      averages.avgMaintainanceDuration;

    return res.status(200).json({
      utilizationRates: {
        Available: averages?.avgAvailableRate.toFixed(2),
        Idle: averages?.avgIdleRate.toFixed(2),
        Offline: averages?.avgOfflineRate.toFixed(2),
        "In-Use": averages?.avgInUseRate.toFixed(2),
        Error: averages?.avgErrorRate.toFixed(2),
        Maintainance: averages?.avgMaintainanceRate.toFixed(2),
      },
      statusDurations: {
        Available: averages?.avgAvailableDuration.toFixed(2),
        Idle: averages?.avgIdleDuration.toFixed(2),
        Offline: averages?.avgOfflineDuration.toFixed(2),
        "In-Use": averages?.avgInUseDuration.toFixed(2),
        Error: averages?.avgErrorDuration.toFixed(2),
        Maintainance: averages?.avgMaintainanceDuration.toFixed(2),
        time_unit: "Minute",
      },
      totalDurationInMinutes: totalHours.toFixed(2),
    });
  } catch (error) {
    console.error(
      "Error in utilisationRateCalculation:",
      error.message || error
    );
    return res.status(500).json({
      success: false,
      error:
        "An error occurred while calculating utilization rates. Please try again later.",
    });
  }
};

const getUtilizationRates = async (req, res) => {
  try {
    const { startDate, endDate, location, evseStationId } = req.query;
    const loggedInUserData = req.loggedInUserData;
    let defaultRange = await getConfigConstants(["defaultAnalyticsDuration"]);
    defaultRange = defaultRange["defaultAnalyticsDuration"] ?? 6;

    const whereCondition = {};

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
        success: true,
        globalRate: { rate: 0, status: "neutral" },
        stationData: {
          stationName: "",
          stationUtilization: { rate: 0, status: "neutral" },
          chargers: [],
        },
      });
    }

    const stationIds = allowedEvseStations.map((station) => station.id);

    const range = getDateRange(startDate, endDate, defaultRange);

    const [globalRate, stationRate, chargersRate] = await Promise.all([
      UtilizationRateModel.aggregate([
        {
          $match: { ...range, evseStationId: { $in: stationIds } },
        },
        {
          $group: {
            _id: "$evseStationId",
            avgUtilizationRate: {
              $avg: {
                $toDouble: { $ifNull: ["$utilizationRates.In-Use", "0"] },
              },
            },
          },
        },
      ]),
      UtilizationRateModel.aggregate([
        {
          $match: {
            evseStationId,
            ...range,
          },
        },
        {
          $group: {
            _id: "$evseStationId",
            avgUtilizationRate: {
              $avg: {
                $toDouble: { $ifNull: ["$utilizationRates.In-Use", "0"] },
              },
            },
          },
        },
      ]),
      UtilizationRateModel.aggregate([
        {
          $match: {
            ...range,
            evseStationId,
          },
        },
        {
          $group: {
            _id: "$clientId",
            avgUtilizationRate: {
              $avg: {
                $toDouble: { $ifNull: ["$utilizationRates.In-Use", "0"] },
              },
            },
          },
        },
      ]),
    ]);

    let globalUtilization = 0;

    globalRate.forEach((gb) => {
      globalUtilization += Number(gb["avgUtilizationRate"]);
    });

    const globalUtilizationRate =
      globalRate.length > 0 ? globalUtilization / globalRate.length : 0;
    const stationUtilization = stationRate[0]?.avgUtilizationRate || 0;
    const chargersUtilization = chargersRate.map((chg) => {
      return {
        chargeBoxId: chg._id,
        chargerUtilization: {
          rate: parseFloat((chg["avgUtilizationRate"] || 0).toFixed(2)),
          status: getUtilizationStatus(
            parseFloat((chg["avgUtilizationRate"] || 0).toFixed(2))
          ),
        },
      };
    });
    const stationInfo = await EvseStationRepository.findOne({
      where: { id: evseStationId },
      select: ["name"],
    });
    const finalResponse = {
      globalRate: {
        rate: parseFloat((globalUtilizationRate || 0).toFixed(2)),
        status: getUtilizationStatus(
          parseFloat((globalUtilizationRate || 0).toFixed(2))
        ),
      },
      stationData: {
        stationName: stationInfo["name"],
        stationUtilization: {
          rate: parseFloat((stationUtilization || 0).toFixed(2)),
          status: getUtilizationStatus(
            parseFloat((stationUtilization || 0).toFixed(2))
          ),
        },
        chargers: chargersUtilization,
      },
    };
    return res.status(200).json(finalResponse);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getUtilizationStatus = (rate) => {
  if (rate >= 10) {
    return "Healthy";
  } else {
    return "Poor";
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

module.exports = {
  getEnergyConsumed,
  getRevenueGenerated,
  calculatePeakHours,
  utilisationRateCalculation,
  getUtilizationRates,
};
