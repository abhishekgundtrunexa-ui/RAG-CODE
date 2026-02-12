const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "CpoBaseRate",
  tableName: "cpo_base_rate",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    cpoId: {
      type: "uuid",
      nullable: true,
    },
    name: {
      type: "varchar",
      length: 255,
      nullable: true,
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
    isDefault: {
      type: "boolean",
      default: false,
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
