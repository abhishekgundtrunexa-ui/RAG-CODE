const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "OcppTransactions",
  tableName: "ocpp_transactions",
  columns: {
    transactionUuid: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    orderId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    customerId: {
      type: "uuid",
      nullable: true,
    },
    contractId: {
      type: "uuid",
      nullable: true,
    },
    cpoId: {
      type: "uuid",
      nullable: true,
    },
    chargerTransactionId: {
      type: "int",
      nullable: false,
    },
    connectorId: {
      type: "int",
      nullable: false,
    },
    chargeBoxId: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    evseStationId: {
      type: "uuid",
      nullable: false,
    },
    idTag: {
      type: "varchar",
      nullable: true,
    },
    hashedPan: {
      type: "varchar",
      nullable: true,
      length: 1000,
    },
    timezone: {
      type: "varchar",
      nullable: true,
    },
    country: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    meterStart: {
      type: "decimal",
      nullable: false,
    },
    meterStop: {
      type: "decimal",
      nullable: false,
    },
    startTime: {
      type: "timestamp",
      nullable: false,
    },
    endTime: {
      type: "timestamp",
      nullable: true,
    },
    startTimeLocal: {
      type: "timestamp",
      nullable: true,
      default: null,
    },
    endTimeLocal: {
      type: "timestamp",
      nullable: true,
      default: null,
    },
    createdAtLocal: {
      type: "timestamp",
      nullable: true,
      default: null,
    },
    paymentReferenceId: {
      type: "varchar",
      nullable: true,
    },
    paymentStatus: {
      type: "varchar",
      nullable: true,
      default: "pending",
    },
    transactionStatus: {
      type: "varchar",
      nullable: true,
      default: "preauth",
    },
    chargingDuration: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    effectiveBaseRate: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    effectiveEnergyLoss: {
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
    parkingFee: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    peakCharges: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    offPeakCharges: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    penaltyAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    baseFare: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    grossAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    afterDiscountedAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    taxableAmount: {
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
    taxRate: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    tax: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    discountedAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    parkingRatePerHour: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    netAmount: {
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
    invoicePdfUrl: {
      type: "varchar",
      nullable: true,
    },
    invoiceQRUrl: {
      type: "varchar",
      nullable: true,
    },
    chargingSessionDate: {
      type: "date",
      nullable: true,
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
    aid: {
      type: "varchar",
      nullable: true,
    },
    tvr: {
      type: "varchar",
      nullable: true,
    },
    tsi: {
      type: "varchar",
      nullable: true,
    },
    appLabel: {
      type: "varchar",
      nullable: true,
    },
    paymentAuthCode: {
      type: "varchar",
      nullable: true,
    },
    paymentReference: {
      type: "varchar",
      nullable: true,
    },
    paymentResponseCode: {
      type: "varchar",
      nullable: true,
    },
    paymentIsoCode: {
      type: "varchar",
      nullable: true,
    },
    paymentMessage: {
      type: "varchar",
      nullable: true,
    },
    isFinished: {
      type: "boolean",
      default: false,
    },
    isPaid: {
      type: "boolean",
      default: false,
    },
    isTestTransaction: {
      type: "boolean",
      default: false,
    },
    purchaseOnly: { type: "boolean", default: false },
    language: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "en",
    },
    maxAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: 0,
    },
    isPreauthReached: {
      type: "boolean",
      default: false,
    },
    startMethod: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "By Card",
    },
    endMethod: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "By Card",
    },
    remark: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "By Card",
    },
    paymentProvider: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "moneris",
    },
    paymentType: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "Pre-Auth",
    },
    isDeleted: {
      type: "boolean",
      default: false,
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
