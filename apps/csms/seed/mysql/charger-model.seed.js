const { ChargerModelMapping } = require("@shared-libs/constants");
const { ChargerModelRepository } = require("@shared-libs/db/mysql");

const SeedChargerModels = async () => {
  try {
    const chargerModelsInDb = await ChargerModelRepository.find();
    if (chargerModelsInDb.length === 0) {
      const bulkInsertData = [];
      Object.keys(ChargerModelMapping).forEach((key) => {
        bulkInsertData.push({
          type: key,
          description: ChargerModelMapping[key],
        });
      });

      await ChargerModelRepository.save(bulkInsertData);
      console.log("Charger connector models seeding done.");
    }
  } catch (error) {
    console.error("Error seeding charger connector models in database:", error);
  }
};

module.exports = { SeedChargerModels };
