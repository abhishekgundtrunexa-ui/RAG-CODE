const { EvseStationRepository } = require("@shared-libs/db/mysql");

const SeedEvseStation = async () => {
  try {
    // Check if there are existing records
    const evseStationData = await EvseStationRepository.find();

    if (evseStationData.length === 0) {
      const commonEvseData = {
        address: "Navi Mumbai Site",
        city: "Mahape",
        state: "Maharashtra",
        country: "IN",
        areaCode: "400701",
        lat: "19.1109087",
        lng: "73.0286094",
        isDeleted: false,
      };

      const evseStation = [
        {
          name: "Chargnex Workshop",
          ...commonEvseData,
        },
        {
          name: "McDonalds",
          ...commonEvseData,
        },
        {
          name: "DMart",
          ...commonEvseData,
        },
        {
          name: "Central Mall",
          ...commonEvseData,
        },
        {
          name: "Subway",
          ...commonEvseData,
        },
        {
          name: "KFC",
          ...commonEvseData,
        },
        {
          name: "Changi Airport",
          address: "60 Airport Blvd., Singapore",
          city: "Qantas",
          state: "Changi",
          country: "MY",
          areaCode: "819643",
          lat: "1.3586",
          lng: "103.9899",
          isDeleted: false,
        },
      ];

      await EvseStationRepository.save(evseStation);
      console.log("Evse Stations seeding done.");
    }
  } catch (error) {
    console.error("Error Seeding Evse Stations in database:", error);
  }
};

module.exports = { SeedEvseStation };
