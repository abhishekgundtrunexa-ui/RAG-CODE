const { BankVerificationStatuses } = require("@shared-libs/constants");
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Partner",
  tableName: "partner",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    userId: {
      type: "uuid",
      nullable: false,
    },
    partnerCode: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    companyName: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    country: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    state: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    pincode: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    businessNumber: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    companyGstAccountNumber: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    federalTaxPercentage: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    provincialSalesTaxPercentage: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    harmonizedSalesTaxPercentage: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    taxCertificate: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    taxCertificateDocumentId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    incorporationCertificate: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    incorporationCertificateDocumentId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    businessPanNumber: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    centralGstPercentage: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    stateGstPercentage: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    integratedGstPercentage: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    bankName: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    branchNumber: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    institutionNumber: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    accountNumber: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    ifscCode: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    accountType: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    bankAddress: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    bankVerificationLetter: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    bankVerificationLetterDocumentId: {
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
    bankVerificationActionTakenBy: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    isDeleted: {
      type: "boolean",
      default: false,
    },
    createdBy: {
      type: "uuid",
      nullable: true,
    },
    updatedBy: {
      type: "uuid",
      nullable: true,
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
