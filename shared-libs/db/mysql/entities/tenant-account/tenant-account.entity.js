const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "TenantAccount",
  tableName: "tenant_account",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    accountName: {
      type: "varchar",
      nullable: false,
      length: 255,
    },
    accountNumber: {
      type: "varchar",
      nullable: false,
      length: 255,
    },
    isDefault: {
      type: "boolean",
      default: false,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
  },
});
