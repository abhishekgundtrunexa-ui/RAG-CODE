const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ChargerRevenue",
  tableName: "charger_revenue",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    ocppTransactionId: {
      type: "uuid",
    },
    chargerId: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    orderId: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    evseStationId: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    chargeBoxId: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    paymentProvider: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
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
    dateTime: {
      type: "timestamp",
      nullable: true,
    },
    dateTimeLocal: {
      type: "timestamp",
      nullable: true,
    },
    amount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      default: 0,
    },
    refundAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      default: 0,
    },
    totalAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      default: 0,
    },
    taxAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    effectiveEnergyConsumed: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    chargingDuration: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    avgChargingRate: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    isTestTransaction: {
      type: "boolean",
      default: false,
    },
    purchaseOnly: { type: "boolean", default: false },
    contractId: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: null,
    },
    cpoId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    cpoSplitPercentage: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    cpoAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    siteHostId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    siteHostSplitPercentage: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    siteHostAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    investor1Id: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    investor1SplitPercentage: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    investor1Amount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    investor2Id: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    investor2SplitPercentage: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    investor2Amount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    investorAmounts: {
      type: "json",
      nullable: true,
    },
    settlementId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    isSettlementGenerated: {
      type: "boolean",
      default: false,
    },
    isSettled: {
      type: "boolean",
      default: false,
    },
    isSettledForCpo: {
      type: "boolean",
      default: false,
    },
    isSettledForSiteHost: {
      type: "boolean",
      default: false,
    },
    isSettledForInvestor1: {
      type: "boolean",
      default: false,
    },
    isSettledForInvestor2: {
      type: "boolean",
      default: false,
    },
    currency: {
      type: "varchar",
      nullable: true,
    },
    currencyName: {
      type: "varchar",
      nullable: true,
    },
    currencySymbol: {
      type: "varchar",
      nullable: true,
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
