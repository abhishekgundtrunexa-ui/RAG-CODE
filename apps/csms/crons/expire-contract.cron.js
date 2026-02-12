const cron = require("node-cron");
const { DateTime } = require("luxon");
const { ContractRepository } = require("@shared-libs/db/mysql");
const { LessThan } = require("typeorm");

const EXPIRE_CONTRACT_INTERVAL = "1 0 * * *"; // Runs everyday at 00:05 AM

const ExpireContractCron = () => {
  cron.schedule(EXPIRE_CONTRACT_INTERVAL, async () => {
    await expireContract();
  });
};

const expireContract = async () => {
  try {
    const dtEnd = DateTime.utc()
      .minus({ day: 1 })
      .endOf("day")
      .toJSDate({ zone: "UTC" });

    await ContractRepository.update(
      { isDeleted: false, isExpired: false, validTo: LessThan(dtEnd) },
      {
        isExpired: true,
      }
    );
  } catch (error) {
    console.error("ExpireContractCron Failed:", error.message);
  }
};

module.exports = { ExpireContractCron };
