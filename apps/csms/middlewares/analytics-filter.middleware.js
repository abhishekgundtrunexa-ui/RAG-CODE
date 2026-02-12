const { customErrorMsg } = require("@shared-libs/constants");
const {
  ChargerRepository,
  EvseStationRepository,
} = require("@shared-libs/db/mysql");
const {
  getConfigConstants,
  getTimezoneByCountry,
  convertDateTimezone,
} = require("@shared-libs/helpers");
const { In, Between } = require("typeorm");
const { DateTime } = require("luxon");

const convertToISOFormat = (dateString) => {
  const parts = dateString.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString;
};

const getCurrentMonthAndWeekDateRanges = () => {
  const now = DateTime.utc(); // always in UTC

  // --- MONTH ---
  const currentMonthStart = now
    .startOf("month")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  const currentMonthEnd = now
    .endOf("month")
    .set({ hour: 23, minute: 59, second: 59, millisecond: 999 });

  const previousMonth = now.minus({ months: 1 });
  const previousMonthStart = previousMonth
    .startOf("month")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  const previousMonthEnd = previousMonth
    .endOf("month")
    .set({ hour: 23, minute: 59, second: 59, millisecond: 999 });

  // --- WEEK (Monday–Sunday) ---
  const currentWeekStart = now
    .startOf("week")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  const currentWeekEnd = now
    .endOf("week")
    .set({ hour: 23, minute: 59, second: 59, millisecond: 999 });

  const previousWeekStart = currentWeekStart
    .minus({ weeks: 1 })
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  const previousWeekEnd = currentWeekEnd
    .minus({ weeks: 1 })
    .set({ hour: 23, minute: 59, second: 59, millisecond: 999 });

  return {
    month: {
      current: {
        start: currentMonthStart.toJSDate({ zone: "UTC" }),
        end: currentMonthEnd.toJSDate({ zone: "UTC" }),
      },
      previous: {
        start: previousMonthStart.toJSDate({ zone: "UTC" }),
        end: previousMonthEnd.toJSDate({ zone: "UTC" }),
      },
    },
    week: {
      current: {
        start: currentWeekStart.toJSDate({ zone: "UTC" }),
        end: currentWeekEnd.toJSDate({ zone: "UTC" }),
      },
      previous: {
        start: previousWeekStart.toJSDate({ zone: "UTC" }),
        end: previousWeekEnd.toJSDate({ zone: "UTC" }),
      },
    },
  };
};

const getDates = (dateParams, defaultRange) => {
  let {
    startDate = null,
    endDate = null,
    previousStartDate = null,
    previousEndDate = null,
  } = dateParams;

  const returnData = {
    start: null,
    end: null,
    range: null,
    startTrend: null,
    endTrend: null,
    rangeTrend: null,
    diff: null,
  };

  if (startDate && endDate) {
    returnData["start"] = DateTime.fromISO(
      `${convertToISOFormat(startDate)}T00:00:00.000Z`
    ).toJSDate({ zone: "UTC" });
    returnData["end"] = DateTime.fromISO(
      `${convertToISOFormat(endDate)}T23:59:59.999Z`
    ).toJSDate({ zone: "UTC" });
  } else {
    returnData["start"] = DateTime.now()
      .minus({ months: defaultRange })
      .startOf("day")
      .toJSDate();
    returnData["end"] = DateTime.now().endOf("day").toJSDate();
  }

  if (previousStartDate && previousEndDate) {
    returnData["startTrend"] = DateTime.fromISO(
      `${convertToISOFormat(previousStartDate)}T00:00:00.000Z`
    ).toJSDate({ zone: "UTC" });
    returnData["endTrend"] = DateTime.fromISO(
      `${convertToISOFormat(previousEndDate)}T23:59:59.999Z`
    ).toJSDate({ zone: "UTC" });
  } else {
    const start = DateTime.fromJSDate(returnData["start"]);
    const end = DateTime.fromJSDate(returnData["end"]);
    returnData["diff"] = Math.abs(end.diff(start, "seconds").seconds);

    returnData["startTrend"] = DateTime.fromJSDate(returnData["start"])
      .minus({ seconds: returnData["diff"] })
      .toJSDate();
    returnData["endTrend"] = DateTime.fromJSDate(returnData["end"])
      .minus({ seconds: returnData["diff"] + 1 })
      .toJSDate();
  }

  returnData["range"] = {
    createdAt: {
      $gte: DateTime.fromJSDate(returnData["start"]).toJSDate({ zone: "UTC" }),
      $lte: DateTime.fromJSDate(returnData["end"]).toJSDate({ zone: "UTC" }),
    },
  };
  returnData["rangeSql"] = {
    dateTime: Between(
      DateTime.fromJSDate(returnData["start"]).toJSDate({ zone: "UTC" }),
      DateTime.fromJSDate(returnData["end"]).toJSDate({ zone: "UTC" })
    ),
  };
  returnData["rangeRaw"] = {
    start: DateTime.fromJSDate(returnData["start"]).toJSDate({ zone: "UTC" }),
    end: DateTime.fromJSDate(returnData["end"]).toJSDate({ zone: "UTC" }),
  };

  const trSt = DateTime.fromJSDate(returnData["startTrend"], {
    zone: "UTC",
  }).toFormat("yyyy-MM-dd");
  const trEn = DateTime.fromJSDate(returnData["endTrend"], {
    zone: "UTC",
  }).toFormat("yyyy-MM-dd");

  returnData["rangeTrend"] = {
    createdAt: {
      $gte: DateTime.fromISO(`${trSt}T00:00:00.000Z`).toJSDate({ zone: "UTC" }),
      $lte: DateTime.fromISO(`${trEn}T23:59:59.999Z`).toJSDate({ zone: "UTC" }),
    },
  };
  returnData["rangeRawTrend"] = {
    start: DateTime.fromISO(`${trSt}T00:00:00.000Z`).toJSDate({ zone: "UTC" }),
    end: DateTime.fromISO(`${trEn}T23:59:59.999Z`).toJSDate({ zone: "UTC" }),
  };

  return returnData;
};

const AnalyticsFilterMiddleware =
  (params = {}) =>
  async (req, res, next) => {
    const { dateOnly = false, forHub = false, todayRange = false } = params;
    const loggedInUserData = req?.loggedInUserData;

    let isPartner = false;
    if (!forHub) {
      isPartner = loggedInUserData?.isPartner;
    }
    if (!isPartner) {
      isPartner = loggedInUserData?.isPartnerTeam;
    }

    let configConstants = await getConfigConstants([
      "defaultAnalyticsDuration",
      "mockDataStatus",
    ]);

    let defaultRange = configConstants["defaultAnalyticsDuration"] ?? 6;
    let mockDataStatus = configConstants["mockDataStatus"] ?? "1";
    let showMockData = mockDataStatus == "1";

    let {
      startDate,
      endDate,

      previousStartDate,
      previousEndDate,

      evseStationId,
      location,
      chargeBoxId,
      status,
      partnerType,
      emspSettingId,
    } = req.query;

    if (!evseStationId && req?.query?.stationId) {
      evseStationId = req?.query?.stationId;
    }

    if (req?.query?.filter) {
      try {
        const filter = JSON.parse(req?.query?.filter);

        if (!startDate && filter?.startDate) {
          startDate = filter?.startDate;
        }
        if (!previousStartDate && filter?.previousStartDate) {
          previousStartDate = filter?.previousStartDate;
        }
        if (!endDate && filter?.endDate) {
          endDate = filter?.endDate;
        }
        if (!previousEndDate && filter?.previousEndDate) {
          previousEndDate = filter?.previousEndDate;
        }
        if (!location && filter?.location) {
          location = filter?.location;
        }
        if (!location && filter?.country) {
          location = filter?.country;
        }
        if (!partnerType && filter?.partnerType) {
          partnerType = filter?.partnerType;
        }
        if (!emspSettingId && filter?.emspSettingId) {
          emspSettingId = filter?.emspSettingId;
        }
        if (!evseStationId && filter?.evseStationId) {
          evseStationId = filter?.evseStationId;
        }
        if (!evseStationId && filter?.stationId) {
          evseStationId = filter?.stationId;
        }
      } catch (error) {}
    }

    // let whereCondition = { isDeleted: false };
    let whereCondition = {};

    const matchConditions = {};
    const sqlMatchConditions = {};
    const sqlMatchConditionsRaw = {};
    let whereChargeBoxIds = null;
    let partnerContractIds = [];
    let partnerIds = [];
    let partnerEvseStationIds = [];

    if (isPartner) {
      partnerContractIds = req?.allowedIds?.contractIds ?? [];
      partnerIds = req?.allowedIds?.partnerIds ?? [];
      partnerEvseStationIds = req?.allowedIds?.evseStationIds ?? [];

      if (partnerContractIds?.length === 0) {
        req.analyticsFilters = { returnDefaultResponse: true };
        return next();
      }
    }

    if (!dateOnly) {
      if (isPartner) {
        const {
          evseStationIds = [],
          chargerIds = [],
          chargeBoxIds = [],
          contractIds = [],
        } = req?.allowedIds;

        if (contractIds?.length === 0) {
          req.analyticsFilters = { returnDefaultResponse: true };
          return next();
        }

        if (chargeBoxId) {
          if (!chargeBoxIds.includes(chargeBoxId)) {
            req.analyticsFilters = { returnDefaultResponse: true };
            return next();
          }

          whereChargeBoxIds = [chargeBoxId];
        } else {
          if (evseStationId) {
            if (!evseStationIds.includes(evseStationId)) {
              req.analyticsFilters = { returnDefaultResponse: true };
              return next();
            }

            whereCondition.id = evseStationId;
          }

          if (location) {
            whereCondition.country = location;
          }

          if (status) {
            if (chargerIds?.length === 0) {
              req.analyticsFilters = { returnDefaultResponse: true };
              return next();
            }

            let statusWhere = {
              id: In(chargerIds),
              status,
              isDeleted: false,
            };

            if (evseStationId) {
              statusWhere["evseStationId"] = evseStationId;
            }
            // get all charger of above station with givens status
            const chargers = await ChargerRepository.find({
              where: statusWhere,
              select: ["chargeBoxId"],
            });
            if (chargers.length) {
              whereChargeBoxIds = chargers.map((cg) => cg.chargeBoxId);
            }
          }

          if (!evseStationId && !status) {
            if (evseStationIds?.length === 0) {
              if (chargeBoxIds?.length > 0) {
                whereChargeBoxIds = chargeBoxIds;
              } else {
                req.analyticsFilters = { returnDefaultResponse: true };
                return next();
              }
            }
            whereCondition.id = In(evseStationIds);
          }
        }
      } else {
        if (chargeBoxId) {
          whereChargeBoxIds = [chargeBoxId];
        } else {
          if (evseStationId) {
            const evseStation = await EvseStationRepository.findOne({
              where: { id: evseStationId },
            });
            if (!evseStation) {
              req.analyticsFilters = { returnDefaultResponse: true };
              return next();
            }

            whereCondition.id = evseStationId;
            if (status) {
              // get all charger of above station with givens status
              const chargers = await ChargerRepository.find({
                where: {
                  evseStationId,
                  status,
                  isDeleted: false,
                },
                select: ["chargeBoxId"],
              });
              if (chargers.length) {
                whereChargeBoxIds = chargers.map((cg) => cg.chargeBoxId);
              }
            }
          }

          if (location) {
            // if (loggedInUserData?.user?.eMspId) {
            //   whereCondition.country = location;
            // } else {
            //   whereCondition.country = location;
            // }
            whereCondition.country = location;
          }

          if (!evseStationId && status) {
            // get all charger of above station with givens status
            const chargers = await ChargerRepository.find({
              where: {
                status,
                isDeleted: false,
              },
              select: ["chargeBoxId"],
            });
            if (chargers.length) {
              whereChargeBoxIds = chargers.map((cg) => cg.chargeBoxId);
            }
          }
        }
      }

      let allowedEvseStations = await EvseStationRepository.find({
        where: whereCondition,
        select: ["id"],
      });

      if (allowedEvseStations.length === 0) {
        req.analyticsFilters = { returnDefaultResponse: true };
        return next();
      }

      const stationIds = allowedEvseStations.map((station) => station.id);

      if (stationIds.length === 0) {
        req.analyticsFilters = { returnDefaultResponse: true };
        return next();
      }

      if (whereChargeBoxIds) {
        matchConditions["chargeBoxId"] = { $in: whereChargeBoxIds };
        sqlMatchConditions["chargeBoxId"] = In(whereChargeBoxIds);
        sqlMatchConditionsRaw["chargeBoxId"] = whereChargeBoxIds;
      } else {
        matchConditions["evseStationId"] = { $in: stationIds };
        sqlMatchConditions["evseStationId"] = In(stationIds);
        sqlMatchConditionsRaw["evseStationId"] = stationIds;
      }

      if (!showMockData) {
        matchConditions["isMockData"] = false;
      }

      if (partnerContractIds?.length > 0) {
        matchConditions["contractId"] = { $in: partnerContractIds };
        sqlMatchConditions["contractId"] = In(partnerContractIds);
        sqlMatchConditionsRaw["contractId"] = partnerContractIds;
      }
    }

    const dates = getDates(
      {
        startDate,
        endDate,
        previousStartDate,
        previousEndDate,
      },
      defaultRange
    );
    const { range, rangeSql, rangeTrend, rangeRaw, rangeRawTrend } = dates;

    const currentDates = getCurrentMonthAndWeekDateRanges();
    const {
      month: { current: currentMonthRange, previous: previousMonthRange },
      week: { current: currentWeekRange, previous: previousWeekRange },
    } = currentDates;

    let todayStartDate = null;
    let todayEndDate = null;
    let timezone = null;
    if (todayRange) {
      timezone = "America/Toronto";

      if (location) {
        timezone = await getTimezoneByCountry(location);
      }

      timezone = timezone ?? "America/Toronto";

      const tzTodayStart = DateTime.utc().setZone(timezone).startOf("day");
      const tzTodayEnd = DateTime.utc().setZone(timezone).endOf("day");

      todayStartDate = convertDateTimezone(tzTodayStart, "UTC");
      todayEndDate = convertDateTimezone(tzTodayEnd, "UTC");
    }

    req.analyticsFilters = {
      currentMonthRange,
      previousMonthRange,
      currentWeekRange,
      previousWeekRange,
      returnDefaultResponse: false,
      matchConditions,
      sqlMatchConditions,
      sqlMatchConditionsRaw,
      range,
      rangeSql,
      rangeRaw,
      rangeRawTrend,
      rangeTrend,
      location,
      partnerType,
      emspSettingId,
      evseStationId,
      partnerContractIds,
      partnerIds,
      partnerEvseStationIds,
      todayStartDate,
      todayEndDate,
      timezone,
    };
    return next();
  };

module.exports = {
  AnalyticsFilterMiddleware,
};
