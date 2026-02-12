const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ChargerEtTestingTransactions",
  tableName: "charger_et_testing_transactions",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    chargeBoxId: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    testCaseId: {
      type: "varchar",
      nullable: true,
      length: 1000,
    },
    ocppTransactionId: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    preAuthAmount: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    purchaseAmount: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    purchaseOnly: { type: "boolean", default: false },
    timezone: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    country: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    createdAtLocal: {
      type: "timestamp",
      nullable: true,
      default: null,
    },
    createdAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    updatedAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
});
