const { EntitySchema } = require("typeorm");
const { PartnerTypes } = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "ContractPartners",
  tableName: "contract_partners",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    contractId: {
      type: "uuid",
      nullable: false,
    },
    partnerId: {
      type: "uuid",
      nullable: false,
    },
    partnerType: {
      type: "enum",
      enum: PartnerTypes,
      nullable: false,
    },
    splitPercentage: {
      type: "int",
      nullable: false,
    },
    isVerified: {
      type: "boolean",
      default: false,
      nullable: false,
    },
    consent: {
      type: "boolean",
      default: false,
      nullable: false,
    },
    isDeleted: {
      type: "boolean",
      default: false,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
      nullable: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
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
  },
});
