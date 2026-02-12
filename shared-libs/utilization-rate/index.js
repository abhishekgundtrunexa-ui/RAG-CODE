const { DateTime } = require("luxon");
const {
  OcppAllLogModel,
  UtilizationRateModel,
} = require("@shared-libs/db/mongo-db");
const { ChargerRepository } = require("@shared-libs/db/mysql");

const getPreviousDayRange = () => {
  const start = DateTime.utc().minus({ days: 1 }).startOf("day");
  const end = DateTime.utc().minus({ days: 1 }).endOf("day");
  return { start: start.toJSDate(), end: end.toJSDate() };
};

const utilizationRateCalculation = async ({
  pastDays = 1,
  from = null,
  to = null,
  clientId,
}) => {
  try {
    if (!clientId) return;

    let startDate, endDate;

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

    const logs = await OcppAllLogModel.find({
      clientId,
      createdAt: { $gte: startDate, $lte: endDate },
      $or: [{ eventName: "StatusNotification" }],
    })
      .sort({ createdAt: 1 })
      .lean();

    if (!logs.length) {
      return;
    }

    const { statusDurations } = processLogsNew(logs);

    const firstTimestamp = new Date(logs[0].createdAt);
    const lastTimestamp = new Date(logs[logs.length - 1].createdAt);
    const totalDurationInSeconds = (lastTimestamp - firstTimestamp) / 1000;

    const utilizationRates = {};
    for (const [status, seconds] of Object.entries(statusDurations)) {
      utilizationRates[status] = Number(
        ((seconds / totalDurationInSeconds) * 100).toFixed(2)
      );
    }

    const statusDurationsInMinutes = {};
    for (const [status, seconds] of Object.entries(statusDurations)) {
      statusDurationsInMinutes[status] = Number((seconds / 60).toFixed(2));
    }

    const stationInfo = await ChargerRepository.findOne({
      where: { chargeBoxId: clientId },
      select: ["evseStationId"],
    });

    const utilizationRate = new UtilizationRateModel({
      clientId,
      evseStationId: stationInfo?.evseStationId || null,
      utilizationRates,
      statusDurations: statusDurationsInMinutes,
      createdAt: startDate,
    });

    await utilizationRate.save();
  } catch (error) {
    console.error("Utilization Rate Calculation Error:", error);
  }
};

const processLogsNew = (logs) => {
  if (!logs.length) return { statusDurations: {}, statusChanges: [] };

  logs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const statusDurations = {};
  const statusChanges = [];

  const chargingStates = ["Preparing", "Charging", "Finishing"];

  let previousStatus = logs[0].ocppSchema?.status || "Unknown";
  let previousTimestamp = DateTime.fromJSDate(new Date(logs[0].createdAt));
  let chargingSessionStart = chargingStates.includes(previousStatus)
    ? previousTimestamp
    : null;

  for (let i = 1; i < logs.length; i++) {
    const log = logs[i];
    const currentStatus = log.ocppSchema?.status || "Unknown";
    const currentTimestamp = DateTime.fromJSDate(new Date(log.createdAt));
    const durationInSeconds = currentTimestamp.diff(previousTimestamp, "seconds").seconds;

    const prevWasCharging = chargingStates.includes(previousStatus);
    const currIsCharging = chargingStates.includes(currentStatus);

    // Start of charging session
    if (!chargingSessionStart && currentStatus === "Preparing") {
      chargingSessionStart = currentTimestamp;
    }

    // End of charging session (if transitioning out of charging group)
    if (chargingSessionStart && !currIsCharging) {
      const chargingDuration = currentTimestamp.diff(chargingSessionStart, "seconds").seconds;
      statusDurations["In-Use"] = (statusDurations["In-Use"] || 0) + chargingDuration;

      statusChanges.push({
        from: "In-Use",
        to: currentStatus,
        startTime: chargingSessionStart.toJSDate(),
        endTime: currentTimestamp.toJSDate(),
        durationInMinutes: (chargingDuration / 60).toFixed(2),
      });

      chargingSessionStart = null;
    }

    // Handle non-charging durations
    if (!chargingSessionStart && !currIsCharging && !prevWasCharging) {
      const key = previousStatus === "Charging" ? "In-Use" : previousStatus;
      statusDurations[key] = (statusDurations[key] || 0) + durationInSeconds;

      if (previousStatus !== currentStatus) {
        statusChanges.push({
          from: key,
          to: currentStatus,
          startTime: previousTimestamp.toJSDate(),
          endTime: currentTimestamp.toJSDate(),
          durationInMinutes: (durationInSeconds / 60).toFixed(2),
        });
      }
    }

    previousStatus = currentStatus;
    previousTimestamp = currentTimestamp;
  }

  // Handle leftover time
  const firstTimestamp = DateTime.fromJSDate(new Date(logs[0].createdAt));
  const lastTimestamp = DateTime.fromJSDate(new Date(logs[logs.length - 1].createdAt));
  const totalDuration = lastTimestamp.diff(firstTimestamp, "seconds").seconds;
  const totalAccounted = Object.values(statusDurations).reduce((a, b) => a + b, 0);
  const leftover = totalDuration - totalAccounted;

  if (leftover > 0 && !chargingStates.includes(previousStatus)) {
    const finalKey = previousStatus === "Charging" ? "In-Use" : previousStatus;
    statusDurations[finalKey] = (statusDurations[finalKey] || 0) + leftover;

    statusChanges.push({
      from: finalKey,
      to: "End",
      startTime: previousTimestamp.toJSDate(),
      endTime: lastTimestamp.toJSDate(),
      durationInMinutes: (leftover / 60).toFixed(2),
    });
  }

  return { statusDurations, statusChanges };
};


const processLogs = (logs) => {
  const statusDurations = {};
  const statusChanges = [];
  let previousLog = null;

  logs.forEach((log) => {
    const status = log.ocppSchema?.status;

    if (status) {
      const timestamp = DateTime.fromJSDate(new Date(log.createdAt));

      if (previousLog) {
        const prevStatus = previousLog.ocppSchema?.status;
        if (prevStatus === status) {
          previousLog = log;
        }
        const prevTimestamp = DateTime.fromJSDate(
          new Date(previousLog.createdAt)
        );
        const durationInSeconds = timestamp.diff(
          prevTimestamp,
          "seconds"
        ).seconds;

        if (prevStatus) {
          const statusKey = prevStatus === "Charging" ? "In-Use" : prevStatus;
          statusDurations[statusKey] =
            (statusDurations[statusKey] || 0) + durationInSeconds;
        }

        if (status && prevStatus !== status) {
          statusChanges.push({
            from: prevStatus === "Charging" ? "In-Use" : prevStatus,
            to: status === "Charging" ? "In-Use" : status,
            startTime: prevTimestamp.toJSDate(),
            endTime: timestamp.toJSDate(),
            durationInMinutes: (durationInSeconds / 60).toFixed(2),
          });
        }
      }
      previousLog = log;
    }
  });

  return { statusDurations, statusChanges };
};

const setDefaultStatusDurations = (statusDurations, includedStatuses) => {
  includedStatuses.forEach((status) => {
    if (!(status in statusDurations)) {
      statusDurations[status] = 0;
    }
  });
};

const calculateTotalDuration = (statusDurations, includedStatuses) => {
  return includedStatuses.reduce((sum, status) => {
    return sum + (statusDurations[status] || 0);
  }, 0);
};

const calculateUtilizationRates = (
  statusDurations,
  includedStatuses,
  totalDurationInSeconds
) => {
  return includedStatuses.reduce((acc, status) => {
    const duration = statusDurations[status] || 0;
    acc[status] = totalDurationInSeconds
      ? ((duration / totalDurationInSeconds) * 100).toFixed(2)
      : 0;
    return acc;
  }, {});
};

const convertDurationsToMinutes = (statusDurations, includedStatuses) => {
  const result = includedStatuses.reduce((acc, status) => {
    const duration = statusDurations[status] || 0;
    acc[status] = (duration / 60).toFixed(2);
    return acc;
  }, {});
  result.time_unit = "Minute";
  return result;
};

module.exports = { utilizationRateCalculation };
