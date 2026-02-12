const cron = require("node-cron");
const { ChargerRepository } = require("@shared-libs/db/mysql");
const { UtilizationRateModel } = require("@shared-libs/db/mongo-db");
const { DateTime } = require("luxon");
const { utilizationRateCalculation } = require("@shared-libs/utilization-rate");

const UtilizationRateCron = () => {
  cron.schedule("0 2 * * *", async () => {
    await calculateUtilizationRate();
  });
};

const getPreviousDayRange = () => {
  const start = DateTime.utc().minus({ days: 1 }).startOf("day");
  const end = DateTime.utc().minus({ days: 1 }).endOf("day");
  return { start: start.toJSDate(), end: end.toJSDate() };
};

const calculateUtilizationRate = async () => {
  try {
    const batchSize = 10;
    let page = 0;

    while (true) {
      const chargers = await ChargerRepository.find({
        where: { isDeleted: false },
        skip: page * batchSize,
        take: batchSize,
      });

      if (chargers.length === 0) {
        break;
      }

      // Process all chargers in the batch concurrently
      await Promise.all(
        chargers.map(async (charger) => {
          const previousDayRange = getPreviousDayRange();
          // Check if today's utilization rate for previous day is already calculated
          const existingUtilizationRate = await UtilizationRateModel.findOne({
            clientId: charger.chargeBoxId,
            createdAt: {
              $gte: previousDayRange.start,
              $lte: previousDayRange.end,
            },
          }).lean();

          if (existingUtilizationRate) {
            return;
          }

          await utilizationRateCalculation({
            pastDays: 1,
            clientId: charger.chargeBoxId,
          });
        })
      );

      page++;
    }
  } catch (error) {
    console.log("UtilizationRateCron Failed: ", error?.message);
  }
};

module.exports = { UtilizationRateCron, calculateUtilizationRate };
