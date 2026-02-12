const { ChargerConnectorPairMapping } = require("@shared-libs/constants");
const { ChargerConnectorPairRepository } = require("@shared-libs/db/mysql");

const SeedChargerConnectorPairs = async () => {
  try {
    // Check if there are existing records
    const chargerConnectorPairsInDb =
      await ChargerConnectorPairRepository.find();

    if (chargerConnectorPairsInDb.length === 0) {
      // Prepare bulk insert data
      const bulkInsertData = Object.keys(ChargerConnectorPairMapping).map(
        (key) => ({
          type: key,
          description: ChargerConnectorPairMapping[key],
        })
      );

      await ChargerConnectorPairRepository.save(bulkInsertData);
      console.log("Charger connector pairs seeding done.");
    }
  } catch (error) {
    console.error("Error seeding charger connector pairs in database:", error);
  }
};

module.exports = { SeedChargerConnectorPairs };
