const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ContractChargerView",
  tableName: "contract_charger_view",
  columns: {
    contractId: {
      type: "uuid",
      nullable: true,
      primary: true,
    },
    chargerId: {
      type: "uuid",
      nullable: true,
      primary: true,
    },
    chargeBoxId: {
      type: "uuid",
      nullable: true,
      primary: true,
    },
    evseStationId: {
      type: "uuid",
      nullable: true,
      primary: true,
    },
    contractCode: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    validFrom: {
      type: "timestamp",
      nullable: true,
    },
    validTo: {
      type: "timestamp",
      nullable: true,
    },
    isDeleted: {
      type: "boolean",
      default: false,
    },
    isExpired: {
      type: "boolean",
      default: false,
    },
    emspId: {
      type: "varchar",
      length: 255,
      nullable: false,
      default: null,
    },
    country: {
      type: "varchar",
      length: 255,
      nullable: false,
      default: null,
    },
    createdAt: {
      type: "timestamp",
      nullable: true,
    },
  },
});
