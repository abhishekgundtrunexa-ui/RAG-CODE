const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "PaymentTransactions",
  tableName: "payment_transactions",
  columns: {
    paymentTransactionId: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    ocppTransactionId: {
      type: "uuid",
    },
    cpoId: {
      type: "uuid",
      nullable: true,
    },
    chargeBoxId: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    connectorId: {
      type: "int",
      nullable: false,
    },
    hashedPan: {
      type: "varchar",
      nullable: true,
      length: 1000,
    },
    idTag: {
      type: "varchar",
      nullable: true,
      length: 1000,
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

    purchaseAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    purchaseCurrency: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    purchaseStatus: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    purchaseRefId: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    purchaseResponse: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    purchaseResponseCode: {
      type: "varchar",
      nullable: true,
      length: 255,
    },

    preauthAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    preauthCurrency: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    preauthStatus: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    preauthRefId: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    preauthResponse: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    preauthResponseCode: {
      type: "varchar",
      nullable: true,
      length: 255,
    },

    preauthCompleteAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    preauthCompleteCurrency: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    preauthCompleteStatus: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    preauthCompleteRefId: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    preauthCompleteResponse: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    preauthCompleteResponseCode: {
      type: "varchar",
      nullable: true,
      length: 255,
    },

    evmDataAddResponse: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    evmDataAddResponseCode: {
      type: "varchar",
      nullable: true,
      length: 255,
    },

    refundAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
      default: null,
    },
    refundCurrency: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    refundStatus: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    refundRefId: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    refundResponse: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    refundResponseCode: {
      type: "varchar",
      nullable: true,
      length: 255,
    },

    deviceId: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    deviceType: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    posCode: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    status: {
      type: "varchar",
      default: "Pending",
      length: 255,
    },
    upiQrCodeLink: {
      type: "varchar",
      nullable: true,
      length: 1000,
    },
    meterStop: {
      type: "int",
      nullable: false,
    },
    requestedAt: {
      type: "timestamp",
      nullable: true,
    },
    isDeleted: {
      type: "boolean",
      default: false,
    },
    createdAtLocal: {
      type: "timestamp",
      nullable: true,
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
