const { SeedCountries, SeedCronSchedulers } = require("./mongo-db");
const {
  SeedChargerConnectorPairs,
  SeedChargerModels,
  SeedChargerConnectorTypes,
  SeedUniversalBaseRate,
  SeedSubscriptionPlan,
  SeedChargeUsageType,
  SeedRegionalElectricityRate,
  SeedServiceRequestCategories,
  SeedFaq,
  SeedConfigConstants,
  SeedPaymentMode,
  SeedFeedBackCannedMessages,
  SeedCpo,
  SeedEvseStation,
  SeedChargers,
  SeedLocalizationCodesData,
  SeedLanguage,
  SeedSuperAdmin,
  SeedApiKey,
} = require("./mysql");

const seedMongoDBData = async () => {
  try {
    await SeedCountries();
    await SeedCronSchedulers();
  } catch (err) {
    console.error("Error seeding data:", err);
    throw err;
  }
};

const seedMySqlDBData = async () => {
  try {
    await SeedLanguage();
    await SeedChargerConnectorPairs();
    await SeedChargerModels();
    await SeedChargerConnectorTypes();
    await SeedSuperAdmin();
    await SeedUniversalBaseRate();
    await SeedSubscriptionPlan();
    await SeedChargeUsageType();
    await SeedRegionalElectricityRate();
    await SeedServiceRequestCategories();
    await SeedFaq();
    await SeedConfigConstants();
    await SeedPaymentMode();
    await SeedFeedBackCannedMessages();
    // await SeedCpo();
    // await SeedEvseStation();
    // await SeedChargers();
    await SeedLocalizationCodesData();
    await SeedApiKey();
  } catch (err) {
    console.error("Error seeding data:", err);
    throw err;
  }
};

module.exports = { seedMongoDBData, seedMySqlDBData };
