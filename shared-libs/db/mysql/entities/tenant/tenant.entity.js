const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Tenant",
  tableName: "tenant",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    name: {
      type: "varchar",
      nullable: false,
      length: 255,
    },
    endpoint: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    language: {
      type: "varchar",
      nullable: false,
      length: 255,
    },
    paymentModeId: {
      type: "json",
      nullable: false,
    },
    currency: {
      type: "varchar",
      nullable: true,
      length: 50,
    },
    businessImage: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    taxId: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    tenantAccountId: {
      type: "uuid",
      nullable: true,
    },
    isDeleted: {
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
