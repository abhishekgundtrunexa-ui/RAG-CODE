const cron = require("node-cron");
const { DateTime } = require("luxon");
const {
  EMspRepository,
  EMspUserRepository,
  ChargerRevenueRepository,
  ContractViewRepository,
  PartnerRepository,
  SettlementRepository,
  SettlementPartnerRepository,
} = require("@shared-libs/db/mysql");
const { LessThan, IsNull, In, Between } = require("typeorm");
const { SettlementPeriods } = require("@shared-libs/constants");
const {
  arrayObjStr,
  getTimezoneByCountry,
  convertDateTimezone,
  getSettlementCode,
} = require("@shared-libs/helpers");

const SYNC_SETTLEMENTS_CRON_INTERVAL = "5 0 * * *"; // Runs everyday at 00:05 AM

const SyncSettlementsCron = () => {
  cron.schedule(SYNC_SETTLEMENTS_CRON_INTERVAL, async () => {
    await syncSettlements();
  });
};

const syncSettlements = async () => {
  try {
    const dt = DateTime.utc().endOf("day").toJSDate({ zone: "UTC" });

    const dtEnd = DateTime.utc()
      .minus({ day: 1 })
      .endOf("day")
      .toJSDate({ zone: "UTC" });

    const emspUsers = await EMspUserRepository.find({
      where: { isDeleted: false, isEmsp: true, apexEmailVerified: true },
    });

    let emspIdsFromUser = emspUsers.map((user) => user.emspId);

    if (emspIdsFromUser?.length > 0) {
      const commonWhere = { id: In(emspIdsFromUser), isDeleted: false };

      const emsps = await EMspRepository.find({
        where: [
          {
            ...commonWhere,
            nextSettlementDate: LessThan(dt),
          },
          {
            ...commonWhere,
            nextSettlementDate: IsNull(),
          },
        ],
      });

      let emspData = {};
      for (const em of emsps) {
        let nextDate = "";

        let nxDateTmp = DateTime.fromJSDate(dt, { zone: "UTC" });

        if (em?.settlementPeriod == SettlementPeriods.MONTHLY) {
          nxDateTmp = nxDateTmp.plus({ month: 1 });
        } else if (em?.settlementPeriod == SettlementPeriods.TWO_WEEKS) {
          nxDateTmp = nxDateTmp.plus({ weeks: 2 });
        } else {
          nxDateTmp = nxDateTmp.plus({ week: 1 });
        }

        nextDate = nxDateTmp.startOf("day").toJSDate({ zone: "UTC" });

        emspData[em.id] = {
          emspId: em.id,
          nextDate,
          settlementPeriod: em?.settlementPeriod,
        };
      }

      let emspIds = emsps.map((emsp) => emsp.id);

      if (emspIds?.length > 0) {
        const contracts = await ContractViewRepository.find({
          where: { isDeleted: false, emspId: In(emspIds) },
        });

        let contractIds = contracts.map((c) => c.id);
        let countryTz = {};

        if (contractIds.length > 0) {
          const partnerIds = [];
          const contractPartnerIds = {};

          for (const ct of contracts) {
            contractPartnerIds[ct?.id] = contractPartnerIds[ct?.id] ?? [];

            partnerIds.push(ct?.cpoId);
            partnerIds.push(ct?.siteHostId);

            contractPartnerIds[ct?.id].push(ct?.cpoId);
            contractPartnerIds[ct?.id].push(ct?.siteHostId);

            if (ct?.investors?.length > 0) {
              if (ct?.investors[0]?.partnerId) {
                partnerIds.push(ct?.investors[0]?.partnerId);
                contractPartnerIds[ct?.id].push(ct?.investors[0]?.partnerId);
              }
              if (ct?.investors[1]?.partnerId) {
                partnerIds.push(ct?.investors[1]?.partnerId);
                contractPartnerIds[ct?.id].push(ct?.investors[1]?.partnerId);
              }
            }
          }

          let partnerData = await PartnerRepository.find({
            where: { userId: In(partnerIds) },
            select: ["userId", "bankName", "accountNumber"],
          });

          partnerData = arrayObjStr(partnerData, "userId");

          for (const ct of contracts) {
            const saveSettlements = true;
            if (saveSettlements) {
              let chargerRevenueData =
                await ChargerRevenueRepository.createQueryBuilder(
                  "chargerRevenue"
                )
                  .select("chargerRevenue.totalAmount", "totalAmount")
                  .addSelect("chargerRevenue.cpoAmount", "cpoAmount")
                  .addSelect("chargerRevenue.siteHostAmount", "siteHostAmount")
                  .addSelect(
                    "chargerRevenue.investor1Amount",
                    "investor1Amount"
                  )
                  .addSelect(
                    "chargerRevenue.investor2Amount",
                    "investor2Amount"
                  )
                  .addSelect("chargerRevenue.id", "id")
                  .where("chargerRevenue.dateTime <= :start", {
                    start: dtEnd,
                  })
                  .andWhere(
                    "chargerRevenue.isSettlementGenerated = :isSettlementGenerated",
                    { isSettlementGenerated: 0 }
                  )
                  .andWhere("chargerRevenue.contractId = :contractId", {
                    contractId: ct.id,
                  })
                  .getRawMany();

              const numberOfTransactions = chargerRevenueData.length;
              const settlementAmount = chargerRevenueData.reduce(
                (sum, chargerRevenue) => {
                  return sum + (parseFloat(chargerRevenue.totalAmount) || 0);
                },
                0
              );
              const cpoTotalAmount = chargerRevenueData.reduce(
                (sum, chargerRevenue) => {
                  return sum + (parseFloat(chargerRevenue.cpoAmount) || 0);
                },
                0
              );
              const siteHostTotalAmount = chargerRevenueData.reduce(
                (sum, chargerRevenue) => {
                  return sum + (parseFloat(chargerRevenue.siteHostAmount) || 0);
                },
                0
              );
              const investor1TotalAmount = chargerRevenueData.reduce(
                (sum, chargerRevenue) => {
                  return (
                    sum + (parseFloat(chargerRevenue.investor1Amount) || 0)
                  );
                },
                0
              );
              const investor2TotalAmount = chargerRevenueData.reduce(
                (sum, chargerRevenue) => {
                  return (
                    sum + (parseFloat(chargerRevenue.investor2Amount) || 0)
                  );
                },
                0
              );

              let chargerRevenueIds = chargerRevenueData.map((cr) => cr.id);

              if (settlementAmount > 0) {
                const settlementId = await getSettlementCode();

                const country = ct?.country ?? "CA";

                let timezone = countryTz[country];
                if (!timezone) {
                  timezone = await getTimezoneByCountry(country);
                  countryTz[country] = timezone;
                }

                const createdAtLocal = convertDateTimezone(
                  DateTime.utc(),
                  timezone
                );

                const settlementDateLocal = convertDateTimezone(
                  DateTime.fromJSDate(dtEnd, {
                    zone: "UTC",
                  }),
                  timezone
                );

                const savedSettlement = await SettlementRepository.save({
                  settlementId,
                  settlementPeriod:
                    emspData[ct.emspId]["settlementPeriod"] ?? "1 Week",
                  settlementDate: dtEnd,
                  settlementDateLocal,
                  contractId: ct.id,
                  emspId: ct.emspId,
                  country: ct.country,
                  numberOfTransactions,
                  settlementAmount,
                  paymentGateway: "moneris",
                  timezone,
                  createdAtLocal,
                  updatedAtLocal: createdAtLocal,
                });

                if (savedSettlement?.id) {
                  const settlementPartnerData = [
                    {
                      settlementId: savedSettlement?.id,
                      partnerId: ct?.cpoId,
                      partnerName: ct?.cpoName,
                      partnerEmail: ct?.cpoEmail,
                      partnerType: "CPO",
                      splitPercentage: ct?.cpoSplitPercentage,
                      amount: parseFloat(cpoTotalAmount ?? 0).toFixed(2),
                      bankName: partnerData[ct?.cpoId]?.bankName,
                      accountNumber: partnerData[ct?.cpoId]?.accountNumber,
                      timezone,
                      createdAtLocal,
                      updatedAtLocal: createdAtLocal,
                    },
                    {
                      settlementId: savedSettlement?.id,
                      partnerId: ct?.siteHostId,
                      partnerName: ct?.siteHostName,
                      partnerEmail: ct?.siteHostEmail,
                      partnerType: "Site Host",
                      splitPercentage: ct?.siteHostSplitPercentage,
                      amount: parseFloat(siteHostTotalAmount ?? 0).toFixed(2),
                      bankName: partnerData[ct?.siteHostId]?.bankName,
                      accountNumber: partnerData[ct?.siteHostId]?.accountNumber,
                      timezone,
                      createdAtLocal,
                      updatedAtLocal: createdAtLocal,
                    },
                  ];

                  if (ct?.investors?.length > 0) {
                    if (ct?.investors[0]?.partnerId) {
                      settlementPartnerData.push({
                        settlementId: savedSettlement?.id,
                        partnerId: ct?.investors[0]?.partnerId,
                        partnerName: ct?.investors[0]?.partnerName,
                        partnerEmail: ct?.investors[0]?.partnerEmail,
                        partnerType: "Investor",
                        splitPercentage: ct?.investors[0]?.splitPercentage,
                        amount: parseFloat(investor1TotalAmount ?? 0).toFixed(
                          2
                        ),
                        bankName:
                          partnerData[ct?.investors[0]?.partnerId]?.bankName,
                        accountNumber:
                          partnerData[ct?.investors[0]?.partnerId]
                            ?.accountNumber,
                        timezone,
                        createdAtLocal,
                        updatedAtLocal: createdAtLocal,
                      });
                    }
                    if (ct?.investors[1]?.partnerId) {
                      settlementPartnerData.push({
                        settlementId: savedSettlement?.id,
                        partnerId: ct?.investors[1]?.partnerId,
                        partnerName: ct?.investors[1]?.partnerName,
                        partnerEmail: ct?.investors[1]?.partnerEmail,
                        partnerType: "Investor",
                        splitPercentage: ct?.investors[1]?.splitPercentage,
                        amount: parseFloat(investor2TotalAmount ?? 0).toFixed(
                          2
                        ),
                        bankName:
                          partnerData[ct?.investors[1]?.partnerId]?.bankName,
                        accountNumber:
                          partnerData[ct?.investors[1]?.partnerId]
                            ?.accountNumber,
                        timezone,
                        createdAtLocal,
                        updatedAtLocal: createdAtLocal,
                      });
                    }
                  }

                  await SettlementPartnerRepository.save(settlementPartnerData);
                }

                if (savedSettlement?.id) {
                  await ChargerRevenueRepository.update(
                    { id: In(chargerRevenueIds) },
                    {
                      isSettlementGenerated: 1,
                      settlementId: savedSettlement?.id,
                    }
                  );
                }
              }
            }
          }
        }

        for (const key of Object.keys(emspData)) {
          const item = emspData[key];

          await EMspRepository.update(
            { id: item.emspId },
            {
              nextSettlementDate: item.nextDate,
              lastSettlementDate: dtEnd,
            }
          );
        }
      }
    }
  } catch (error) {
    console.error("SyncSettlementsCron Failed:", error.message);
  }
};

module.exports = { SyncSettlementsCron, syncSettlements };
