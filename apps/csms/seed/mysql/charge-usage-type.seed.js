const { ChargerUsageTypeRepository } = require("@shared-libs/db/mysql");
const {
  ChargeUsageTypeMapping,
  ChargeUsageType,
} = require("@shared-libs/constants");

const SeedChargeUsageType = async () => {
  try {
    const chargeUsageType = [
      {
        mappingText: ChargeUsageType.PRIVATE,
        displayText: ChargeUsageTypeMapping[ChargeUsageType.PRIVATE],
      },
      {
        mappingText: ChargeUsageType.PUBLIC,
        displayText: ChargeUsageTypeMapping[ChargeUsageType.PUBLIC],
      },
    ];

    for (const eachChargeUsageType of chargeUsageType) {
      const existingChargeUsageType =
        await ChargerUsageTypeRepository.findOneBy({
          mappingText: eachChargeUsageType.mappingText,
        });

      if (!existingChargeUsageType) {
        const newChargeUsageType =
          ChargerUsageTypeRepository.create(eachChargeUsageType);
        await ChargerUsageTypeRepository.save(newChargeUsageType);
        console.log(
          `ChargeUsageType created: ${eachChargeUsageType.mappingText}`
        );
      }
    }
  } catch (error) {
    console.error("Error seeding ChargeUsageType in database:", error);
  }
};

module.exports = { SeedChargeUsageType };
