const {
  ChargerRepository,
  ChargerEtTestingTransactionsRepository,
  ChargerRevenueRepository,
} = require("@shared-libs/db/mysql");
const { AnalyticsModel } = require("@shared-libs/db/mongo-db");
const { DateTime } = require("luxon");
const { Not, In, IsNull } = require("typeorm");
const { convertDateTimezone, arrayObjStr } = require("@shared-libs/helpers");

const getPreviousDayRange = () => {
  const start = DateTime.utc().minus({ days: 1 }).startOf("day");
  const end = DateTime.utc().minus({ days: 1 }).endOf("day");
  return { start: start.toJSDate(), end: end.toJSDate() };
};

const getAnalyticsFromDate = async (dt) => {
  try {
    let { start, end } = getPreviousDayRange();
    if (dt) {
      start = DateTime.fromFormat(dt, "yyyy-MM-dd", { zone: "UTC" })
        .startOf("day")
        .toJSDate();
      end = DateTime.fromFormat(dt, "yyyy-MM-dd", { zone: "UTC" })
        .endOf("day")
        .toJSDate();
    }

    await calculateAnalytics(start, end);
  } catch (error) {
    console.log("getAnalyticsFromDate Failed: ", error?.message);
  }
};

const getEtTestingTransactionIds = async (chargeBoxIds, start, end) => {
  const etTestingData =
    await ChargerEtTestingTransactionsRepository.createQueryBuilder("etx")
      .select("etx.chargeBoxId", "chargeBoxId")
      .addSelect("etx.ocppTransactionId", "ocppTransactionId")
      .where("etx.chargeBoxId IN (:...chargeBoxIds)", { chargeBoxIds })
      .andWhere("etx.createdAt BETWEEN :start AND :end", {
        start: convertDateTimezone(DateTime.fromJSDate(start)),
        end: convertDateTimezone(DateTime.fromJSDate(end)),
      })
      .getRawMany();

  const ids = etTestingData.map(({ ocppTransactionId }) => ocppTransactionId);
  return ids;
};

const getTestTransactionIds = async (chargeBoxIds, start, end) => {
  const ocppTestData = await ChargerRevenueRepository.createQueryBuilder("etx")
    .select("etx.chargeBoxId", "chargeBoxId")
    .addSelect("etx.ocppTransactionId", "ocppTransactionId")
    .where("etx.chargeBoxId IN (:...chargeBoxIds)", { chargeBoxIds })
    .andWhere("etx.isTestTransaction = :isTest", { isTest: 1 })
    .andWhere("etx.createdAt BETWEEN :start AND :end", {
      start: convertDateTimezone(DateTime.fromJSDate(start)),
      end: convertDateTimezone(DateTime.fromJSDate(end)),
    })
    .getRawMany();

  const ids = ocppTestData.map(({ ocppTransactionId }) => ocppTransactionId);
  return ids;
};

const calculateAnalytics = async (start, end) => {
  try {
    const chargers = await ChargerRepository.find({
      where: {
        // isDeleted: false,
        status: Not(In(["generated", "registered"])),
        chargeBoxId: Not(IsNull()),
      },
      select: ["id", "chargeBoxId", "evseStationId", "cpoId", "country"],
    });

    let chargeBoxIds = chargers.map(({ chargeBoxId }) => chargeBoxId);
    if (chargeBoxIds?.length > 0) {
      const [testIds1, testIds2] = await Promise.all([
        getEtTestingTransactionIds(chargeBoxIds, start, end),
        getTestTransactionIds(chargeBoxIds, start, end),
      ]);

      const testTransactionIds = [...new Set([...testIds1, ...testIds2])];

      const [realAnalyticsData, testAnalyticsData] = await Promise.all([
        getAnalytics(
          chargers,
          chargeBoxIds,
          start,
          end,
          testTransactionIds,
          false
        ),
        getAnalytics(
          chargers,
          chargeBoxIds,
          start,
          end,
          testTransactionIds,
          true
        ),
      ]);

      await AnalyticsModel.deleteMany({
        chargeBoxId: { $in: chargeBoxIds },
        createdAt: start,
      });

      await AnalyticsModel.insertMany([
        ...realAnalyticsData,
        ...testAnalyticsData,
      ]);
    }
  } catch (error) {
    console.log("calculateAnalyticsCron Failed: ", error?.message);
  }
};

const getAnalytics = async (
  chargers,
  chargeBoxIds,
  start,
  end,
  testTransactionIds,
  isMockData
) => {
  try {
    let ocppTransactions = [];

    const query = await ChargerRevenueRepository.createQueryBuilder("tx")
      .select("tx.chargeBoxId", "chargeBoxId")
      .addSelect("tx.contractId", "contractId")
      .addSelect("COUNT(chargeBoxId)", "totalSessions")
      .addSelect("SUM(tx.totalAmount)", "totalRevenue")
      .addSelect("SUM(tx.effectiveEnergyConsumed)", "totalEnergyDelivered")
      .addSelect("SUM(tx.chargingDuration)", "totalDuration")
      .addSelect("AVG(tx.chargingDuration)", "avgSessionDuration")
      .addSelect("AVG(tx.avgChargingRate)", "avgChargingRate")
      .where("tx.chargeBoxId IN (:...chargeBoxIds)", { chargeBoxIds })
      .andWhere("tx.createdAt BETWEEN :start AND :end", {
        start: convertDateTimezone(DateTime.fromJSDate(start)),
        end: convertDateTimezone(DateTime.fromJSDate(end)),
      });

    if (testTransactionIds.length > 0) {
      if (isMockData == false) {
        query.andWhere("tx.ocppTransactionId NOT IN (:...testTransactionIds)", {
          testTransactionIds,
        });
      } else {
        query.andWhere("tx.ocppTransactionId IN (:...testTransactionIds)", {
          testTransactionIds,
        });
      }
    }

    if (isMockData == true && testTransactionIds.length == 0) {
      ocppTransactions = [];
    } else {
      ocppTransactions = await query.groupBy("tx.chargeBoxId").getRawMany();
    }

    const ocppTransactionData = ocppTransactions.map((ot) => {
      let totalDurationHours =
        Number(ot?.totalDuration ?? 0) > 0
          ? Number(ot?.totalDuration) / 3600
          : 0;
      let utilizationRate =
        Number(totalDurationHours) > 0
          ? (Number(totalDurationHours) / 24) * 100
          : 0;

      return {
        chargeBoxId: ot?.chargeBoxId,
        contractId: ot?.contractId ?? null,
        totalSessions: Number(ot?.totalSessions ?? 0),
        totalRevenue: Number(ot?.totalRevenue ?? 0).toFixed(2),
        totalEnergyDelivered: Number(ot?.totalEnergyDelivered ?? 0).toFixed(2),
        totalDuration: Number(totalDurationHours).toFixed(2),
        totalDurationSec: Number(ot?.totalDuration ?? 0),
        utilizationRate: Number(utilizationRate).toFixed(2),
        avgSessionDuration: (
          Number(ot?.avgSessionDuration ?? 0) / 3600
        ).toFixed(2),
        avgChargingRate: Number(ot?.avgChargingRate ?? 0).toFixed(2),
      };
    });

    const calculatedData = arrayObjStr(ocppTransactionData, "chargeBoxId");

    const analyticsDataToInsert = chargers.map((c) => {
      const tmpData = calculatedData[c?.chargeBoxId] ?? {};
      return {
        chargeBoxId: c?.chargeBoxId,
        chargerId: c?.id,
        evseStationId: c?.evseStationId,
        cpoId: c?.cpoId,
        country: c?.country,
        contractId: tmpData?.contractId,
        totalRevenue: tmpData?.totalRevenue ?? 0,
        totalSessions: tmpData?.totalSessions ?? 0,
        totalEnergyDelivered: tmpData?.totalEnergyDelivered ?? 0,
        avgEnergyPerSession: 0,
        avgChargingRate: tmpData?.avgChargingRate ?? 0,
        avgSessionDuration: tmpData?.avgSessionDuration ?? 0,
        totalDuration: tmpData?.totalDuration ?? 0,
        totalDurationSec: tmpData?.totalDurationSec ?? 0,
        utilizationRate: tmpData?.utilizationRate ?? 0,
        createdAt: start,
        isMockData,
      };
    });

    return analyticsDataToInsert;
  } catch (error) {
    console.log(
      "calculateAnalyticsCron -> getAnalytics Failed: ",
      error?.message
    );
  }
};

module.exports = {
  getAnalyticsFromDate,
};
