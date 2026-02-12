const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ChargerConstants",
  tableName: "charger_constants",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    chargerId: {
      type: "uuid",
      nullable: false,
    },
    chargeBoxId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    avgChargingDurationInSec: {
      type: "decimal",
      default: 0,
    },
    maxChargerPowerInKw: {
      type: "decimal",
      default: 0,
    },
    contingencyPercentage: {
      type: "decimal",
      default: 0,
    },
    transactionFeePercentage: {
      type: "decimal",
      default: 0,
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
