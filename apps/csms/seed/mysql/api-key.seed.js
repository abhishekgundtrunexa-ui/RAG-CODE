const { ApiKeysRepository } = require("@shared-libs/db/mysql");
const { randomBytes } = require("crypto");

const SeedApiKey = async () => {
  try {
    const hasApiKeys = await ApiKeysRepository.find({
      where: { isDeleted: false },
    });

    if (hasApiKeys.length === 0) {
      let apiKey = randomBytes(16).toString("hex");

      // Loop until a unique apiKey is generated
      while (
        await ApiKeysRepository.findOne({ where: { apiKey, isDeleted: false } })
      ) {
        apiKey = randomBytes(16).toString("hex");
      }

      const newApiKey = ApiKeysRepository.create({ apiKey });
      await ApiKeysRepository.save(newApiKey);
      console.log(`ApiKey created: ${apiKey}`);
    }
  } catch (error) {
    console.error("Error seeding ApiKey in database:", error);
  }
};

module.exports = { SeedApiKey };
