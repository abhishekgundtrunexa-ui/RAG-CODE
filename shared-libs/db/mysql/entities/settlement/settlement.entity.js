const { EntitySchema } = require("typeorm");
const {
  SettlementPeriods,
  SettlementStatuses,
} = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "Settlement",
  tableName: "settlement",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    settlementId: {
      type: "varchar",
      nullable: false,
    },
    settlementPeriod: {
      type: "enum",
      enum: SettlementPeriods,
    },
    settlementDate: {
      type: "timestamp",
      nullable: false,
    },
    settlementDateLocal: {
      type: "timestamp",
      nullable: false,
    },
    contractId: {
      type: "uuid",
      nullable: false,
    },
    emspId: {
      type: "uuid",
      nullable: false,
    },
    country: {
      type: "varchar",
      nullable: true,
    },
    numberOfTransactions: {
      type: "int",
      nullable: false,
    },
    settlementAmount: {
      type: "decimal",
      nullable: false,
    },
    paymentGateway: {
      type: "varchar",
      nullable: false,
    },
    status: {
      type: "enum",
      enum: SettlementStatuses,
    },
    invoicePdf: {
      type: "varchar",
      nullable: true,
    },
    timezone: {
      type: "varchar",
      nullable: false,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
    createdAtLocal: {
      type: "timestamp",
      nullable: true,
    },
    updatedAtLocal: {
      type: "timestamp",
      nullable: true,
    },
  },
});
