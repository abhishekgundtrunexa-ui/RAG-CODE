const { In } = require("typeorm");
const {
  EvseStationRepository,
  ChargerRevenueRepository,
  UserRepository,
} = require("@shared-libs/db/mysql");
const { AnalyticsModel } = require("@shared-libs/db/mongo-db");
const {
  getChargersOverview,
  arrayObjStr,
  getAnalyticDataForDashboard,
  getTrendsData,
} = require("@shared-libs/helpers");
const {
  weeklyAnalytics,
  monthlyAnalytics,
} = require("./dashboard-analytics-helpers");
const { getAnalyticsFromDate } = require("@shared-libs/analytics-helper");

const getDefaultResponse = () => {
  return {
    utilizationChartData: {
      globalRate: getTrendsData({
        isMoney: true,
        value: 0,
        valueTrends: 0,
      }),
      monthlyData: [],
    },
    totalRevenue: getTrendsData({
      currency: "$",
      isMoney: true,
      value: 0,
      valueTrends: 0,
    }),
    totalSessions: getTrendsData({
      value: 0,
      valueTrends: 0,
    }),
    avgDailySessions: getTrendsData({
      isMoney: true,
      value: 0,
      valueTrends: 0,
    }),
    totalEnergyDelivered: getTrendsData({
      isMoney: true,
      suffix: "kWh",
      value: 0,
      valueTrends: 0,
    }),
    avgDailySessionsCount: getTrendsData({
      isMoney: true,
      value: 0,
      valueTrends: 0,
    }),
    avgEnergyPerSession: getTrendsData({
      isMoney: true,
      suffix: "kWh",
      value: 0,
      valueTrends: 0,
    }),
    avgChargingRate: getTrendsData({
      isMoney: true,
      suffix: "kWh",
      value: 0,
      valueTrends: 0,
    }),
    totalChargers: {
      value: 0,
      comparison: "Total Chargers",
      isPositive: true,
    },
    availableChargers: {
      value: 0,
      comparison: "Available Chargers",
      isPositive: true,
    },
    inUseChargers: {
      value: 0,
      comparison: "In use Chargers",
      isPositive: true,
    },
    errorChargers: {
      value: 0,
      comparison: "Errored Chargers",
      isPositive: true,
    },
    offlineChargers: {
      value: 0,
      comparison: "Offline Chargers",
      isPositive: true,
    },
    globalUtilizationRate: getTrendsData({
      isMoney: true,
      value: 0,
      valueTrends: 0,
    }),
    monthlyRevenues: [],
    weeklyRevenues: [],
    monthlyEnergyConsumed: [],
    weeklyEnergyConsumed: [],
    sessionCounts: [],
    avgSessionCountPerCharger: 0,
    avgSessionDurationPerCharger: 0,
    avgSessionDurations: [],
    topChargingStationByRevenue: [],
    topChargingStationByUtilizationRate: [],
    topCposByRevenue: [],
    topCposByUtilizationRate: [],
    currencySymbol: "$",
  };
};

const getTopEvseStationData = async (matchConditions, range) => {
  const [topRevenue, topUtilization] = await Promise.all([
    AnalyticsModel.aggregate([
      { $match: { ...matchConditions, ...range } },
      {
        $group: {
          _id: `$evseStationId`,
          total: { $sum: { $ifNull: [`$totalRevenue`, 0] } },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
    AnalyticsModel.aggregate([
      { $match: { ...matchConditions, ...range } },
      {
        $group: {
          _id: `$evseStationId`,
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
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const siteIdsRevenue = topRevenue.map(({ _id }) => {
    return _id;
  });
  const siteIdsUtilization = topUtilization.map(({ _id }) => {
    return _id;
  });

  const [siteInfoRevenue = [], siteInfoUtilization = []] = await Promise.all([
    EvseStationRepository.find({
      where: { id: In(siteIdsRevenue) },
    }),
    EvseStationRepository.find({
      where: { id: In(siteIdsUtilization) },
    }),
  ]);

  const topChargingStationByRevenue = topRevenue.map(({ _id, total }) => {
    const { id, ...all } = siteInfoRevenue.find((site) => site.id === _id);

    return {
      siteId: id,
      ...all,
      totalRevenue: parseFloat(total ?? 0).toFixed(2),
    };
  });

  const topChargingStationByUtilizationRate = topUtilization.map(
    ({ _id, total }) => {
      const { id, ...all } = siteInfoUtilization.find(
        (site) => site.id === _id
      );

      return {
        siteId: id,
        ...all,
        utilizationRate: parseFloat(total ?? 0).toFixed(2),
      };
    }
  );

  return { topChargingStationByRevenue, topChargingStationByUtilizationRate };
};

const getTopPartners = async (sqlMatchConditions, range) => {
  const chargerRev = await ChargerRevenueRepository.find({
    where: {
      ...sqlMatchConditions,
      ...range,
    },
  });

  let pDataTotals = {};

  for (const rev of chargerRev) {
    if (rev?.cpoId) {
      pDataTotals[rev?.cpoId] = pDataTotals[rev?.cpoId] ?? 0;
      pDataTotals[rev?.cpoId] += Number(rev?.cpoAmount ?? 0);
    }
    if (rev?.siteHostId) {
      pDataTotals[rev?.siteHostId] = pDataTotals[rev?.siteHostId] ?? 0;
      pDataTotals[rev?.siteHostId] += Number(rev?.siteHostAmount ?? 0);
    }
    if (rev?.investor1Id) {
      pDataTotals[rev?.investor1Id] = pDataTotals[rev?.investor1Id] ?? 0;
      pDataTotals[rev?.investor1Id] += Number(rev?.investor1Amount ?? 0);
    }
    if (rev?.investor2Id) {
      pDataTotals[rev?.investor2Id] = pDataTotals[rev?.investor2Id] ?? 0;
      pDataTotals[rev?.investor2Id] += Number(rev?.investor2Amount ?? 0);
    }
  }

  const top5 = Object.fromEntries(
    Object.entries(pDataTotals)
      .sort((a, b) => b[1] - a[1]) // sort descending
      .slice(0, 5) // take top 5
  );

  const partnerIds = Object.keys(top5);

  if (partnerIds?.length > 0) {
    const partners = await UserRepository.find({
      where: { id: In(partnerIds) },
      select: ["fullName", "id"],
    });

    const partnersData = arrayObjStr(partners, "id", "fullName");

    const result = Object.entries(top5).map(([key, value]) => ({
      name: partnersData[key] ?? "",
      totalRevenue: parseFloat(value ?? 0).toFixed(2),
    }));

    return result;
  }

  return [];
};

const getDashboardAnalytics = async (req, res) => {
  // const todayDate = DateTime.utc().toFormat("yyyy-MM-dd");
  // await getAnalyticsFromDate(todayDate);

  const {
    returnDefaultResponse,
    matchConditions,
    sqlMatchConditions,
    range,
    rangeSql,
    rangeTrend,
  } = req.analyticsFilters;

  const defaultResponse = getDefaultResponse();

  if (returnDefaultResponse === true) {
    return res.status(200).json(defaultResponse);
  }

  try {
    const [
      allAnalytics,
      allAnalyticsTrends,
      chargersOverview,
      topEvseStationData,
      topPartnerData,
      weekData,
      monthData,
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

      getTopEvseStationData(matchConditions, range),
      getTopPartners(sqlMatchConditions, rangeSql),

      weeklyAnalytics(matchConditions, {}),
      monthlyAnalytics(matchConditions, {}),
    ]);

    if (allAnalytics.length === 0) {
      return res.status(200).json(defaultResponse);
    }

    // Extract the first object from the array
    const analyticCounts = allAnalytics[0] || {}; // Return empty object if no data found
    const analyticTrendsCounts = allAnalyticsTrends[0] || {}; // Return empty object if no data found

    let {
      globalUtilizationRate = 0,
      totalRevenue = 0,
      totalSessions = 0,
      totalEnergyDelivered = 0,
      totalSessionsDuration = 0,
      uniqueDateCount = 1,
    } = analyticCounts;
    let {
      globalUtilizationRate: globalUtilizationRateTrends = 0,
      totalRevenue: totalRevenueTrends = 0,
      totalSessions: totalSessionsTrends = 0,
      totalEnergyDelivered: totalEnergyDeliveredTrends = 0,
      totalSessionsDuration: totalSessionsDurationTrends = 0,
      uniqueDateCount: uniqueDateCountTrends = 1,
    } = analyticTrendsCounts;
    let {
      totalCount: totalChargers = 0,
      available: availableChargers = 0,
      "in-use": inUseChargers = 0,
      error: errorChargers = 0,
      offline: offlineChargers = 0,
    } = chargersOverview;

    let avgDailySessions =
      totalSessions > 0 ? totalSessions / uniqueDateCount : 0;
    let avgDailySessionsTrends =
      totalSessionsTrends > 0 ? totalSessionsTrends / uniqueDateCountTrends : 0;

    let avgEnergyPerSession =
      totalEnergyDelivered > 0 ? totalEnergyDelivered / totalSessions : 0;
    let avgEnergyPerSessionTrends =
      totalEnergyDeliveredTrends > 0
        ? totalEnergyDeliveredTrends / totalSessionsTrends
        : 0;

    let avgChargingRate =
      totalEnergyDelivered > 0
        ? totalEnergyDelivered / totalSessionsDuration
        : 0;
    let avgChargingRateTrends =
      totalEnergyDeliveredTrends > 0
        ? totalEnergyDeliveredTrends / totalSessionsDurationTrends
        : 0;

    // ======================= totalRevenue ==================================
    defaultResponse["totalRevenue"] = getTrendsData({
      currency: "$",
      isMoney: true,
      value: totalRevenue,
      valueTrends: totalRevenueTrends,
    });
    // ========================================================================

    // ======================= totalSessions ==================================
    defaultResponse["totalSessions"] = getTrendsData({
      value: totalSessions,
      valueTrends: totalSessionsTrends,
    });
    // ========================================================================

    // ======================= totalEnergyDelivered ==================================
    defaultResponse["totalEnergyDelivered"] = getTrendsData({
      isMoney: true,
      suffix: "kWh",
      value: totalEnergyDelivered,
      valueTrends: totalEnergyDeliveredTrends,
    });
    // ========================================================================

    // ======================= avgDailySessions ==================================
    defaultResponse["avgDailySessions"] = getTrendsData({
      isMoney: true,
      value: avgDailySessions,
      valueTrends: avgDailySessionsTrends,
    });
    defaultResponse["avgDailySessionsCount"] = getTrendsData({
      isMoney: true,
      value: avgDailySessions,
      valueTrends: avgDailySessionsTrends,
    });
    // ========================================================================

    // ======================= avgEnergyPerSession ==================================
    defaultResponse["avgEnergyPerSession"] = getTrendsData({
      isMoney: true,
      suffix: "kWh",
      value: avgEnergyPerSession,
      valueTrends: avgEnergyPerSessionTrends,
    });
    // ========================================================================

    // ======================= avgChargingRate ==================================
    defaultResponse["avgChargingRate"] = getTrendsData({
      isMoney: true,
      value: avgChargingRate,
      valueTrends: avgChargingRateTrends,
    });
    // ========================================================================

    // ======================= globalUtilizationRate ==================================
    defaultResponse["globalUtilizationRate"] = getTrendsData({
      isMoney: true,
      suffix: "kWh",
      value: globalUtilizationRate,
      valueTrends: globalUtilizationRateTrends,
    });

    defaultResponse["utilizationChartData"]["globalRate"] =
      defaultResponse["globalUtilizationRate"];

    // ========================================================================

    // ======================= totalChargers ==================================
    defaultResponse["totalChargers"]["value"] = totalChargers;
    defaultResponse["availableChargers"]["value"] = availableChargers;
    defaultResponse["inUseChargers"]["value"] = inUseChargers;
    defaultResponse["errorChargers"]["value"] = errorChargers;
    defaultResponse["offlineChargers"]["value"] = offlineChargers;
    // ========================================================================

    // ======================= weeklyRevenues ==================================
    for (const wd of weekData) {
      defaultResponse["weeklyRevenues"].push({
        type: "revenue",
        value: wd?.totalRevenue ?? 0,
        weekStart: wd?.weekStart,
        weekEnd: wd?.weekEnd,
        year: wd?.year,
        weekOfYear: wd?.weekOfYear,
      });
      defaultResponse["weeklyEnergyConsumed"].push({
        energyConsumed: wd?.totalEnergyDelivered ?? 0,
        weekStart: wd?.weekStart,
        weekEnd: wd?.weekEnd,
        year: wd?.year,
        weekOfYear: wd?.weekOfYear,
      });
    }
    // ========================================================================

    // ======================= monthlyRevenues ==================================
    let tmpSessCnt = 0;
    let tmpSessDurCnt = 0;
    for (const md of monthData) {
      defaultResponse["utilizationChartData"]["monthlyData"].push({
        month: md?.month,
        year: md?.year,
        rate:
          md?.globalUtilizationRate > 0
            ? parseFloat(md?.globalUtilizationRate).toFixed(2)
            : 0,
      });

      defaultResponse["monthlyRevenues"].push({
        type: "revenue",
        value: md?.totalRevenue ?? 0,
        month: md?.month,
        year: md?.year,
        monthYear: md?.monthYear,
      });
      defaultResponse["monthlyEnergyConsumed"].push({
        energyConsumed: md?.totalEnergyDelivered ?? 0,
        month: md?.month,
        year: md?.year,
        monthYear: md?.monthYear,
      });
      defaultResponse["sessionCounts"].push({
        sessionCount: md?.totalSessions ?? 0,
        month: md?.month,
        year: md?.year,
        monthYear: md?.monthYear,
      });
      tmpSessCnt += Number(md?.totalSessions ?? 0);

      defaultResponse["avgSessionDurations"].push({
        avgSessionDuration: md?.avgSessionDuration ?? 0,
        month: md?.month,
        year: md?.year,
        monthYear: md?.monthYear,
      });

      tmpSessDurCnt += Number(md?.avgSessionDuration ?? 0);
    }

    defaultResponse["avgSessionCountPerCharger"] = parseFloat(
      totalChargers > 0 && tmpSessCnt > 0
        ? Number(tmpSessCnt) / totalChargers
        : 0
    ).toFixed(2);
    defaultResponse["avgSessionDurationPerCharger"] = parseFloat(
      totalChargers > 0 && tmpSessDurCnt > 0
        ? Number(tmpSessDurCnt) / totalChargers
        : 0
    ).toFixed(2);
    // ========================================================================

    // ======================= topChargingStation ==================================
    defaultResponse["topChargingStationByRevenue"] =
      topEvseStationData?.topChargingStationByRevenue || [];
    defaultResponse["topChargingStationByUtilizationRate"] =
      topEvseStationData?.topChargingStationByUtilizationRate || [];
    // ========================================================================

    // ======================= topPartnerData ==================================
    defaultResponse["topCposByRevenue"] = topPartnerData;
    // ========================================================================

    // if (defaultResponse["currencySymbol"] == "CAD$") {
    //   defaultResponse["currencySymbol"] = "C$";
    // }

    return res.status(200).json(defaultResponse);
  } catch (error) {
    console.error("Error fetching revenue generated:", error?.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getDashboardAnalytics,
};
