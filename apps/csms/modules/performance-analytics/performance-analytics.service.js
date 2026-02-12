const {
  EvseStationRepository,
  ChargerExperienceFeedbackRepository,
  ChargerRevenueRepository,
  ChargerRepository,
  OcppTransactionsRepository,
  UserRepository,
  ChargerVersionRepository,
} = require("@shared-libs/db/mysql");
const { DateTime } = require("luxon");
const { AnalyticsModel } = require("@shared-libs/db/mongo-db");
const {
  getChargersOverview,
  arrayObjStr,
  getAnalyticDataForDashboard,
  getGrossRevenueSplit,
  growthPercentage,
  getTrendsData,
} = require("@shared-libs/helpers");
const { In, Between } = require("typeorm");

// ================ Charger Analytics: START ==========================================

const getTopLowChargersData = async (matchConditions, range, isTop = true) => {
  const [topRevenue, topUtilization] = await Promise.all([
    AnalyticsModel.aggregate([
      { $match: { ...matchConditions, ...range } },
      {
        $group: {
          _id: `$chargeBoxId`,
          total: { $sum: { $ifNull: [`$totalRevenue`, 0] } },
        },
      },
      { $sort: { total: isTop ? -1 : 1 } },
      { $limit: 5 },
    ]),
    AnalyticsModel.aggregate([
      { $match: { ...matchConditions, ...range } },
      {
        $group: {
          _id: `$chargeBoxId`,
          totalSessionsDurationSec: { $sum: "$totalDurationSec" },
          uniqueDates: {
            $addToSet: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          totalSessionsDurationSec: 1,
          uniqueDateCount: { $size: "$uniqueDates" },
        },
      },
      {
        $addFields: {
          total: {
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
        },
      },
      { $sort: { total: isTop ? -1 : 1 } },
      { $limit: 5 },
    ]),
  ]);

  const chargeBoxIdsRevenue = topRevenue.map(({ _id }) => {
    return _id;
  });
  const chargeBoxIdsUtilization = topUtilization.map(({ _id }) => {
    return _id;
  });

  const [siteInfoRevenue, siteInfoUtilization] = await Promise.all([
    ChargerRepository.find({
      where: { chargeBoxId: In(chargeBoxIdsRevenue) },
      select: ["chargeBoxId", "evseStationId"],
    }),
    ChargerRepository.find({
      where: { chargeBoxId: In(chargeBoxIdsUtilization) },
      select: ["chargeBoxId", "evseStationId"],
    }),
  ]);

  const evseStationIds = [...siteInfoRevenue, ...siteInfoUtilization].map(
    ({ evseStationId }) => evseStationId
  );

  let evseStationsData = {};
  if (evseStationIds?.length > 0) {
    const evseStations = await EvseStationRepository.find({
      where: { id: In(evseStationIds) },
      select: ["id", "code"],
    });

    evseStationsData = arrayObjStr(evseStations, "id", "code");
  }

  const siteInfoRevenueData = arrayObjStr(siteInfoRevenue, "chargeBoxId");
  const siteInfoUtilizationData = arrayObjStr(
    siteInfoUtilization,
    "chargeBoxId"
  );

  let totalRevenue = 0;
  let totalUtilization = 0;

  const revenue = topRevenue.map(({ _id, total }) => {
    const chargeBoxId = siteInfoRevenueData[_id]?.chargeBoxId ?? "";
    const evseStationId = siteInfoRevenueData[_id]?.evseStationId ?? "";

    totalRevenue += Number(total ?? 0);
    return {
      chargeBoxId,
      evseStation: evseStationsData[evseStationId] ?? "",
      value: parseFloat(total ?? 0).toFixed(2),
    };
  });

  const utilization = topUtilization.map(({ _id, total }) => {
    const chargeBoxId = siteInfoUtilizationData[_id]?.chargeBoxId ?? "";
    const evseStationId = siteInfoUtilizationData[_id]?.evseStationId ?? "";

    totalUtilization += Number(total ?? 0);
    return {
      chargeBoxId,
      evseStation: evseStationsData[evseStationId] ?? "",
      value: parseFloat(total ?? 0).toFixed(2),
    };
  });

  return { revenue, utilization, totalRevenue, totalUtilization };
};

const getSessionCountOverview = async (matchConditions) => {
  const returnData = { daily: 0, weekly: 0, monthly: 0, yearToDate: 0 };

  try {
    const now = DateTime.now();

    const startOfDay = now.startOf("day");
    const startOfWeek = now.startOf("week");
    const startOfMonth = now.startOf("month");
    const startOfYear = now.startOf("year");

    let countData = await AnalyticsModel.aggregate([
      {
        $facet: {
          daily: [
            { $match: { ...matchConditions, createdAt: { $gte: startOfDay } } },
            { $group: { _id: null, total: { $sum: "$totalSessions" } } },
          ],
          weekly: [
            {
              $match: { ...matchConditions, createdAt: { $gte: startOfWeek } },
            },
            { $group: { _id: null, total: { $sum: "$totalSessions" } } },
          ],
          monthly: [
            {
              $match: { ...matchConditions, createdAt: { $gte: startOfMonth } },
            },
            { $group: { _id: null, total: { $sum: "$totalSessions" } } },
          ],
          yearToDate: [
            {
              $match: { ...matchConditions, createdAt: { $gte: startOfYear } },
            },
            { $group: { _id: null, total: { $sum: "$totalSessions" } } },
          ],
        },
      },
      {
        $project: {
          daily: { $ifNull: [{ $arrayElemAt: ["$daily.total", 0] }, 0] },
          weekly: { $ifNull: [{ $arrayElemAt: ["$weekly.total", 0] }, 0] },
          monthly: { $ifNull: [{ $arrayElemAt: ["$monthly.total", 0] }, 0] },
          yearToDate: {
            $ifNull: [{ $arrayElemAt: ["$yearToDate.total", 0] }, 0],
          },
        },
      },
    ]);

    if (countData?.length > 0) {
      countData = countData[0];

      returnData["daily"] = countData?.daily ?? 0;
      returnData["weekly"] = countData?.weekly ?? 0;
      returnData["monthly"] = countData?.monthly ?? 0;
      returnData["yearToDate"] = countData?.yearToDate ?? 0;
    }
  } catch (error) {}

  return returnData;
};

const getPeakData = async (
  sqlMatchConditions,
  startDateUtc,
  endDateUtc,
  timezone
) => {
  /** Build 1 Hour Slots **/
  const tzStart = DateTime.utc().setZone(timezone).startOf("day");
  const tzEnd = DateTime.utc().setZone(timezone).endOf("day");

  const hourSlots = [];
  let cursor = tzStart;

  while (cursor < tzEnd) {
    const next = cursor.plus({ hours: 1 });
    hourSlots.push({ start: cursor, end: next, count: 0 });
    cursor = next;
  }

  let peakUsagePattern = hourSlots.map((s) => ({
    time: s.start.toFormat("hh:mm a"),
    sessions: 0,
  }));

  let peakUsageHours = {
    morning: { sessions: 0, time: "-" },
    evening: { sessions: 0, time: "-" },
  };

  try {
    /** Fetch Data (UTC) **/
    const qb = OcppTransactionsRepository.createQueryBuilder("t")
      .where("t.startTime <= :endDate AND t.endTime >= :startDate", {
        startDate: startDateUtc,
        endDate: endDateUtc,
      })
      .select(["t.startTime", "t.endTime", "t.orderId"]);

    if (sqlMatchConditions.evseStationId?.length) {
      qb.andWhere("t.evseStationId IN (:...evseStationIds)", {
        evseStationIds: sqlMatchConditions.evseStationId,
      });
    }
    qb.andWhere("t.paymentStatus = :paymentStatus", {
      paymentStatus: "Accepted",
    });

    const transactions = await qb.getMany();

    /** Convert to Country Timezone **/
    const convertToTz = (dateStr) =>
      DateTime.fromJSDate(dateStr, { zone: "utc" }).setZone(timezone);

    const tzTransactions = transactions.map((t) => ({
      start: convertToTz(t.startTime),
      end: convertToTz(t.endTime),
    }));

    /** Count Overlapping Transactions **/
    for (const slot of hourSlots) {
      for (const t of tzTransactions) {
        if (t.start < slot.end && t.end >= slot.start) {
          slot.count++;
        }
      }
    }

    /** Define Morning & Evening Slots **/
    const morningSlots = hourSlots.filter(
      (s) => s.start.hour >= 6 && s.start.hour < 12
    );
    const eveningSlots = hourSlots.filter(
      (s) => s.start.hour >= 16 && s.start.hour < 22
    );

    const findPeak = (slots) =>
      slots.reduce((max, s) => (s.count > max.count ? s : max), { count: -1 });

    const morningPeak = findPeak(morningSlots);
    const eveningPeak = findPeak(eveningSlots);

    /** Format Peak Hours **/
    const formatPeak = (peak) =>
      peak.count > -1
        ? {
            sessions: peak.count,
            time: `${peak.start.toFormat("hh:mm a")} - ${peak.end.toFormat(
              "hh:mm a"
            )}`,
          }
        : null;

    /** Format Hourly Pattern **/
    peakUsagePattern = hourSlots.map((s) => ({
      time: s.start.toFormat("hh:mm a"),
      sessions: s.count,
    }));

    peakUsageHours = {
      morning: formatPeak(morningPeak),
      evening: formatPeak(eveningPeak),
    };
  } catch (error) {}

  try {
    if (peakUsageHours?.morning?.sessions == 0) {
      peakUsageHours.morning.time = "-";
    }
    if (peakUsageHours?.evening?.sessions == 0) {
      peakUsageHours.evening.time = "-";
    }
  } catch (error) {}

  return {
    peakUsageHours,
    peakUsagePattern,
  };
};

const getRevenueVSutilization = async (matchConditions) => {
  let revenueVSutilization = {
    totalChargers: 0,
    chartData: {
      weekly: [],
      monthly: [],
    },
  };

  try {
    const startOfYear = DateTime.now().startOf("year").toJSDate();
    const endOfYear = DateTime.now().endOf("year").toJSDate();

    // ---------------------------
    // Total chargers (distinct)
    // ---------------------------
    const totalChargers = await AnalyticsModel.distinct("chargeBoxId", {
      createdAt: { $gte: startOfYear, $lte: endOfYear },
      ...matchConditions,
    }).then((arr) => arr.length);

    // ---------------------------
    // Weekly aggregation
    // ---------------------------
    const weeklyRaw = await AnalyticsModel.aggregate([
      {
        $match: {
          ...matchConditions,
          createdAt: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$createdAt" },
            week: { $isoWeek: "$createdAt" },
          },
          revenue: { $sum: "$totalRevenue" },
          utilizationHours: { $sum: "$totalDuration" },
          weekStart: { $min: "$createdAt" },
          weekEnd: { $max: "$createdAt" },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    const weekly = weeklyRaw.map((row) => {
      const start = DateTime.fromJSDate(row.weekStart).startOf("day");
      const end = DateTime.fromJSDate(row.weekEnd).endOf("day");

      const totalHoursInPeriod = 168;
      const utilizationPct = parseFloat(
        (row.utilizationHours * 100) / totalHoursInPeriod ?? 0
      ).toFixed(2);

      return {
        revenue: parseFloat(row.revenue || 0).toFixed(2),
        utilization: utilizationPct,
        weekStart: start.toFormat("yyyy-MM-dd"),
        weekEnd: end.toFormat("yyyy-MM-dd"),
        year: String(row._id.year),
        weekOfYear: row._id.week,
      };
    });

    // ---------------------------
    // Monthly aggregation
    // ---------------------------
    const monthlyRaw = await AnalyticsModel.aggregate([
      {
        $match: {
          ...matchConditions,
          createdAt: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalRevenue" },
          utilizationHours: { $sum: "$totalDuration" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthly = monthlyRaw.map((row) => {
      const dt = DateTime.fromObject({
        year: row._id.year,
        month: row._id.month,
      });

      const totalHoursInPeriod = 672;
      const utilizationPct = parseFloat(
        (row.utilizationHours * 100) / totalHoursInPeriod ?? 0
      ).toFixed(2);

      return {
        month: dt.toFormat("LLL"),
        monthYear: `${dt.toFormat("LLL")}-${row._id.year}`,
        year: String(row._id.year),
        revenue: parseFloat(row.revenue || 0).toFixed(0),
        utilization: utilizationPct,
      };
    });

    revenueVSutilization = {
      totalChargers,
      chartData: {
        weekly,
        monthly,
      },
    };
  } catch (error) {
    console.error("Error in getRevenueVSutilization:", error);
  }

  return revenueVSutilization;
};

const getChargerVersionData = async (matchConditions) => {
  try {
    const queryBuilder = ChargerVersionRepository.createQueryBuilder("cv")
      .select("cv.firmwareVersion", "version")
      .addSelect("COUNT(DISTINCT cv.chargerId)", "count")
      .where("cv.firmwareVersion IS NOT NULL")
      .groupBy("cv.firmwareVersion")
      .orderBy("count", "DESC");
    if (matchConditions?.evseStationId && Array.isArray(matchConditions.evseStationId) && matchConditions.evseStationId.length > 0) {
      queryBuilder.andWhere("cv.evseStationId IN (:...evseStationIds)", {
        evseStationIds: matchConditions.evseStationId,
      });
    }

    const results = await queryBuilder.getRawMany();

    return results.map((row) => ({
      version: row.version || "Unknown",
      count: parseInt(row.count, 10) || 0,
    }));
  } catch (error) {
    console.error("Error in getChargerVersionData:", error);
    return [];
  }
};

const getChargerAnalyticsDefaultResponse = () => {
  return {
    chargerUptime: {
      uptimePercentage: 0,
      totalChargers: 0,
      activeChargers: 0,
      comparison: `+0% this month`,
      isPositive: true,
    },
    firmwareVersion: [],
    topPerformingChargers: {
      revenue: [],
      utilization: [],
      revenueComparison: "No Change",
      revenueComparisonValue: 0,
      revenueIsPositive: true,
      revenueIsNeutral: true,
      revenueIsDangerous: false,
      utilizationComparison: "No Change",
      utilizationComparisonValue: 0,
      utilizationIsPositive: true,
      utilizationIsNeutral: true,
      utilizationIsDangerous: false,
    },
    lowPerformingChargers: {
      revenue: [],
      utilization: [],
      revenueComparison: `No Change`,
      revenueComparisonValue: 0,
      revenueIsPositive: true,
      revenueIsNeutral: true,
      revenueIsDangerous: false,
      utilizationComparison: `No Change`,
      utilizationComparisonValue: 0,
      utilizationIsPositive: true,
      utilizationIsNeutral: true,
      utilizationIsDangerous: false,
    },
    revenueVSutilization: {
      totalChargers: 0,
      chartData: {
        weekly: [],
        monthly: [],
      },
    },

    totalEnergyDispensed: getTrendsData({
      isMoney: true,
      suffix: "kWh",
      value: 0,
      valueTrends: 0,
    }),

    averageEnergyPerSession: getTrendsData({
      isMoney: true,
      suffix: "kWh",
      value: 0,
      valueTrends: 0,
    }),

    averageSessionPerDay: getTrendsData({
      isMoney: true,
      value: 0,
      valueTrends: 0,
    }),

    totalSessions: {
      daily: 0,
      weekly: 0,
      monthly: 0,
      yearToDate: 0,
    },
    peakUsageHours: {
      morning: {
        sessions: 0,
        time: "-",
      },
      evening: {
        sessions: 0,
        time: "-",
      },
    },
    peakUsagePattern: [],
    averageSessionDuration: {
      perCharger: "6.6hrs",
      chartData: [
        { status: "Interrupted", sessions: 6.8 },
        { status: "In Progress", sessions: 2.5 },
        { status: "Failed", sessions: 8.2 },
        { status: "Completed", sessions: 82.6 },
      ],
    },
  };
};

const chargerAnalytics = async (req, res) => {
  const {
    returnDefaultResponse,
    matchConditions,
    sqlMatchConditions,
    sqlMatchConditionsRaw,
    rangeRaw,
    range,
    rangeTrend,
    todayStartDate,
    todayEndDate,
    timezone,
  } = req.analyticsFilters;

  // const defaultResponse2 = await getPeakData(
  //   sqlMatchConditionsRaw,
  //   todayStartDate,
  //   todayEndDate,
  //   timezone
  // );
  // return res.status(200).json(defaultResponse2);

  const defaultResponse = getChargerAnalyticsDefaultResponse();

  if (returnDefaultResponse === true) {
    return res.status(200).json(defaultResponse);
  }

  const [
    allAnalytics,
    allAnalyticsTrends,
    chargersOverview,
    topChargersData,
    topChargersTrendData,
    lowChargersData,
    sessionCountOverviewData,
    { peakUsageHours, peakUsagePattern },
    revenueVSutilization,
    chargerVersionData,
  ] = await Promise.all([
    getAnalyticDataForDashboard({
      ...matchConditions,
      ...range,
    }),
    getAnalyticDataForDashboard({
      ...matchConditions,
      ...rangeTrend,
    }),

    getChargersOverview(sqlMatchConditions),

    getTopLowChargersData(matchConditions, range, true),
    getTopLowChargersData(matchConditions, rangeTrend, true),
    getTopLowChargersData(matchConditions, range, false),
    getSessionCountOverview(matchConditions),
    getPeakData(sqlMatchConditionsRaw, todayStartDate, todayEndDate, timezone),
    getRevenueVSutilization(matchConditions),
    getChargerVersionData(sqlMatchConditionsRaw),
  ]);

  defaultResponse["totalSessions"] = sessionCountOverviewData;
  defaultResponse["peakUsageHours"] = peakUsageHours;
  defaultResponse["peakUsagePattern"] = peakUsagePattern;
  defaultResponse["revenueVSutilization"] = revenueVSutilization;
  defaultResponse["firmwareVersion"] = chargerVersionData;

  // ======================= chargerUptime ==================================
  const { totalCount = 0, available = 0 } = chargersOverview;

  const uptimePercentage =
    totalCount > 0 ? parseFloat((available * 100) / totalCount).toFixed(2) : 0;

  defaultResponse["chargerUptime"] = {
    uptimePercentage,
    totalChargers: totalCount,
    activeChargers: available,
    comparison: `+${uptimePercentage}% this month`,
    isPositive: true,
  };
  // ========================================================================

  // ======================= topPerformingChargers ==================================
  defaultResponse["topPerformingChargers"]["revenue"] =
    topChargersData?.revenue ?? [];
  defaultResponse["topPerformingChargers"]["utilization"] =
    topChargersData?.utilization ?? [];

  const totalRevenueDifference =
    Number(topChargersData?.totalRevenue ?? 0) -
    Number(topChargersTrendData?.totalRevenue ?? 0);

  const percentRevenueChange =
    Number(topChargersTrendData?.totalRevenue ?? 0) > 0
      ? (totalRevenueDifference /
          Number(topChargersTrendData?.totalRevenue ?? 0)) *
        100
      : 0;

  const topPerformingChargersRevDelta = getTrendsData({
    isMoney: true,
    isPercentage: true,
    valueDifference: percentRevenueChange,
  });

  let totalRevenueDifferenceText = topPerformingChargersRevDelta["comparison"];
  if (!topPerformingChargersRevDelta["isNeutral"]) {
    if (topPerformingChargersRevDelta["isPositive"]) {
      totalRevenueDifferenceText = `Revenue up ${totalRevenueDifferenceText}`;
    } else {
      totalRevenueDifferenceText = `Revenue down ${totalRevenueDifferenceText}`;
    }
  }

  defaultResponse["topPerformingChargers"]["revenueComparison"] =
    totalRevenueDifferenceText;
  defaultResponse["topPerformingChargers"]["revenueComparisonValue"] =
    topPerformingChargersRevDelta["comparisonValue"];
  defaultResponse["topPerformingChargers"]["revenueIsPositive"] =
    topPerformingChargersRevDelta["isPositive"];
  defaultResponse["topPerformingChargers"]["revenueIsNeutral"] =
    topPerformingChargersRevDelta["isNeutral"];
  defaultResponse["topPerformingChargers"]["revenueIsDangerous"] =
    topPerformingChargersRevDelta["isDangerous"];

  // ==================================

  const totalUtilizationDifference =
    Number(topChargersData?.totalUtilization ?? 0) -
    Number(topChargersTrendData?.totalUtilization ?? 0);

  const percentUtilizationChange =
    Number(topChargersTrendData?.totalUtilization ?? 0) > 0
      ? (totalUtilizationDifference /
          Number(topChargersTrendData?.totalUtilization ?? 0)) *
        100
      : 0;

  const topPerformingChargersUtiDelta = getTrendsData({
    isMoney: true,
    isPercentage: true,
    valueDifference: percentUtilizationChange,
  });

  let totalUtilizationDifferenceText =
    topPerformingChargersUtiDelta["comparison"];
  if (!topPerformingChargersUtiDelta["isNeutral"]) {
    if (topPerformingChargersUtiDelta["isPositive"]) {
      totalUtilizationDifferenceText = `Utilization up ${totalUtilizationDifferenceText}`;
    } else {
      totalUtilizationDifferenceText = `Utilization down ${totalUtilizationDifferenceText}`;
    }
  }

  defaultResponse["topPerformingChargers"]["utilizationComparison"] =
    totalUtilizationDifferenceText;
  defaultResponse["topPerformingChargers"]["utilizationComparisonValue"] =
    topPerformingChargersUtiDelta["comparisonValue"];
  defaultResponse["topPerformingChargers"]["utilizationIsPositive"] =
    topPerformingChargersUtiDelta["isPositive"];
  defaultResponse["topPerformingChargers"]["utilizationIsNeutral"] =
    topPerformingChargersUtiDelta["isNeutral"];
  defaultResponse["topPerformingChargers"]["utilizationIsDangerous"] =
    topPerformingChargersUtiDelta["isDangerous"];
  // ========================================================================

  // ======================= topPerformingChargers ==================================
  defaultResponse["lowPerformingChargers"]["revenue"] =
    lowChargersData?.revenue ?? [];
  defaultResponse["lowPerformingChargers"]["utilization"] =
    lowChargersData?.utilization ?? [];

  defaultResponse["lowPerformingChargers"]["revenueComparison"] = `${
    (lowChargersData?.revenue ?? []).length
  } stations need optimization`;
  defaultResponse["lowPerformingChargers"]["revenueComparisonValue"] = (
    lowChargersData?.revenue ?? []
  ).length;
  defaultResponse["lowPerformingChargers"]["revenueIsPositive"] = false;
  defaultResponse["lowPerformingChargers"]["revenueIsNeutral"] = false;
  defaultResponse["lowPerformingChargers"]["revenueIsDangerous"] = true;

  defaultResponse["lowPerformingChargers"]["utilizationComparison"] = `${
    (lowChargersData?.utilization ?? []).length
  } stations need optimization`;
  defaultResponse["lowPerformingChargers"]["utilizationComparisonValue"] = (
    lowChargersData?.utilization ?? []
  ).length;
  defaultResponse["lowPerformingChargers"]["utilizationIsPositive"] = false;
  defaultResponse["lowPerformingChargers"]["utilizationIsNeutral"] = false;
  defaultResponse["lowPerformingChargers"]["utilizationIsDangerous"] = true;
  // ========================================================================

  // Extract the first object from the array
  const analyticCounts = allAnalytics[0] || {}; // Return empty object if no data found
  const analyticTrendsCounts = allAnalyticsTrends[0] || {}; // Return empty object if no data found

  let {
    totalSessions = 0,
    totalEnergyDelivered = 0,
    uniqueDateCount = 1,
  } = analyticCounts;
  let {
    totalSessions: totalSessionsTrends = 0,
    totalEnergyDelivered: totalEnergyDeliveredTrends = 0,
    uniqueDateCount: uniqueDateCountTrends = 1,
  } = analyticTrendsCounts;

  // ======================= avgDailySessions ==================================

  let avgDailySessions =
    totalSessions > 0 ? totalSessions / uniqueDateCount : 0;
  let avgDailySessionsTrends =
    totalSessionsTrends > 0 ? totalSessionsTrends / uniqueDateCountTrends : 0;

  defaultResponse["averageSessionPerDay"] = getTrendsData({
    isMoney: true,
    value: avgDailySessions,
    valueTrends: avgDailySessionsTrends,
  });
  // ========================================================================

  // ======================= avgEnergyPerSession ==================================

  let avgEnergyPerSession =
    totalEnergyDelivered > 0 ? totalEnergyDelivered / totalSessions : 0;
  let avgEnergyPerSessionTrends =
    totalEnergyDeliveredTrends > 0
      ? totalEnergyDeliveredTrends / totalSessionsTrends
      : 0;

  defaultResponse["averageEnergyPerSession"] = getTrendsData({
    isMoney: true,
    suffix: "kWh",
    value: avgEnergyPerSession,
    valueTrends: avgEnergyPerSessionTrends,
  });
  // ========================================================================

  // ======================= totalEnergyDelivered ==================================
  defaultResponse["totalEnergyDispensed"] = getTrendsData({
    isMoney: true,
    suffix: "kWh",
    value: totalEnergyDelivered,
    valueTrends: totalEnergyDeliveredTrends,
  });
  // ========================================================================

  return res.status(200).json(defaultResponse);
};

// ================ Charger Analytics: END ===========================================

// ===================================================================================

// ================ Charger Feedback Analytics: START =================================

const getChargerFeedbackExperienceQuery = (
  startDate,
  endDate,
  country,
  evseStationId
) => {
  const chargerFeedbackExperienceQuery =
    ChargerExperienceFeedbackRepository.createQueryBuilder(
      "chargerFeedbackExperience"
    ).where("chargerFeedbackExperience.isDeleted = :isDeleted", {
      isDeleted: false,
    });

  if (startDate && endDate) {
    chargerFeedbackExperienceQuery.andWhere(
      "chargerFeedbackExperience.createdAt BETWEEN :start AND :end",
      { start: startDate, end: endDate }
    );
  }

  if (country) {
    chargerFeedbackExperienceQuery.andWhere(
      "chargerFeedbackExperience.country = :country",
      { country }
    );
  }

  if (evseStationId) {
    chargerFeedbackExperienceQuery.andWhere(
      "chargerFeedbackExperience.evseStationId = :evseStationId",
      { evseStationId }
    );
  }

  return chargerFeedbackExperienceQuery;
};

const getTotalFeedbackComparisioPercentage = async (
  startDate,
  endDate,
  country,
  evseStationId
) => {
  let currentStartDate = "";
  let currentEndDate = "";
  let lastStartDate = "";
  let lastEndDate = "";
  let periodText = "this month";

  if (startDate && endDate) {
    currentStartDate = startDate;
    currentEndDate = endDate;

    const currentStartMs = new Date(currentStartDate).getTime();
    const currentEndMs = new Date(currentEndDate).getTime();
    const durationMs = currentEndMs - currentStartMs;

    const dayInMs = 24 * 60 * 60 * 1000;
    const lastEndDateMs = currentStartMs - dayInMs;
    const lastStartDateMs = lastEndDateMs - durationMs;

    lastStartDate = new Date(lastStartDateMs).toISOString().slice(0, 10);
    lastEndDate = new Date(lastEndDateMs).toISOString().slice(0, 10);

    const durationDays = Math.round(durationMs / dayInMs);

    if (durationDays < 7) {
      periodText = ` this ${durationDays} days`;
    } else if (durationDays >= 7 && durationDays < 30) {
      periodText = "this week";
    } else {
      periodText = "this month";
    }
  } else {
    const now = new Date();

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentStartDate = currentMonthStart.toISOString().slice(0, 10);
    currentEndDate = now.toISOString().slice(0, 10);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    lastStartDate = lastMonthStart.toISOString().slice(0, 10);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    lastEndDate = lastMonthEnd.toISOString().slice(0, 10);
  }
  let percentageComparison = 0;

  const currentCount = await getChargerFeedbackExperienceQuery(
    currentStartDate,
    currentEndDate,
    country,
    evseStationId
  ).getCount();
  const lastCount = await getChargerFeedbackExperienceQuery(
    lastStartDate,
    lastEndDate,
    country,
    evseStationId
  ).getCount();

  if (lastCount > 0) {
    percentageComparison = ((currentCount - lastCount) / lastCount) * 100;
  } else if (currentCount > 0) {
    percentageComparison = 100;
  }

  const formattedPercentage = percentageComparison.toFixed(1);

  const comparisonText =
    percentageComparison >= 0
      ? `+${formattedPercentage}% ${periodText}`
      : `${formattedPercentage}% ${periodText}`;

  return {
    comparison: comparisonText,
    comparisonValue: percentageComparison,
    isPositive: percentageComparison >= 0,
  };
};

const getAvgFeedbackComparisionCountRatio = async (
  startDate,
  endDate,
  country,
  evseStationId
) => {
  let currentStartDate = "";
  let currentEndDate = "";
  let lastStartDate = "";
  let lastEndDate = "";
  let periodText = "this month"; // Default periodText

  const dayInMs = 24 * 60 * 60 * 1000;

  if (startDate && endDate) {
    currentStartDate = startDate;
    currentEndDate = endDate;

    const currentStartMs = new Date(currentStartDate).getTime();
    const currentEndMs = new Date(currentEndDate).getTime();
    const durationMs = currentEndMs - currentStartMs;

    const lastEndDateMs = currentStartMs - dayInMs;
    const lastStartDateMs = lastEndDateMs - durationMs;

    lastStartDate = new Date(lastStartDateMs).toISOString().slice(0, 10);
    lastEndDate = new Date(lastEndDateMs).toISOString().slice(0, 10);

    const durationDays = Math.round(durationMs / dayInMs);

    if (durationDays < 7) {
      periodText = `${durationDays} days`;
    } else if (durationDays >= 7 && durationDays < 30) {
      periodText = "this week";
    } else {
      periodText = "this month";
    }
  } else {
    const now = new Date();

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentStartDate = currentMonthStart.toISOString().slice(0, 10);
    currentEndDate = now.toISOString().slice(0, 10);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    lastStartDate = lastMonthStart.toISOString().slice(0, 10);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    lastEndDate = lastMonthEnd.toISOString().slice(0, 10);
  }

  const chargerFeedbackExperienceQuery = getChargerFeedbackExperienceQuery(
    startDate,
    endDate,
    country,
    evseStationId
  );

  const avgCurrentChargerRating = chargerFeedbackExperienceQuery
    .select("AVG(chargerFeedbackExperience.rating)", "avgRating")
    .where("chargerFeedbackExperience.createdAt BETWEEN :start AND :end", {
      start: currentStartDate,
      end: currentEndDate,
    })
    .getRawOne();
  const avgLastChargerRating = chargerFeedbackExperienceQuery
    .select("AVG(chargerFeedbackExperience.rating)", "avgRating")
    .where("chargerFeedbackExperience.createdAt BETWEEN :start AND :end", {
      start: lastStartDate,
      end: lastEndDate,
    })
    .getRawOne();

  const avgChargerRatingComparison =
    avgCurrentChargerRating.avgRating - avgLastChargerRating.avgRating;

  let comparisonRatio = 0;

  if (avgLastChargerRating.avgRating > 0) {
    comparisonRatio =
      avgCurrentChargerRating.avgRating / avgLastChargerRating.avgRating;
  } else if (avgCurrentChargerRating.avgRating > 0) {
    comparisonRatio = avgChargerRatingComparison;
  }

  const formattedComparisonValue = comparisonRatio.toFixed(1);

  const comparisonText = `${formattedComparisonValue} ${periodText}`;

  return {
    comparison: comparisonText,
    comparisonValue: comparisonRatio,
    isPositive: avgChargerRatingComparison >= 0,
  };
};

const getChargerFeedbackAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, location, evseStationId } = req.query;

    const defaultResponse = getFeedbackAnalyticsDefaultResponse();

    const chargerFeedbackExperienceQuery = getChargerFeedbackExperienceQuery(
      startDate,
      endDate,
      location,
      evseStationId
    );

    const totalFeedback = await chargerFeedbackExperienceQuery.getCount();
    const totalFeedbackComparison = await getTotalFeedbackComparisioPercentage(
      startDate,
      endDate,
      location,
      evseStationId
    );

    defaultResponse["totalReviews"] = {
      value: totalFeedback,
      comparison: totalFeedbackComparison.comparison,
      comparisonValue: totalFeedbackComparison.comparisonValue,
      isPositive: totalFeedbackComparison.isPositive,
    };

    // Avg charger rating
    const avgChargerRating = chargerFeedbackExperienceQuery
      .select("AVG(chargerFeedbackExperience.rating)", "avgRating")
      .getRawOne();
    const avgChargerRatingComparison =
      await getAvgFeedbackComparisionCountRatio(
        startDate,
        endDate,
        location,
        evseStationId
      );
    defaultResponse["avgChargerRating"] = {
      value: avgChargerRating.avgRating,
      comparison: avgChargerRatingComparison.comparison,
      comparisonValue: avgChargerRatingComparison.comparisonValue,
      isPositive: avgChargerRatingComparison.isPositive,
    };

    res.status(200).json(defaultResponse);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while getting charger feedback analytics",
    });
  }
};

const getFeedbackAnalyticsDefaultResponse = () => {
  return {
    overallRating: {
      value: 4.2,
      comparison: "+0.4 this month",
      comparisonValue: 0.4,
      isPositive: true,
    },
    totalReviews: {
      value: 15827,
      comparison: "+3.3% this month",
      comparisonValue: 3.3,
      isPositive: true,
    },
    feedbackRate: {
      value: 68.4,
      comparison: "+3.2% this month",
      comparisonValue: 3.2,
      isPositive: true,
    },
    avgFeedbackPerCharger: {
      value: 23.5,
      comparison: "+0.4 this month",
      comparisonValue: 0.4,
      isPositive: true,
    },
    resolutionRate: {
      value: 93.7,
      comparison: "+3.3% this month",
      comparisonValue: 3.3,
      isPositive: true,
    },
    activeAlerts: {
      value: 4,
      comparison: "Requires Attention",
      comparisonValue: 0,
      isPositive: false,
    },
    ratingCounts: {
      fiveStar: 8420,
      fourStar: 3850,
      threeStar: 2100,
      twoStar: 1200,
      oneStar: 257,
    },
    monthlyRatingTrends: [
      {
        month: "Jan",
        year: 2024,
        rating: 4.0,
        utilization: 45,
        revenue: 18.5,
      },
      {
        month: "Feb",
        year: 2024,
        rating: 3.0,
        utilization: 42,
        revenue: 16.2,
      },
      {
        month: "Mar",
        year: 2024,
        rating: 4.0,
        utilization: 48,
        revenue: 19.8,
      },
      {
        month: "Apr",
        year: 2024,
        rating: 3.3,
        utilization: 52,
        revenue: 22.1,
      },
      {
        month: "May",
        year: 2024,
        rating: 3.2,
        utilization: 54,
        revenue: 24.7,
      },
      {
        month: "Jun",
        year: 2024,
        rating: 2.6,
        utilization: 49,
        revenue: 21.4,
      },
      {
        month: "Jul",
        year: 2024,
        rating: 4.0,
        utilization: 46,
        revenue: 20.3,
      },
      {
        month: "Aug",
        year: 2024,
        rating: 2.3,
        utilization: 51,
        revenue: 23.8,
      },
      {
        month: "Sep",
        year: 2024,
        rating: 3.6,
        utilization: 48,
        revenue: 22.2,
      },
      {
        month: "Oct",
        year: 2024,
        rating: 3.3,
        utilization: 45,
        revenue: 20.9,
      },
      {
        month: "Nov",
        year: 2024,
        rating: 4.5,
        utilization: 53,
        revenue: 25.6,
      },
      {
        month: "Dec",
        year: 2024,
        rating: 4.8,
        utilization: 56,
        revenue: 28.1,
      },
    ],
    weeklyRatingTrends: [
      {
        weekStart: "2024-01-01",
        weekEnd: "2024-01-07",
        year: 2024,
        weekOfYear: 1,
        rating: 4.2,
        utilization: 47,
        revenue: 19.2,
      },
      {
        weekStart: "2024-01-08",
        weekEnd: "2024-01-14",
        year: 2024,
        weekOfYear: 2,
        rating: 3.8,
        utilization: 44,
        revenue: 17.8,
      },
      {
        weekStart: "2024-01-15",
        weekEnd: "2024-01-21",
        year: 2024,
        weekOfYear: 3,
        rating: 4.1,
        utilization: 46,
        revenue: 18.9,
      },
      {
        weekStart: "2024-01-22",
        weekEnd: "2024-01-28",
        year: 2024,
        weekOfYear: 4,
        rating: 3.9,
        utilization: 43,
        revenue: 17.5,
      },
      {
        weekStart: "2024-01-29",
        weekEnd: "2024-02-04",
        year: 2024,
        weekOfYear: 5,
        rating: 4.3,
        utilization: 49,
        revenue: 20.1,
      },
      {
        weekStart: "2024-02-05",
        weekEnd: "2024-02-11",
        year: 2024,
        weekOfYear: 6,
        rating: 3.7,
        utilization: 41,
        revenue: 16.8,
      },
      {
        weekStart: "2024-02-12",
        weekEnd: "2024-02-18",
        year: 2024,
        weekOfYear: 7,
        rating: 4.0,
        utilization: 45,
        revenue: 18.3,
      },
      {
        weekStart: "2024-02-19",
        weekEnd: "2024-02-25",
        year: 2024,
        weekOfYear: 8,
        rating: 3.6,
        utilization: 42,
        revenue: 17.2,
      },
    ],
    performance: {
      topRatedChargers: [
        {
          id: 1,
          name: "EcoCharge Networks",
          location: "Toronto, ON",
          rating: 4.5,
          reviews: 156,
          chargerId: "CGXID-001",
          stationName: "Downtown Plaza",
        },
        {
          id: 2,
          name: "GreenEnergy Partners",
          location: "Toronto, ON",
          rating: 4.3,
          reviews: 142,
          chargerId: "CGXID-002",
          stationName: "Mall Central",
        },
        {
          id: 3,
          name: "ChargePlus Corp",
          location: "Toronto, ON",
          rating: 4.2,
          reviews: 138,
          chargerId: "CGXID-003",
          stationName: "Airport North",
        },
        {
          id: 4,
          name: "PowerGrid Pro",
          location: "Toronto, ON",
          rating: 4.1,
          reviews: 125,
          chargerId: "CGXID-004",
          stationName: "Business Park",
        },
        {
          id: 5,
          name: "VoltStream LLC",
          location: "Toronto, ON",
          rating: 4.0,
          reviews: 120,
          chargerId: "CGXID-005",
          stationName: "Shopping Center",
        },
      ],
      lowestRatedChargers: [
        {
          id: 1,
          name: "EcoCharge Networks",
          location: "Toronto, ON",
          rating: 2.4,
          reviews: 89,
          chargerId: "CGXID-006",
          stationName: "Downtown Plaza",
        },
        {
          id: 2,
          name: "GreenEnergy Partners",
          location: "Toronto, ON",
          rating: 3.4,
          reviews: 95,
          chargerId: "CGXID-007",
          stationName: "Mall Central",
        },
        {
          id: 3,
          name: "ChargePlus Corp",
          location: "Toronto, ON",
          rating: 3.5,
          reviews: 98,
          chargerId: "CGXID-008",
          stationName: "Airport North",
        },
        {
          id: 4,
          name: "PowerGrid Pro",
          location: "Toronto, ON",
          rating: 3.7,
          reviews: 102,
          chargerId: "CGXID-009",
          stationName: "Business Park",
        },
        {
          id: 5,
          name: "VoltStream LLC",
          location: "Toronto, ON",
          rating: 3.7,
          reviews: 105,
          chargerId: "CGXID-010",
          stationName: "Shopping Center",
        },
      ],
    },
    regions: [
      {
        id: 1,
        name: "Ontario",
        isoCode: "ON",
        feedbackEntries: 5420,
        rating: 4.5,
        percentage: 34.2,
      },
      {
        id: 2,
        name: "Quebec",
        isoCode: "QC",
        feedbackEntries: 4230,
        rating: 4.3,
        percentage: 26.8,
      },
      {
        id: 3,
        name: "British Columbia",
        isoCode: "BC",
        feedbackEntries: 3150,
        rating: 4.2,
        percentage: 19.9,
      },
      {
        id: 4,
        name: "Alberta",
        isoCode: "AB",
        feedbackEntries: 2890,
        rating: 4.1,
        percentage: 18.3,
      },
      {
        id: 5,
        name: "Manitoba",
        isoCode: "MB",
        feedbackEntries: 1820,
        rating: 4.0,
        percentage: 11.5,
      },
    ],
    feedbackCategories: [
      {
        id: 1,
        category: "Hardware",
        rating: 3.8,
        positive: 145,
        negative: 89,
        total: 234,
      },
      {
        id: 2,
        category: "Payments",
        rating: 4.5,
        positive: 234,
        negative: 45,
        total: 279,
      },
      {
        id: 3,
        category: "User Experience",
        rating: 4.1,
        positive: 198,
        negative: 67,
        total: 265,
      },
      {
        id: 4,
        category: "Pricing",
        rating: 3.6,
        positive: 156,
        negative: 123,
        total: 279,
      },
      {
        id: 5,
        category: "Uptime",
        rating: 4.0,
        positive: 178,
        negative: 78,
        total: 256,
      },
    ],
    chargingStations: [
      {
        id: 1,
        name: "Downtown Plaza",
        location: "Toronto, ON",
        rating: 4.6,
        chargers: 8,
        totalReviews: 624,
        stationId: "STN-001",
      },
      {
        id: 2,
        name: "Mall Central",
        location: "Montreal, QC",
        rating: 4.5,
        chargers: 8,
        totalReviews: 624,
        stationId: "STN-002",
      },
      {
        id: 3,
        name: "Airport North",
        location: "Vancouver, BC",
        rating: 4.4,
        chargers: 8,
        totalReviews: 624,
        stationId: "STN-003",
      },
      {
        id: 4,
        name: "Business Park",
        location: "Calgary, AB",
        rating: 4.3,
        chargers: 8,
        totalReviews: 624,
        stationId: "STN-004",
      },
      {
        id: 5,
        name: "Shopping Center",
        location: "Ottawa, ON",
        rating: 4.2,
        chargers: 8,
        totalReviews: 624,
        stationId: "STN-005",
      },
    ],
    comments: [
      {
        id: 1,
        chargerId: "CGXID-82329X",
        status: "Unresolved",
        rating: 2,
        comment:
          "Charger reboot time is too long when it goes offline & wish downtime alerts were sent as notifications.",
        feedbackTags: ["Failed transaction", "Receipt issue", "Cable length"],
        timestamp: "2024-01-15T10:30:00Z",
        userName: "John Doe",
        userEmail: "john.doe@example.com",
        stationName: "Downtown Plaza",
        stationLocation: "Toronto, ON",
      },
      {
        id: 2,
        chargerId: "CGXID-82329X",
        status: "Resolved",
        rating: 4,
        comment:
          "App interface is clean and easy to navigate & payment through the app is quick and seamless.",
        feedbackTags: ["Fast checkout", "Easy navigation", "Reliable service"],
        timestamp: "2024-01-15T08:45:00Z",
        userName: "Jane Smith",
        userEmail: "jane.smith@example.com",
        stationName: "Mall Central",
        stationLocation: "Montreal, QC",
      },
      {
        id: 3,
        chargerId: "CGXID-82329X",
        status: "Unresolved",
        rating: 2,
        comment: "Sometimes billed extra minutes even after charging stopped.",
        feedbackTags: ["Billing issue", "Overcharge"],
        timestamp: "2024-01-14T16:20:00Z",
        userName: "Mike Johnson",
        userEmail: "mike.johnson@example.com",
        stationName: "Airport North",
        stationLocation: "Vancouver, BC",
      },
      {
        id: 4,
        chargerId: "CGXID-82329X",
        status: "Resolved",
        rating: 4,
        comment:
          "Rates are competitive compared to other charging networks & stations are usually available and reliable.",
        feedbackTags: ["Competitive pricing", "Reliable service"],
        timestamp: "2024-01-14T14:15:00Z",
        userName: "Sarah Wilson",
        userEmail: "sarah.wilson@example.com",
        stationName: "Business Park",
        stationLocation: "Calgary, AB",
      },
      {
        id: 5,
        chargerId: "CGXID-82329X",
        status: "Unresolved",
        rating: 2,
        comment:
          "Cables are too short, difficult to reach my car port & charger overheats if used for long sessions.",
        feedbackTags: ["Cable length", "Hardware issue", "Overheating"],
        timestamp: "2024-01-13T12:30:00Z",
        userName: "David Brown",
        userEmail: "david.brown@example.com",
        stationName: "Shopping Center",
        stationLocation: "Ottawa, ON",
      },
    ],
    insights: {
      positiveInsights: [
        {
          id: 1,
          feedback: "Fast charging speed",
          count: 238,
        },
        {
          id: 2,
          feedback: "Easy to use interface",
          count: 190,
        },
        {
          id: 3,
          feedback: "Great location",
          count: 158,
        },
        {
          id: 4,
          feedback: "Reliable connection",
          count: 123,
        },
        {
          id: 5,
          feedback: "Clean facility",
          count: 85,
        },
      ],
      negativeInsights: [
        {
          id: 1,
          feedback: "Slow charging speed",
          count: 89,
        },
        {
          id: 2,
          feedback: "Payment system issues",
          count: 76,
        },
        {
          id: 3,
          feedback: "Poor app connectivity",
          count: 65,
        },
        {
          id: 4,
          feedback: "High pricing",
          count: 56,
        },
        {
          id: 5,
          feedback: "Hardware malfunction",
          count: 45,
        },
      ],
    },
    pagination: {
      totalPages: 10,
      currentPage: 1,
      totalCount: 15827,
      hasNextPage: true,
      hasPreviousPage: false,
    },
    filters: {
      timeFilter: "All time",
      startDate: null,
      endDate: null,
      location: null,
      evseStationId: null,
      search: "",
    },
    currencySymbol: "C$",
  };
};

// ================ Charger Feedback Analytics: END ===================================

// ===================================================================================

// ================ Revenue Analytics: START ==========================================

const getRevenueAnalyticsDefaultResponse = () => {
  return {
    revenueAnalytics: {
      totalRevenue: getTrendsData({
        isMoney: true,
        value: 0,
        valueTrends: 0,
      }),

      performanceSummary: "",
      revenuePerCharger: {
        value: 0,
        description: "Total Charger(s): 0",
      },
      revenuePerSite: {
        value: 0,
        description: "Total Station(s): 0",
      },
      revenuePerCpo: {
        value: 0,
        description: "Total CPO(s): 0",
      },
      revenuePerSession: {
        value: 0,
        description: "Total Session(s): 0",
      },
      revenuePerKwh: {
        value: 0,
        description: "Total Energy Delivered: 0 Kwh",
      },
      avgSessionDuration: {
        value: 0,
        description: "Total Session Duration: 0 Min.",
      },
    },
  };
};

const getRevenueAnalytics = async (req, res) => {
  try {
    const {
      returnDefaultResponse,
      matchConditions,
      range,
      rangeTrend,
      sqlMatchConditionsRaw,
      rangeRaw,
    } = req.analyticsFilters;

    const defaultResponse = getRevenueAnalyticsDefaultResponse();

    if (returnDefaultResponse === true) {
      return res.status(200).json(defaultResponse);
    }

    const [allAnalytics, allAnalyticsTrends, revenueSplitResult] =
      await Promise.all([
        getAnalyticDataForDashboard({
          ...matchConditions,
          ...range,
        }),
        getAnalyticDataForDashboard({
          ...matchConditions,
          ...rangeTrend,
        }),
        getGrossRevenueSplit(sqlMatchConditionsRaw, rangeRaw),
      ]);

    if (allAnalytics.length === 0) {
      return res.status(200).json(defaultResponse);
    }

    // Extract the first object from the array
    const analyticCounts = allAnalytics[0] || {}; // Return empty object if no data found
    const analyticTrendsCounts = allAnalyticsTrends[0] || {}; // Return empty object if no data found

    let {
      totalRevenue = 0,
      totalChargers = 0,
      totalStations = 0,
      totalEnergyDelivered = 0,
      totalSessionsDuration = 0,
      totalSessions = 0,
      avgRevenuePerChargerPerSession = 0,
    } = analyticCounts;
    let { totalRevenue: totalRevenueTrends = 0 } = analyticTrendsCounts;

    // ======================= totalRevenue ==================================

    defaultResponse["revenueAnalytics"]["totalRevenue"] = getTrendsData({
      isMoney: true,
      value: totalRevenue,
      valueTrends: totalRevenueTrends,
    });

    const totalRevenueDifference = totalRevenue - totalRevenueTrends;

    defaultResponse["revenueAnalytics"]["performanceSummary"] =
      totalRevenueDifference >= 0
        ? "Strong and steady growth across all key metrics, reflecting solid overall progress and positive momentum."
        : "A slowdown across key metrics this period, reflecting challenges that need attention to regain momentum.";
    // ========================================================================

    // ======================= totalRevenue ==================================
    defaultResponse["revenueAnalytics"]["revenuePerCharger"]["value"] =
      parseFloat(
        Number(
          totalRevenue > 0 && totalChargers > 0
            ? totalRevenue / totalChargers
            : 0
        )
      ).toFixed(2);
    defaultResponse["revenueAnalytics"]["revenuePerCharger"][
      "description"
    ] = `Total Charger(s): ${totalChargers ?? 0}`;
    // ========================================================================

    // ======================= revenuePerSite ==================================
    defaultResponse["revenueAnalytics"]["revenuePerSite"]["value"] = parseFloat(
      Number(
        totalRevenue > 0 && totalStations > 0 ? totalRevenue / totalStations : 0
      )
    ).toFixed(2);
    defaultResponse["revenueAnalytics"]["revenuePerSite"][
      "description"
    ] = `Total Station(s): ${totalStations ?? 0}`;
    // ========================================================================

    // ======================= revenuePerSession ==================================
    defaultResponse["revenueAnalytics"]["revenuePerSession"]["value"] =
      parseFloat(Number(avgRevenuePerChargerPerSession)).toFixed(2);
    defaultResponse["revenueAnalytics"]["revenuePerSession"][
      "description"
    ] = `Total Session(s): ${totalSessions ?? 0}`;
    // ========================================================================

    // ======================= revenuePerKwh ==================================
    defaultResponse["revenueAnalytics"]["revenuePerKwh"]["value"] = parseFloat(
      Number(
        totalRevenue > 0 && totalEnergyDelivered > 0
          ? totalRevenue / totalEnergyDelivered
          : 0
      )
    ).toFixed(2);
    defaultResponse["revenueAnalytics"]["revenuePerKwh"][
      "description"
    ] = `Total Energy Delivered: ${parseFloat(
      totalEnergyDelivered ?? 0
    ).toFixed(2)} Kwh`;
    // ========================================================================

    // ======================= avgSessionDuration ==================================
    defaultResponse["revenueAnalytics"]["avgSessionDuration"]["value"] =
      parseFloat(
        Number(
          totalSessionsDuration > 0 && totalSessions > 0
            ? (totalSessionsDuration * 60) / totalSessions
            : 0
        )
      ).toFixed(2);
    defaultResponse["revenueAnalytics"]["avgSessionDuration"][
      "description"
    ] = `Total Session Duration: ${parseFloat(
      Number(Number(totalSessionsDuration ?? 0) * 60)
    ).toFixed(2)} Min.`;
    // ========================================================================

    // ======================= revenuePerCpo ==================================
    defaultResponse["revenueAnalytics"]["revenuePerCpo"]["value"] = parseFloat(
      revenueSplitResult?.cpoAmount > 0
        ? Number(revenueSplitResult?.cpoAmount ?? 0) /
            Number(revenueSplitResult?.cpoCount ?? 1)
        : 0.0
    ).toFixed(2);
    defaultResponse["revenueAnalytics"]["revenuePerCpo"][
      "description"
    ] = `Total CPO(s): ${revenueSplitResult?.cpoCount ?? 0}`;
    // ========================================================================

    return res.status(200).json(defaultResponse);
  } catch (error) {
    console.error("Error getting revenue analytics:", error);
    res.status(500).json({
      message: "Failed to get revenue analytics",
      error: error.message,
    });
  }
};

const getRevPayoutDistributionDefaultResponse = () => {
  return {
    period: "Weekly",
    revenuePayoutDistribution: {
      cpo: {
        amount: 0,
        splitPercentage: 0.0,
        percentage: 0.0,
        growth: "0.00%",
        isPositive: true,
        isDangerous: false,
      },
      siteHost: {
        amount: 0,
        splitPercentage: 0.0,
        percentage: 0.0,
        growth: "0.00%",
        isPositive: true,
        isDangerous: false,
      },
      investor: {
        amount: 0,
        splitPercentage: 0.0,
        percentage: 0.0,
        growth: "0.00%",
        isPositive: true,
        isDangerous: false,
      },
    },
    totalPayoutAmount: 0,
    dateRange: {},
  };
};

const getRevenuePayoutDistribution = async (req, res) => {
  try {
    const { period } = req.query;

    const {
      returnDefaultResponse,
      location,
      emspSettingId,
      evseStationId,
      currentMonthRange,
      currentWeekRange,
      previousMonthRange,
      previousWeekRange,
      partnerContractIds,
    } = req.analyticsFilters;

    const defaultResponse = getRevPayoutDistributionDefaultResponse();

    if (returnDefaultResponse === true) {
      return res.status(200).json(defaultResponse);
    }

    let { revenuePayoutDistribution } = defaultResponse;

    const baseWhere2 = {};
    if (location) {
      baseWhere2["country"] = location;
    }
    if (evseStationId) {
      baseWhere2["evseStationId"] = evseStationId;
    }
    if (partnerContractIds?.length > 0) {
      baseWhere2["contractIds"] = partnerContractIds;
    }

    // Validate period parameter
    if (!period || !["Weekly", "Monthly"].includes(period)) {
      return res.status(400).json({
        message: "Invalid period parameter. Must be 'Weekly' or 'Monthly'",
      });
    }

    let dateRanges = {};
    if (period == "Weekly") {
      dateRanges = {
        current: currentWeekRange,
        previous: previousWeekRange,
      };
    } else {
      dateRanges = {
        current: currentMonthRange,
        previous: previousMonthRange,
      };
    }

    defaultResponse["dateRange"] = dateRanges;
    defaultResponse["period"] = period;

    const [partnersData, partnersDataTrend] = await Promise.all([
      getPartnersData(baseWhere2, dateRanges?.current),
      getPartnersData(baseWhere2, dateRanges?.previous),
    ]);

    defaultResponse["totalPayoutAmount"] = partnersData?.totalAmount ?? 0;

    // ======================= totalCpoRev ==================================
    let totalCpoRevDifference = growthPercentage(
      partnersDataTrend["cpoAmount"],
      partnersData["cpoAmount"]
    );
    totalCpoRevDifference = parseFloat(totalCpoRevDifference ?? 0).toFixed(2);

    const totalCpoRevDifferenceText =
      totalCpoRevDifference >= 0
        ? `+${totalCpoRevDifference}%`
        : `-${Math.abs(totalCpoRevDifference)}%`;

    revenuePayoutDistribution["cpo"]["amount"] = partnersData["cpoAmount"];
    revenuePayoutDistribution["cpo"]["splitPercentage"] =
      partnersData["cpoPercentage"];
    revenuePayoutDistribution["cpo"]["percentage"] =
      partnersData["cpoPercentage"];
    revenuePayoutDistribution["cpo"]["growth"] = totalCpoRevDifferenceText;
    revenuePayoutDistribution["cpo"]["isPositive"] = totalCpoRevDifference >= 0;
    revenuePayoutDistribution["cpo"]["isDangerous"] = totalCpoRevDifference < 0;
    // ========================================================================

    // ======================= totalSiteHostRev ==================================

    const totalSiteHostRevDifference = growthPercentage(
      partnersDataTrend["siteHostAmount"],
      partnersData["siteHostAmount"]
    );

    const totalSiteHostRevDifferenceText =
      totalSiteHostRevDifference >= 0
        ? `+${totalSiteHostRevDifference}%`
        : `-${Math.abs(totalSiteHostRevDifference)}%`;

    revenuePayoutDistribution["siteHost"]["amount"] =
      partnersData["siteHostAmount"];
    revenuePayoutDistribution["siteHost"]["splitPercentage"] =
      partnersData["siteHostPercentage"];
    revenuePayoutDistribution["siteHost"]["percentage"] =
      partnersData["siteHostPercentage"];
    revenuePayoutDistribution["siteHost"]["growth"] =
      totalSiteHostRevDifferenceText;
    revenuePayoutDistribution["siteHost"]["isPositive"] =
      totalSiteHostRevDifference >= 0;
    revenuePayoutDistribution["siteHost"]["isDangerous"] =
      totalSiteHostRevDifference < 0;
    // ========================================================================

    // ======================= totalInvestorRev ==================================

    const totalInvestorRevDifference = growthPercentage(
      partnersDataTrend["investorAmount"],
      partnersData["investorAmount"]
    );

    const totalInvestorRevDifferenceText =
      totalInvestorRevDifference >= 0
        ? `+${totalInvestorRevDifference}%`
        : `-${Math.abs(totalInvestorRevDifference)}%`;

    revenuePayoutDistribution["investor"]["amount"] =
      partnersData["investorAmount"];
    revenuePayoutDistribution["investor"]["splitPercentage"] =
      partnersData["investorPercentage"];
    revenuePayoutDistribution["investor"]["percentage"] =
      partnersData["investorPercentage"];
    revenuePayoutDistribution["investor"]["growth"] =
      totalInvestorRevDifferenceText;
    revenuePayoutDistribution["investor"]["isPositive"] =
      totalInvestorRevDifference >= 0;
    revenuePayoutDistribution["investor"]["isDangerous"] =
      totalInvestorRevDifference < 0;
    // ========================================================================

    defaultResponse["revenuePayoutDistribution"] = revenuePayoutDistribution;
    return res.status(200).json(defaultResponse);
  } catch (error) {
    console.error("Error getting revenue payout distribution:", error);
    res.status(500).json({
      message: "Failed to get revenue payout distribution",
      error: error.message,
    });
  }
};

// ================ Revenue Analytics: END ===========================================

// ===================================================================================

// ================ Partner Analytics: START ==========================================

const getPartnerAnalyticsDefaultResponse = () => {
  return {
    overview: {
      totalPartners: getTrendsData({
        value: 0,
        valueTrends: 0,
      }),
      newPartnersOnboarded: getTrendsData({
        value: 0,
        valueTrends: 0,
      }),
      activeVsInactivePartners: {
        value: "0 / 0",
        ...getTrendsData({
          value: 0,
          valueTrends: 0,
        }),
      },
    },
    topPartnersByUtilization: [],
    topPartnersByRevenue: [],
    lowPartnersByUtilization: [],
    lowPartnersByRevenue: [],
    partnerSplit: {
      totalPartners: 0,
      data: [
        {
          name: "CPO",
          value: 0,
          percentage: 0,
        },
        {
          name: "Site Host",
          value: 0,
          percentage: 0,
        },
        {
          name: "Investor",
          value: 0,
          percentage: 0,
        },
      ],
    },

    totalCpo: getTrendsData({
      value: 0,
      valueTrends: 0,
    }),
    totalCpoRevenue: getTrendsData({
      isMoney: true,
      value: 0,
      valueTrends: 0,
    }),
    totalCpoRevenuePending: getTrendsData({
      isMoney: true,
      value: 0,
      valueTrends: 0,
    }),

    totalSiteHost: getTrendsData({
      value: 0,
      valueTrends: 0,
    }),
    totalSiteHostRevenue: getTrendsData({
      isMoney: true,
      value: 0,
      valueTrends: 0,
    }),
    totalSiteHostRevenuePending: getTrendsData({
      isMoney: true,
      value: 0,
      valueTrends: 0,
    }),

    totalInvestor: getTrendsData({
      value: 0,
      valueTrends: 0,
    }),
    totalInvestorRevenue: getTrendsData({
      isMoney: true,
      value: 0,
      valueTrends: 0,
    }),
    totalInvestorRevenuePending: getTrendsData({
      isMoney: true,
      value: 0,
      valueTrends: 0,
    }),
  };
};

const getPartnerOverview = async (where, rangeRaw) => {
  const returnData = {
    total: 0,
    active: 0,
    inactive: 0,
    onboarded: 0,
  };
  try {
    const baseWhere = {
      ...where,
      createdAt: Between(rangeRaw.start, rangeRaw.end),
    };

    const onboardedAtRange = { 
          start: DateTime.now().minus({ months: 1 }).toJSDate(), 
          end: DateTime.now().toJSDate() 
        };

    const [totalPartners, totalActivePartners, totalOnboardedPartners] =
      await Promise.all([
        UserRepository.count({ where: baseWhere }),
        UserRepository.count({ where: { ...baseWhere, status: "ACTIVE" } }),
        UserRepository.count({
          where: {
            ...baseWhere,
            onboardedAt: Between(onboardedAtRange.start, onboardedAtRange.end),
          },
        }),
      ]);

    returnData.total = totalPartners;
    returnData.active = totalActivePartners;
    returnData.inactive = totalPartners - totalActivePartners;
    returnData.onboarded = totalOnboardedPartners;
  } catch (error) {}

  return returnData;
};

const getTopLowPartners = async (baseWhere, rangeRaw) => {
  try {
    const whereClauses = [];

    if (baseWhere.country) {
      whereClauses.push(`r.country = '${baseWhere.country}'`);
    }

    if (rangeRaw?.start && rangeRaw?.end) {
      const start = rangeRaw.start.toISOString().slice(0, 19).replace("T", " ");
      const end = rangeRaw.end.toISOString().slice(0, 19).replace("T", " ");
      whereClauses.push(`r.dateTime BETWEEN '${start}' AND '${end}'`);
    }

    // Combine filters dynamically
    const whereSQL = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    const getUnionQuery = (id, amount, settlementField, whereSQL) => {
      return `SELECT ${id} AS partnerId, ${amount} AS totalAmount, r.country, r.dateTime, r.${settlementField} AS isSettled FROM charger_revenue r ${whereSQL}`;
    };

    let unionQuery = `
        ${getUnionQuery("cpoId", "cpoAmount", "isSettledForCpo", whereSQL)}
        UNION ALL
        ${getUnionQuery(
          "siteHostId",
          "siteHostAmount",
          "isSettledForSiteHost",
          whereSQL
        )}
        UNION ALL
        ${getUnionQuery(
          "investor1Id",
          "investor1Amount",
          "isSettledForInvestor1",
          whereSQL
        )}
        UNION ALL
        ${getUnionQuery(
          "investor2Id",
          "investor2Amount",
          "isSettledForInvestor2",
          whereSQL
        )}
      `;

    if (baseWhere?.partnerType) {
      if (baseWhere?.partnerType == "Cpo") {
        unionQuery = `
          ${getUnionQuery("cpoId", "cpoAmount", "isSettledForCpo", whereSQL)}
        `;
      } else if (baseWhere?.partnerType == "Site Host") {
        unionQuery = `
          ${getUnionQuery(
            "siteHostId",
            "siteHostAmount",
            "isSettledForSiteHost",
            whereSQL
          )}
        `;
      } else if (baseWhere?.partnerType == "Investor") {
        unionQuery = `
          ${getUnionQuery(
            "investor1Id",
            "investor1Amount",
            "isSettledForInvestor1",
            whereSQL
          )}
          UNION ALL
          ${getUnionQuery(
            "investor2Id",
            "investor2Amount",
            "isSettledForInvestor2",
            whereSQL
          )}
        `;
      }
    }

    const sql = `
      WITH revenue_union AS (${unionQuery})
      SELECT 
        p.id AS partnerId,
        p.fullName AS title,
        p.fullName AS partnerName,
        COALESCE(SUM(ru.totalAmount), 0) AS revenue,
        COALESCE(SUM(ru.totalAmount), 0) AS totalRevenueSum,
        COALESCE(SUM(CASE WHEN ru.isSettled = 0 OR ru.isSettled IS NULL THEN ru.totalAmount ELSE 0 END), 0) AS pendingRevenue,
        CASE 
          WHEN SUM(CASE WHEN ru.isSettled = 0 OR ru.isSettled IS NULL THEN 1 ELSE 0 END) > 0 
            THEN 'Pending'
          ELSE 'Completed'
        END AS settlementStatus
      FROM user p
      JOIN revenue_union ru ON p.id = ru.partnerId
      WHERE p.isPartner=1
      GROUP BY p.id, p.fullName
    `;

    const [topPartners, lowPartners] = await Promise.all([
      ChargerRevenueRepository.query(
        `${sql} ORDER BY totalRevenueSum DESC LIMIT 5;`
      ),
      ChargerRevenueRepository.query(
        `${sql} ORDER BY totalRevenueSum ASC LIMIT 5;`
      ),
    ]);

    return { topPartners, lowPartners };
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error:", error);
    console.log("🚀 -----------------🚀");
  }

  return { topPartners: [], lowPartners: [] };
};

const getPartnersData = async (where, rangeRaw) => {
  const whereClauses = [];

  if (where?.country) {
    whereClauses.push(`r.country = '${where.country}'`);
  }

  if (where?.evseStationId) {
    whereClauses.push(`r.evseStationId = '${where.evseStationId}'`);
  }

  if (where?.contractIds?.length > 0) {
    const cIds = where?.contractIds?.join("','");
    whereClauses.push(`r.contractId IN ('${cIds}')`);
  }

  if (rangeRaw?.start && rangeRaw?.end) {
    const start = rangeRaw.start.toISOString().slice(0, 19).replace("T", " ");
    const end = rangeRaw.end.toISOString().slice(0, 19).replace("T", " ");
    whereClauses.push(`r.dateTime BETWEEN '${start}' AND '${end}'`);
  }

  // Combine filters dynamically
  const whereSQL = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  const getQuery = (type, typeCnt, settlementField, whereSQL) => {
    return `SELECT
              SUM(r.${type}) AS totalAmount,
              SUM(CASE WHEN r.${settlementField} = 0 THEN r.${type} ELSE 0 END) AS pendingAmount,
              COUNT(DISTINCT(r.${typeCnt})) as cnt 
            FROM charger_revenue r ${whereSQL}`;
  };

  let [
    [
      {
        totalAmount: cpoAmount,
        cnt: cpoCount,
        pendingAmount: cpoPendingAmount,
      },
    ],
    [
      {
        totalAmount: siteHostAmount,
        cnt: siteHostCount,
        pendingAmount: siteHostPendingAmount,
      },
    ],
    [
      {
        totalAmount: investor1Amount,
        cnt: investor1Count,
        pendingAmount: investor1PendingAmount,
      },
    ],
    [
      {
        totalAmount: investor2Amount,
        cnt: investor2Count,
        pendingAmount: investor2PendingAmount,
      },
    ],
  ] = await Promise.all([
    ChargerRevenueRepository.query(
      getQuery("cpoAmount", "cpoId", "isSettledForCpo", whereSQL)
    ),
    ChargerRevenueRepository.query(
      getQuery("siteHostAmount", "siteHostId", "isSettledForSiteHost", whereSQL)
    ),
    ChargerRevenueRepository.query(
      getQuery(
        "investor1Amount",
        "investor1Id",
        "isSettledForInvestor1",
        whereSQL
      )
    ),
    ChargerRevenueRepository.query(
      getQuery(
        "investor2Amount",
        "investor2Id",
        "isSettledForInvestor2",
        whereSQL
      )
    ),
  ]);

  cpoAmount = Number(cpoAmount ?? 0);
  siteHostAmount = Number(siteHostAmount ?? 0);
  investor1Amount = Number(investor1Amount ?? 0);
  investor2Amount = Number(investor2Amount ?? 0);

  cpoCount = Number(cpoCount ?? 0);
  siteHostCount = Number(siteHostCount ?? 0);
  investor1Count = Number(investor1Count ?? 0);
  investor2Count = Number(investor2Count ?? 0);

  cpoPendingAmount = Number(cpoPendingAmount ?? 0);
  siteHostPendingAmount = Number(siteHostPendingAmount ?? 0);
  investor1PendingAmount = Number(investor1PendingAmount ?? 0);
  investor2PendingAmount = Number(investor2PendingAmount ?? 0);

  const investorAmount = investor1Amount + investor2Amount;
  const investorPendingAmount = investor1PendingAmount + investor2PendingAmount;
  const tmpTotal = cpoAmount + siteHostAmount + investorAmount;

  const cpoPercentage =
    cpoAmount > 0 && tmpTotal > 0
      ? parseFloat((cpoAmount * 100) / tmpTotal).toFixed(2)
      : 0;
  const siteHostPercentage =
    siteHostAmount > 0 && tmpTotal > 0
      ? parseFloat((siteHostAmount * 100) / tmpTotal).toFixed(2)
      : 0;
  const investorPercentage =
    investorAmount > 0 && tmpTotal > 0
      ? parseFloat((investorAmount * 100) / tmpTotal).toFixed(2)
      : 0;

  return {
    cpoAmount,
    siteHostAmount,
    investorAmount,

    cpoCount,
    siteHostCount,
    investorCount: investor1Count + investor2Count,

    cpoPendingAmount,
    siteHostPendingAmount,
    investorPendingAmount,

    cpoPercentage: Number(cpoPercentage ?? 0),
    siteHostPercentage: Number(siteHostPercentage ?? 0),
    investorPercentage: Number(investorPercentage ?? 0),

    totalAmount: tmpTotal,
  };
};

const getPartnerAnalytics = async (req, res) => {
  try {
    const {
      returnDefaultResponse,
      rangeRaw,
      rangeRawTrend,
      location,
      partnerType,
      emspSettingId,
    } = req.analyticsFilters;

    const defaultResponse = getPartnerAnalyticsDefaultResponse();

    if (returnDefaultResponse === true) {
      return res.status(200).json(defaultResponse);
    }

    const baseWhere = {
      isPartner: true,
      isDeleted: false,
    };

    const baseWhere2 = {};

    const baseWherePartners = {};
    if (location) {
      baseWhere["country"] = location;
      baseWherePartners["country"] = location;
      baseWhere2["country"] = location;
    }
    if (partnerType) {
      baseWherePartners["partnerType"] = partnerType;
    }

    const [
      partnerOverview,
      partnerOverviewTrend,
      topLowPartners,
      partnersData,
      partnersDataTrend,
    ] = await Promise.all([
      getPartnerOverview(baseWhere, rangeRaw),
      getPartnerOverview(baseWhere, rangeRawTrend),
      getTopLowPartners(baseWherePartners, rangeRaw),
      getPartnersData(baseWhere2, rangeRaw),
      getPartnersData(baseWhere2, rangeRawTrend),
    ]);

    // ======================= totalCpo ==================================
    defaultResponse["totalCpo"] = getTrendsData({
      value: partnersData["cpoCount"],
      valueTrends: partnersDataTrend["cpoCount"],
    });
    // ========================================================================

    // ======================= totalCpoRev ==================================
    defaultResponse["totalCpoRevenue"] = getTrendsData({
      isMoney: true,
      value: partnersData["cpoAmount"],
      valueTrends: partnersDataTrend["cpoAmount"],
    });
    // ========================================================================

    // ======================= totalCpoPendingRev ==================================
    defaultResponse["totalCpoRevenuePending"] = getTrendsData({
      isMoney: true,
      value: partnersData["cpoPendingAmount"],
      valueTrends: partnersDataTrend["cpoPendingAmount"],
    });
    // ========================================================================

    // ======================= totalSiteHost ==================================
    defaultResponse["totalSiteHost"] = getTrendsData({
      value: partnersData["siteHostCount"],
      valueTrends: partnersDataTrend["siteHostCount"],
    });
    // ========================================================================

    // ======================= totalSiteHostRev ==================================
    defaultResponse["totalSiteHostRevenue"] = getTrendsData({
      isMoney: true,
      value: partnersData["siteHostAmount"],
      valueTrends: partnersDataTrend["siteHostAmount"],
    });
    // ========================================================================

    // ======================= totalSiteHostPendingRev ==================================
    defaultResponse["totalSiteHostRevenuePending"] = getTrendsData({
      isMoney: true,
      value: partnersData["siteHostPendingAmount"],
      valueTrends: partnersDataTrend["siteHostPendingAmount"],
    });
    // ========================================================================

    // ======================= totalInvestor ==================================
    defaultResponse["totalInvestor"] = getTrendsData({
      value: partnersData["investorCount"],
      valueTrends: partnersDataTrend["investorCount"],
    });
    // ========================================================================

    // ======================= totalInvestorRev ==================================
    defaultResponse["totalInvestorRevenue"] = getTrendsData({
      isMoney: true,
      value: partnersData["investorAmount"],
      valueTrends: partnersDataTrend["investorAmount"],
    });
    // ========================================================================

    // ======================= totalInvestorPendingRev ==================================
    defaultResponse["totalInvestorRevenuePending"] = getTrendsData({
      isMoney: true,
      value: partnersData["investorPendingAmount"],
      valueTrends: partnersDataTrend["investorPendingAmount"],
    });
    // ========================================================================

    // ======================= totalPartners ==================================
    defaultResponse["overview"]["totalPartners"] = getTrendsData({
      value: partnerOverview["total"],
      valueTrends: partnerOverviewTrend["total"],
    });
    // ========================================================================

    // ======================= newPartnersOnboarded ==================================
    defaultResponse["overview"]["newPartnersOnboarded"] = getTrendsData({
      value: partnerOverview["onboarded"],
      valueTrends: partnerOverviewTrend["onboarded"],
    });
    // ========================================================================

    // ======================= activeVsInactivePartners ==================================
    defaultResponse["overview"]["activeVsInactivePartners"] = getTrendsData({
      value: partnerOverview["active"],
      valueTrends: partnerOverviewTrend["active"],
    });

    defaultResponse["overview"]["activeVsInactivePartners"][
      "value"
    ] = `${partnerOverview["active"]}/${partnerOverview["inactive"]}`;

    // ========================================================================

    defaultResponse["topPartnersByRevenue"] = topLowPartners["topPartners"];
    defaultResponse["lowPartnersByRevenue"] = topLowPartners["lowPartners"];

    return res.status(200).json(defaultResponse);
  } catch (error) {
    console.error("Error getting partner analytics:", error);
    res.status(500).json({
      message: "Failed to get partner analytics",
      error: error.message,
    });
  }
};

const getTopPartnerRevList = async (req, res, filterType = "Cpo") => {
  try {
    const { location, currentMonthRange, currentWeekRange } =
      req.analyticsFilters;

    const baseWherePartners = {};
    if (location) {
      baseWherePartners["country"] = location;
    }
    baseWherePartners["partnerType"] = filterType;

    const [
      { topPartners: top5MonthlyRevenue },
      { topPartners: top5WeeklyRevenue },
    ] = await Promise.all([
      getTopLowPartners(baseWherePartners, currentMonthRange),
      getTopLowPartners(baseWherePartners, currentWeekRange),
    ]);

    const response = {
      top5MonthlyUtilization: [],
      top5WeeklyUtilization: [],

      top5MonthlyRevenue,
      top5WeeklyRevenue,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error getting top CPO analytics:", error);
    res.status(500).json({
      message: "Failed to get top CPO analytics",
      error: error.message,
    });
  }
};

// ================ Partner Analytics: END ==========================================

module.exports = {
  chargerAnalytics,
  getChargerFeedbackAnalytics,
  getRevenueAnalytics,
  getRevenuePayoutDistribution,
  getPartnerAnalytics,
  getTopPartnerRevList,
};
