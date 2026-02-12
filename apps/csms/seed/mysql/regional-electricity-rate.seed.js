const { RegionalElectricityRateRepository } = require("@shared-libs/db/mysql");

const SeedRegionalElectricityRate = async () => {
  try {
    const existingRecords = await RegionalElectricityRateRepository.find();
    if (existingRecords.length === 0) {
      const regionalElectricityRates = [
        {
          country: "US",
          rate: 0.19,
          currency: "USD",
          currencyName: "USD",
          currencySymbol: "USD",
        },
        {
          country: "CA",
          rate: 0.1,
          currency: "CAD",
          currencyName: "Canadian Dollar",
          currencySymbol: "CAD$",
        },
        {
          country: "IN",
          rate: 10,
          currency: "INR",
          currencyName: "Indian Rupee",
          currencySymbol: "₹",
        },
        {
          country: "NL",
          rate: 0.33,
          currency: "EUR",
          currencyName: "Euro",
          currencySymbol: "€",
        },
      ];

      await RegionalElectricityRateRepository.save(regionalElectricityRates);
      console.log("Regional Electricity Rate seeding done!");
    }
  } catch (error) {
    console.error(
      "Error Seeding Regional Electricity Rate in database:",
      error
    );
  }
};

module.exports = { SeedRegionalElectricityRate };
