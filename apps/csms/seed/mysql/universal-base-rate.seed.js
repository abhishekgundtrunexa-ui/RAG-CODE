const { UniversalBaseRateRepository } = require("@shared-libs/db/mysql");

const SeedUniversalBaseRate = async () => {
  try {
    const universalBaseRateData = await UniversalBaseRateRepository.find();
    if (universalBaseRateData.length === 0) {
      await UniversalBaseRateRepository.save({
        baseRateKWH: 0.42,
        parkingRate: 5,
        taxRate: 13,
        discount: 0,
        penalty: 5,
      });

      console.log("Universal Base Rate seeding done.");
    }
  } catch (error) {
    console.error("Error seeding Universal Base Rate in database:", error);
  }
};

module.exports = { SeedUniversalBaseRate };
