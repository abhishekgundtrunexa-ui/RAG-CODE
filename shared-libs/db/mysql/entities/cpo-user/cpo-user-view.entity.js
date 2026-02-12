const { EntitySchema } = require("typeorm");
const { UserStatuses } = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "CpoUserView",
  tableName: "cpo_user_view",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    firstName: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    lastName: {
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
    stripeCustomerId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    status: {
      type: "enum",
      enum: UserStatuses,
      nullable: false,
      default: UserStatuses.REGISTERED,
    },
    lastLogin: {
      type: "timestamp",
      nullable: true,
    },
    isOwner: {
      type: "boolean",
      default: false,
    },
    multypartyRevenue: {
      type: "boolean"
    },
    isDeleted: {
      type: "boolean",
      default: false,
    },
    cpoUserRoleId: {
      type: "uuid",
      nullable: false,
    },
    cpoUserRoleName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    cpoUserRoleCode: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    cpoId: {
      type: "uuid",
      nullable: true,
    },
    cpoName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    cpoLogo: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    cpoCountry: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    isCpoDeleted: {
      type: "boolean",
      default: false,
    },
    createdAt: {
      type: "timestamp",
      nullable: true,
    },
    updatedAt: {
      type: "timestamp",
      nullable: true,
    },
    stationCount: {
      type: "int",
      nullable: true,
      default: 0,
    },
    chargerCount: {
      type: "int",
      nullable: true,
      default: 0,
    },
  },
});
