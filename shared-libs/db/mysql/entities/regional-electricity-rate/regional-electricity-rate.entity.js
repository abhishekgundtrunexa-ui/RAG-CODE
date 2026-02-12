const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "RegionalElectricityRate",
  tableName: "regional_electricity_rate",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    country: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    state: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    city: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    area: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    postalCode: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    rate: {
      type: "decimal",
      default: 0,
    },
    currency: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "USD",
    },
    currencyName: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "US Dollar",
    },
    currencySymbol: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "$",
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
