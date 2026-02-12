const { UserStatuses } = require("@shared-libs/constants");

const UserColumns = {
  id: {
    type: "uuid",
    primary: true,
    generated: "uuid",
  },
  firstName: {
    type: "varchar",
    length: 255,
    nullable: true, // Updated from false
  },
  lastName: {
    type: "varchar",
    length: 255,
    nullable: true, // Updated from false
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
  departmentId: {
    // Type and default updated
    type: "uuid", // Changed from varchar
    nullable: true,
    // Default removed as it's a UUID in SQL
  },
  userRoleId: {
    type: "uuid",
    nullable: true,
  },
  permissions: {
    type: "json",
    nullable: true,
    default: "[]",
  },
  isSuperAdmin: {
    type: "boolean",
    nullable: false,
    default: false,
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
    enum: UserStatuses, // Assumes UserStatuses enum is defined elsewhere
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
  resetPasswordCode: {
    type: "varchar",
    length: 255,
    nullable: true,
  },
  resetPasswordExpiresAt: {
    type: "timestamp",
    nullable: true,
  },
  resetPasswordExpiresAtLocal: {
    type: "timestamp",
    nullable: true,
  },
  resetPasswordRequestedAt: {
    type: "timestamp",
    nullable: true,
  },
  resetPasswordRequestedAtLocal: {
    type: "timestamp",
    nullable: true,
  },
  isDeleted: {
    type: "boolean",
    default: false,
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
  isOwner: {
    type: "boolean",
    default: false,
  },
  isOnboarded: {
    type: "boolean",
    default: false,
  },
  isPartner: {
    type: "boolean",
    default: false,
  },
  partnerId: {
    type: "varchar",
    length: 255,
    nullable: true,
  },
  profileConfig: {
    type: "json",
    nullable: true,
    default: "{}",
  },
};

module.exports = { UserColumns };
