const { initializeMongoDB } = require("@shared-libs/db/mongo-db");
const { initializeMySQL } = require("@shared-libs/db/mysql");

module.exports = async () => {
  const USE_DB = process.env.USE_DB;
  if (USE_DB == "true") {
    await initializeMySQL();
    await initializeMongoDB();
  }
};
