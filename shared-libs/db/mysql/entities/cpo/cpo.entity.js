const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Cpo",
  tableName: "cpo",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    name: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    endpoint: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    taxation: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    billingAddress: {
      type: "text",
      nullable: true,
    },
    country: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    currency: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    currencyName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    currencySymbol: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    language: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    profilePicture: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    multypartyRevenue: {
      type: "boolean",
      default: false
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
