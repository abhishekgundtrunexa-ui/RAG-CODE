const {
  getAnalyticDataForDashboard,
  getGrossRevenueSplit,
  growthPercentage,
  getTrendsData,
} = require("@shared-libs/helpers");

const getDefaultResponse = () => {
  return {
    totalGrossRevenue: getTrendsData({
      currency: "$",
      isMoney: true,
      value: 0,
      valueTrends: 0,
    }),
    grossRevenueGrowthRate: getTrendsData({
      isMoney: true,
      isPercentage: true,
      value: 0,
      valueTrends: 0,
    }),
    avgRevenuePerChargerPerDay: getTrendsData({
      currency: "$",
      isMoney: true,
      value: 0,
      valueTrends: 0,
    }),
    avgRevenuePerChargerPerSession: getTrendsData({
      currency: "$",
      isMoney: true,
      value: 0,
      valueTrends: 0,
    }),

    grossRevenueSplit: {
      cpo: 0,
      siteHost: 0,
      investor: 0,
      total: 0,
    },
    monthlyTrend: [
      {
        month: "May",
        year: 2025,
        cpo: 0,
        siteHost: 0,
        investor: 0,
        total: 0,
      },
    ],
  };
};

const getRevenueReports = async (req, res) => {
  try {
    const {
      returnDefaultResponse,
      matchConditions,
      range,
      rangeTrend,
      sqlMatchConditionsRaw,
      rangeRaw,
    } = req.analyticsFilters;

    const defaultResponse = getDefaultResponse();

    if (returnDefaultResponse === true) {
      return res.status(200).json(defaultResponse);
    }

    const [allAnalytics, allAnalyticsTrends, revenueSplitResult, monthlyTrend] =
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
        getGrossRevenueSplit(sqlMatchConditionsRaw, rangeRaw, true),
      ]);

    if (allAnalytics.length === 0) {
      return res.status(200).json(defaultResponse);
    }

    // Extract the first object from the array
    const analyticCounts = allAnalytics[0] || {}; // Return empty object if no data found
    const analyticTrendsCounts = allAnalyticsTrends[0] || {}; // Return empty object if no data found

    let {
      totalRevenue = 0,
      avgRevenuePerChargerPerDay = 0,
      avgRevenuePerChargerPerSession = 0,
    } = analyticCounts;
    let {
      totalRevenue: totalRevenueTrends = 0,
      avgRevenuePerChargerPerDay: avgRevenuePerChargerPerDayTrends = 0,
      avgRevenuePerChargerPerSession: avgRevenuePerChargerPerSessionTrends = 0,
    } = analyticTrendsCounts;

    // ======================= grossRevenueGrowthRate ==================================

    const grossRevenueGrowthRateDifference = growthPercentage(
      totalRevenueTrends,
      totalRevenue
    );

    defaultResponse["grossRevenueGrowthRate"] = getTrendsData({
      isMoney: true,
      isPercentage: true,
      valueDifference: grossRevenueGrowthRateDifference,
    });
    // ========================================================================

    // ======================= totalGrossRevenue ==================================
    defaultResponse["totalGrossRevenue"] = getTrendsData({
      currency: "$",
      isMoney: true,
      value: totalRevenue,
      valueTrends: totalRevenueTrends,
    });
    // ========================================================================

    // ======================= avgRevenuePerChargerPerDay ==================================
    defaultResponse["avgRevenuePerChargerPerDay"] = getTrendsData({
      currency: "$",
      isMoney: true,
      value: avgRevenuePerChargerPerDay,
      valueTrends: avgRevenuePerChargerPerDayTrends,
    });
    // ========================================================================

    // ======================= avgRevenuePerChargerPerSession ==================================
    defaultResponse["avgRevenuePerChargerPerSession"] = getTrendsData({
      currency: "$",
      isMoney: true,
      value: avgRevenuePerChargerPerSession,
      valueTrends: avgRevenuePerChargerPerSessionTrends,
    });
    // ========================================================================

    defaultResponse["grossRevenueSplit"]["cpo"] = parseFloat(
      Number(revenueSplitResult?.cpoAmount ?? 0)
    ).toFixed(2);
    defaultResponse["grossRevenueSplit"]["siteHost"] = parseFloat(
      Number(revenueSplitResult?.siteHostAmount ?? 0)
    ).toFixed(2);
    defaultResponse["grossRevenueSplit"]["investor"] = parseFloat(
      Number(revenueSplitResult?.investorAmount ?? 0)
    ).toFixed(2);
    defaultResponse["grossRevenueSplit"]["total"] = parseFloat(
      Number(revenueSplitResult?.totalAmount ?? 0)
    ).toFixed(2);

    defaultResponse["monthlyTrend"] = monthlyTrend;

    return res.status(200).json(defaultResponse);
  } catch (error) {
    console.error("Error getting revenue reports:", error);
    res
      .status(500)
      .json({ message: "Failed to get revenue reports", error: error.message });
  }
};

module.exports = {
  getRevenueReports,
};
