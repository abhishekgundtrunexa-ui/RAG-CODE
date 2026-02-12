const { EntitySchema } = require("typeorm");
const { v4: uuidv4 } = require("uuid");

module.exports = new EntitySchema({
  name: "CpoCardDetails",
  tableName: "cpo_card_details",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
      default: uuidv4(),
    },
    cardNumber: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    expiryDate: {
      type: "varchar",
      length: 5,
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
    address: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    city: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    state: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    zipCode: {
      type: "int",
      nullable: true,
    },
    country: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    tokenId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    stripeCardId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    stripeCustomerId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    cpoId: {
      type: "uuid",
      nullable: true,
    },
    isPrimary: {
      type: "boolean",
      default: false,
    },
    cardType: {
      type: "varchar",
      nullable: true,
    },
    cpoAdminId: {
      type: "uuid",
      nullable: true,
    },
    createdAt: {
      type: "timestamp",
      updateDate: true,
    },
    updatedAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
      updateDate: true,
    },
    isDeleted: {
      type: "boolean",
      default: false,
    },
  },
  relations: {
    cpoId: {
      type: "many-to-one",
      target: "cpo",
      joinColumn: { name: "cpoId" },
    },
    cpoAdminId: {
      type: "many-to-one",
      target: "cpo",
      joinColumn: { name: "cpoAdminId" },
    },
  },
});
