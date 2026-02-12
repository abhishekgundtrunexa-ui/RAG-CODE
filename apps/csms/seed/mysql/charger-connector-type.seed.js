const {
  ChargerConnectorTypes,
  ChargerConnectorTypesLabelMapping,
} = require("@shared-libs/constants");
const { ChargerConnectorTypeRepository } = require("@shared-libs/db/mysql");

const SeedChargerConnectorTypes = async () => {
  try {
    const connectorTypesInDb = await ChargerConnectorTypeRepository.find();
    if (connectorTypesInDb.length === 0) {
      const connectorTypes = [
        {
          mappingText: ChargerConnectorTypes.TYPE1,
          displayText:
            ChargerConnectorTypesLabelMapping[ChargerConnectorTypes.TYPE1],
        },
        {
          mappingText: ChargerConnectorTypes.TYPE2,
          displayText:
            ChargerConnectorTypesLabelMapping[ChargerConnectorTypes.TYPE2],
        },
        {
          mappingText: ChargerConnectorTypes.CC2,
          displayText:
            ChargerConnectorTypesLabelMapping[ChargerConnectorTypes.CC2],
        },
      ];

      await ChargerConnectorTypeRepository.save(connectorTypes);
      console.log("Charger connector type seeding done.");
    }
  } catch (error) {
    console.error("Error seeding charger connector types in database:", error);
  }
};

module.exports = { SeedChargerConnectorTypes };
