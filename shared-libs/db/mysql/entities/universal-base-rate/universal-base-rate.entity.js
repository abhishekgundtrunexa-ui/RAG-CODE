const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "UniversalBaseRate",
  tableName: "universal_base_rate",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    baseRateKWH: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    parkingRate: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    taxRate: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    discount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    penalty: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
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
