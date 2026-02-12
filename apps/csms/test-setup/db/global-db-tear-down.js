const { MySQLDataSource } = require("@shared-libs/db/mysql");
const mongoose = require("mongoose");

module.exports = async () => {
  const USE_DB = process.env.USE_DB;
  if (USE_DB == "true") {
    await mongoose.disconnect();
    await MySQLDataSource.close();
  }
};
