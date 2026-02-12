const { EntitySchema } = require("typeorm");
const { ContractColumns } = require("./contract-columns.data");

module.exports = new EntitySchema({
  name: "Contract",
  tableName: "contract",
  columns: ContractColumns,
});
