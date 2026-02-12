const { AnalyticsModel } = require("@shared-libs/db/mongo-db");

const dailyAnalytics = async (matchConditions, range) => {
  return AnalyticsModel.aggregate([
    { $match: { ...matchConditions, ...range } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        totalEnergyDelivered: { $sum: "$totalEnergyDelivered" },
        totalSessions: { $sum: "$totalSessions" },
        totalRevenue: { $sum: "$totalRevenue" },
        totalExpense: { $sum: "$totalExpense" },
        totalRefund: { $sum: "$totalRefund" },
        avgSessionDuration: { $sum: "$avgSessionDuration" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    {
      $project: {
        _id: 0,
        date: {
          $dateToString: {
            format: "%d %b %Y",
            date: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: "$_id.day",
              },
            },
            timezone: "UTC",
          },
        },
        totalEnergyDelivered: 1,
        totalSessions: 1,
        totalRevenue: 1,
        totalExpense: 1,
        totalRefund: 1,
        avgSessionDuration: 1,
      },
    },
  ]);
};

const weeklyAnalytics = async (matchConditions, range) => {
  return AnalyticsModel.aggregate([
    { $match: { ...matchConditions, ...range } },
    {
      $group: {
        _id: {
          isoYear: { $isoWeekYear: "$createdAt" },
          isoWeek: { $isoWeek: "$createdAt" },
        },
        totalEnergyDelivered: { $sum: "$totalEnergyDelivered" },
        totalSessions: { $sum: "$totalSessions" },
        totalRevenue: { $sum: "$totalRevenue" },
        totalExpense: { $sum: "$totalExpense" },
        totalRefund: { $sum: "$totalRefund" },
        avgSessionDuration: { $sum: "$avgSessionDuration" },
      },
    },
    {
      $sort: { "_id.isoYear": 1, "_id.isoWeek": 1 },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.isoYear",
        weekOfYear: "$_id.isoWeek",
        weekStart: {
          $dateToString: {
            format: "%d %b %Y",
            date: {
              $dateFromParts: {
                isoWeekYear: "$_id.isoYear",
                isoWeek: "$_id.isoWeek",
                isoDayOfWeek: 1,
              },
            },
            timezone: "UTC",
          },
        },
        weekEnd: {
          $dateToString: {
            format: "%d %b %Y",
            date: {
              $dateFromParts: {
                isoWeekYear: "$_id.isoYear",
                isoWeek: "$_id.isoWeek",
                isoDayOfWeek: 7,
              },
            },
            timezone: "UTC",
          },
        },
        totalEnergyDelivered: 1,
        totalSessions: 1,
        totalRevenue: 1,
        totalExpense: 1,
        totalRefund: 1,
        avgSessionDuration: 1,
      },
    },
  ]);
};

const monthlyAnalytics = async (matchConditions, range) => {
  return AnalyticsModel.aggregate([
    { $match: { ...matchConditions, ...range } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalSessionsDurationSec: { $sum: "$totalDurationSec" },
        totalEnergyDelivered: { $sum: "$totalEnergyDelivered" },
        totalSessions: { $sum: "$totalSessions" },
        totalRevenue: { $sum: "$totalRevenue" },
        totalExpense: { $sum: "$totalExpense" },
        totalRefund: { $sum: "$totalRefund" },
        avgSessionDuration: { $sum: "$avgSessionDuration" },
        uniqueDates: {
          $addToSet: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: {
          $dateToString: {
            format: "%b",
            date: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: 1,
              },
            },
          },
        },
        monthYear: {
          $dateToString: {
            format: "%b %Y",
            date: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: 1,
              },
            },
          },
        },
        totalEnergyDelivered: 1,
        totalSessionsDurationSec: 1,
        totalSessions: 1,
        totalRevenue: 1,
        totalExpense: 1,
        totalRefund: 1,
        avgSessionDuration: 1,
        uniqueDateCount: { $size: "$uniqueDates" },
      },
    },
    {
      $addFields: {
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
      },
    },
  ]);
};

const yearlyAnalytics = async (matchConditions, range) => {
  return await AnalyticsModel.aggregate([
    { $match: { ...matchConditions, ...range } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
        },
        totalEnergyDelivered: { $sum: "$totalEnergyDelivered" },
        totalSessions: { $sum: "$totalSessions" },
        totalRevenue: { $sum: "$totalRevenue" },
        totalExpense: { $sum: "$totalExpense" },
        totalRefund: { $sum: "$totalRefund" },
        avgSessionDuration: { $sum: "$avgSessionDuration" },
        uniqueDates: {
          $addToSet: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
        },
      },
    },
    { $sort: { "_id.year": 1 } },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        totalEnergyDelivered: 1,
        totalSessions: 1,
        totalRevenue: 1,
        totalExpense: 1,
        totalRefund: 1,
        avgSessionDuration: 1,
        uniqueDateCount: { $size: "$uniqueDates" },
      },
    },
  ]);
};

const getFinalDataArrays = async (data, dayCount) => {
  const energyConsumed = [];
  const sessionCounts = [];
  const revenues = [];
  const avgSessionDurations = [];
  if (!dayCount) dayCount = 35; //send default monthly data
  if (dayCount < 7) {
    // Process daily analytics data
    data.forEach((dayData) => {
      const date = dayData?.date; // e.g., "2024-01-01"
      if (!date) return; // Skip if date is missing
      const [day, month, year] = date.split(" ");

      energyConsumed.push({
        date,
        month,
        year,
        energyConsumed: parseFloat(dayData?.totalEnergyDelivered || 0).toFixed(
          2
        ),
      });

      sessionCounts.push({
        date,
        month,
        year,
        sessionCount: dayData?.totalSessions || 0,
      });

      revenues.push({
        date,
        month,
        year,
        value: parseFloat(dayData?.totalRevenue || 0).toFixed(2),
        type: "revenue",
      });
      revenues.push({
        date,
        month,
        year,
        value: parseFloat(dayData?.totalExpense || 0).toFixed(2),
        type: "expense",
      });
      revenues.push({
        date,
        month,
        year,
        value: parseFloat(dayData?.totalRefund || 0).toFixed(2),
        type: "refund",
      });

      // Since daily data groups by individual days, uniqueDateCount is always 1
      const uniqueDaysCount = 1;
      avgSessionDurations.push({
        date,
        month,
        year,
        avgSessionDuration: parseFloat(
          (dayData?.avgSessionDuration || 0) / uniqueDaysCount
        ).toFixed(2),
      });
    });
  } else if (dayCount <= 30 && dayCount >= 7) {
    // Process weekly analytics data
    data.forEach((weekData) => {
      const weekStart = weekData?.weekStart; // e.g., "17 May 2025"
      const weekEnd = weekData?.weekEnd; // e.g., "17 May 2025"
      if (!weekStart || !weekEnd) return;
      const year = parseInt(weekStart.split(" ")[2], 10); // Extract year from weekStart

      energyConsumed.push({
        weekStart,
        weekEnd,
        year,
        energyConsumed: parseFloat(weekData?.totalEnergyDelivered || 0).toFixed(
          2
        ),
      });

      sessionCounts.push({
        weekStart,
        weekEnd,
        year,
        sessionCount: weekData?.totalSessions || 0,
      });

      revenues.push({
        weekStart,
        weekEnd,
        year,
        value: parseFloat(weekData?.totalRevenue || 0).toFixed(2),
        type: "revenue",
      });
      revenues.push({
        weekStart,
        weekEnd,
        year,
        value: parseFloat(weekData?.totalExpense || 0).toFixed(2),
        type: "expense",
      });
      revenues.push({
        weekStart,
        weekEnd,
        year,
        value: parseFloat(weekData?.totalRefund || 0).toFixed(2),
        type: "refund",
      });

      const uniqueDaysCount = weekData?.uniqueDateCount ?? 1;
      avgSessionDurations.push({
        weekStart,
        weekEnd,
        year,
        avgSessionDuration: parseFloat(
          (weekData?.avgSessionDuration || 0) / uniqueDaysCount
        ).toFixed(2),
      });
    });
  } else if (dayCount > 30 && dayCount <= 365) {
    // Process monthly analytics data
    data.forEach((monthData) => {
      const monthYear = monthData?.monthYear; // e.g., "Jan 2024"
      if (!monthYear) return; // Skip if monthYear is missing
      const [month, year] = monthYear.split(" ");
      const parsedYear = parseInt(year, 10);
      if (!month || !year) return; // Skip if month or year is invalid

      energyConsumed.push({
        month,
        year: parsedYear,
        energyConsumed: parseFloat(
          monthData?.totalEnergyDelivered || 0
        ).toFixed(2),
      });

      sessionCounts.push({
        month,
        year: parsedYear,
        sessionCount: monthData?.totalSessions || 0,
      });

      revenues.push({
        month,
        year: parsedYear,
        value: parseFloat(monthData?.totalRevenue || 0).toFixed(2),
        type: "revenue",
      });
      revenues.push({
        month,
        year: parsedYear,
        value: parseFloat(monthData?.totalExpense || 0).toFixed(2),
        type: "expense",
      });
      revenues.push({
        month,
        year: parsedYear,
        value: parseFloat(monthData?.totalRefund || 0).toFixed(2),
        type: "refund",
      });

      const uniqueDaysCount = monthData?.uniqueDateCount ?? 1;
      avgSessionDurations.push({
        month,
        year: parsedYear,
        avgSessionDuration: parseFloat(
          (monthData?.avgSessionDuration || 0) / uniqueDaysCount
        ).toFixed(2),
      });
    });
  } else {
    // Process yearly analytics data
    data.forEach((yearData) => {
      const year = yearData?.year; // e.g., 2024
      if (!year) return; // Skip if year is missing

      energyConsumed.push({
        year,
        energyConsumed: parseFloat(yearData?.totalEnergyDelivered || 0).toFixed(
          2
        ),
      });

      sessionCounts.push({
        year,
        sessionCount: yearData?.totalSessions || 0,
      });

      revenues.push({
        year,
        value: parseFloat(yearData?.totalRevenue || 0).toFixed(2),
        type: "revenue",
      });
      revenues.push({
        year,
        value: parseFloat(yearData?.totalExpense || 0).toFixed(2),
        type: "expense",
      });
      revenues.push({
        year,
        value: parseFloat(yearData?.totalRefund || 0).toFixed(2),
        type: "refund",
      });

      const uniqueDaysCount = yearData?.uniqueDateCount ?? 1;
      avgSessionDurations.push({
        year,
        avgSessionDuration: parseFloat(
          (yearData?.avgSessionDuration || 0) / uniqueDaysCount
        ).toFixed(2),
      });
    });
  }

  return {
    energyConsumed,
    sessionCounts,
    revenues,
    avgSessionDurations,
  };
};

module.exports = {
  dailyAnalytics,
  weeklyAnalytics,
  monthlyAnalytics,
  yearlyAnalytics,
  getFinalDataArrays,
};
