const {
  CountryBaseRateData,
} = require("@shared-libs/constants/country-base-rate");
const { CurrencyData } = require("@shared-libs/constants/country-currency");
const {
  CountryLanguageData,
} = require("@shared-libs/constants/country-language");
const { CountryModel } = require("@shared-libs/db/mongo-db");
const { StateModel } = require("@shared-libs/db/mongo-db/models");
const { Country, State } = require("country-state-city");

const SeedCountries = async () => {
  try {
    const countriesInDb = await CountryModel.find({});
    if (countriesInDb.length === 0) {
      const countries = Country.getAllCountries();

      const countryDocs = [];
      const stateDocs = [];

      countries.forEach((country) => {
        const currencyData = CurrencyData[country.currency] ?? null;
        const language = CountryLanguageData[country.isoCode] ?? null;
        const baseRate = CountryBaseRateData[country.isoCode] ?? null;

        // Add to countryDocs
        countryDocs.push({
          name: country.name,
          isoCode: country.isoCode,
          flag: country.flag,
          phoneCode: country.phonecode,
          currency: country.currency,
          currencyName: currencyData?.name ?? null,
          currencySymbol: currencyData?.symbol ?? null,
          latitude: country.latitude,
          longitude: country.longitude,
          timezones: country.timezones,
          language,
          baseRate,
        });

        // Add corresponding states
        const states = State.getStatesOfCountry(country.isoCode);
        states.forEach((state) => {
          stateDocs.push({
            name: state.name,
            isoCode: state.isoCode,
            countryIsoCode: country.isoCode,
          });
        });
      });

      // Insert countries and states after preparing all data
      if (countryDocs.length > 0) {
        await CountryModel.insertMany(countryDocs);
        console.log("Charger countries seeding done.");
      }

      if (stateDocs.length > 0) {
        await StateModel.insertMany(stateDocs);
        console.log("✅ States seeded successfully.");
      }
    }
  } catch (error) {
    console.error("Error seeding countries in database:", error);
  }
};

module.exports = { SeedCountries };
