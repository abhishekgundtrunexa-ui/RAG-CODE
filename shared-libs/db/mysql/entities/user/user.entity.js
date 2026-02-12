const { EntitySchema } = require("typeorm");
const { UserColumns } = require("./user-columns.data");

module.exports = new EntitySchema({
  name: "User",
  tableName: "user",
  columns: UserColumns,
});
