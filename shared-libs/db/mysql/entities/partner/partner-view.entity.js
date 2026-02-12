const { EntitySchema } = require("typeorm");
const {
  UserStatuses,
  BankVerificationStatuses,
} = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "PartnerView",
  tableName: "partner_view",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    partnerType: {
      type: "varchar",
      length: 1000,
      nullable: false,
    },
    partnerCode: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    fullName: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    email: {
      type: "varchar",
      length: 255,
      nullable: false,
      unique: true,
    },
    country: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    phoneNumber: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    profilePicture: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    permissions: {
      type: "json",
      nullable: true,
      default: "[]",
    },
    timezone: {
      type: "varchar",
      length: 255,
      default: "UTC",
    },
    dateFormat: {
      type: "varchar",
      length: 255,
      default: "dd-MM-yyyy",
    },
    status: {
      type: "enum",
      enum: UserStatuses,
      nullable: false,
    },
    onboardedAt: {
      type: "timestamp",
      nullable: true,
    },
    lastLogin: {
      type: "timestamp",
      nullable: true,
    },
    lastLoginLocal: {
      type: "timestamp",
      nullable: true,
    },
    companyName: {
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
      nullable: false,
    },
    bankVerificationActionTakenBy: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    bankVerificationActionTakenByUserName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    bankVerificationActionTakenByUserEmail: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    createdByEmail: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    createdByName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    updatedByEmail: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    updatedByName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    isDeleted: {
      type: "boolean",
      default: false,
    },
    isOnboarded: {
      type: "boolean",
      default: false,
    },
    stations: {
      type: "int",
      nullable: true,
      default: 0,
    },
    chargers: {
      type: "int",
      nullable: true,
      default: 0,
    },
    currencySymbol: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    grossRevenue: {
      type: "varchar",
      length: 255,
      nullable: true,
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
    createdAtLocal: {
      type: "timestamp",
      nullable: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
    updatedAtLocal: {
      type: "timestamp",
      nullable: true,
    },
  },
});
