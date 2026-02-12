const { LocalizationCodesRepository } = require("@shared-libs/db/mysql");
const {
  LocalizationCodeData,
} = require("@shared-libs/constants/localization-codes");

const SeedLocalizationCodesData = async () => {
  try {
    const existingRecords = await LocalizationCodesRepository.find();
    if (existingRecords.length === 0) {
      await LocalizationCodesRepository.save(LocalizationCodeData);
      console.log("Localization Codes seeding done!");
    }
  } catch (error) {
    console.error("Error Seeding Localization Codes in database:", error);
  }
};

module.exports = { SeedLocalizationCodesData };
