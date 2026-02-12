const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Customers",
  tableName: "customers",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
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
    },
    mobile: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    lastLogin: {
      type: "timestamp",
      nullable: true,
    },
    address: {
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
    currencyName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    currencySymbol: {
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
    isOnboarded: {
      type: "boolean",
      default: false,
    },
    isTesting: {
      type: "boolean",
      default: false,
    },
    isDeleted: {
      type: "boolean",
      default: false,
    },
  },
});
