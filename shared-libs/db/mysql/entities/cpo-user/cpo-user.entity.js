const { EntitySchema } = require("typeorm");
const { UserStatuses } = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "CpoUser",
  tableName: "cpo_user",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    cpoId: {
      type: "uuid",
      nullable: true,
    },
    isOwner: {
      type: "boolean",
      default: false,
    },
    cpoUserRoleId: {
      type: "uuid",
      nullable: false,
    },
    stripeCustomerId: {
      type: "varchar",
      length: 255,
      nullable: true,
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
    status: {
      type: "enum",
      enum: UserStatuses,
      nullable: false,
      default: UserStatuses.REGISTERED,
    },
    department: {
      type: "varchar",
      default: "Other",
    },
    onBoardingStatus: {
      type: "int",
      default: 0,
    },
    isPartner: {
      type: "boolean",
      default: false
    },
    lastLogin: {
      type: "timestamp",
      nullable: true,
    },
    resetPasswordCode: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    resetPasswordExpiresAt: {
      type: "timestamp",
      nullable: true,
    },
    resetPasswordRequestedAt: {
      type: "timestamp",
      nullable: true,
    },
    businessName: {
      type: "varchar",
      nullable: true
    },
    taxationId: {
      type: "varchar",
      nullable: true,
    },
    country: {
      type: "varchar",
      nullable: true
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
  relations: {
    cpoUserRoleId: {
      type: "one-to-one",
      target: "CpoUserRole",
      joinColumn: { name: "cpoUserRoleId" },
    },
  },
});
