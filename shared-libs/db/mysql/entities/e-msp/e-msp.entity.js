const { BankVerificationStatuses, SettlementPeriods } = require("@shared-libs/constants");
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EMsp",
  tableName: "e_msp",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    name: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    email: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    phone: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    registeredAddress: {
      type: "text",
      nullable: true,
    },
    billingAddress: {
      type: "text",
      nullable: true,
    },
    country: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    currency: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    language: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    profilePicture: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    bankVerificationStatus: {
      type: "enum",
      enum: BankVerificationStatuses,
      default: BankVerificationStatuses.PENDING,
      nullable: false,
    },
    taxCertificateDocumentId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    incorporationCertificateDocumentId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    bankVerificationLetterDocumentId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    bankVerificationActionTakenBy: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    settlementPeriod: {
      type: "enum",
      enum: SettlementPeriods,
      default: SettlementPeriods.WEEKLY,
      nullable: false,
    },
    lastSettlementDate: {
      type: "timestamp",
      nullable: true,
    },
    nextSettlementDate: {
      type: "timestamp",
      nullable: true,
    },
    createdBy: {
      type: "uuid",
      nullable: true,
    },
    isOwner: {
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
