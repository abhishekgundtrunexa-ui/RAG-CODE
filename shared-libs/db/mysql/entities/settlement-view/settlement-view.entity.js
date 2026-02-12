const { EntitySchema } = require("typeorm");
const {
  SettlementPeriods,
  SettlementStatuses,
} = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "SettlementView",
  tableName: "settlement_view",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    settlementId: {
      type: "varchar",
      length: 255,
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
    emspId: {
      type: "uuid",
      nullable: false,
    },
    country: {
      type: "varchar",
      nullable: true,
    },
    emspBankName: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    emspAccountNumber: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    contractId: {
      type: "uuid",
      nullable: false,
    },
    contractCode: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    cpoId: {
      type: "uuid",
      nullable: false,
    },
    cpoName: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    cpoEmail: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    cpoSplitPercentage: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    cpoAmount: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    cpoVerificationStatus: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    cpoBankVerificationStatus: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    cpoCreatedAt: {
      type: "timestamp",
      nullable: false,
    },
    cpoBankName: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    cpoBankAccountNumber: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    cpoTransferStatus: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    siteHostId: {
      type: "uuid",
      nullable: false,
    },
    siteHostName: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    siteHostEmail: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    siteHostSplitPercentage: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    siteHostAmount: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    siteHostVerificationStatus: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    siteHostBankVerificationStatus: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    siteHostCreatedAt: {
      type: "timestamp",
      nullable: false,
    },
    siteHostBankName: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    siteHostBankAccountNumber: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    siteHostTransferStatus: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    investors: {
      type: "json",
      nullable: false,
    },
    investorName: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    investorSplitPercentage: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    evseStationCount: {
      type: "int",
      nullable: false,
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
      length: 255,
      nullable: false,
    },
    status: {
      type: "enum",
      enum: SettlementStatuses,
      nullable: false,
    },
    invoicePdf: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    timezone: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    createdAt: {
      type: "timestamp",
      nullable: false,
    },
    updatedAt: {
      type: "timestamp",
      nullable: false,
    },
    createdAtLocal: {
      type: "timestamp",
      nullable: false,
    },
    updatedAtLocal: {
      type: "timestamp",
      nullable: false,
    },
  },
});
