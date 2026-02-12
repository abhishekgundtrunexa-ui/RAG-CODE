const { EntitySchema } = require("typeorm");
const { v4: uuidv4 } = require("uuid");

module.exports = new EntitySchema({
  name: "CpoSubscription",
  tableName: "cpo_subscription",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
      default: uuidv4(),
    },
    cpoId: {
      type: "uuid",
      nullable: true,
    },
    cpoAdminId: {
      type: "uuid",
      nullable: true,
    },
    subscriptionPurchaseRequestId: {
      type: "uuid",
      nullable: true,
    },
    purchaseDate: {
      type: "timestamp",
      nullable: true,
    },
    expiryDate: {
      type: "timestamp",
      nullable: true,
    },
    subscriptionPlanId: {
      type: "uuid",
      nullable: true,
    },
    status: {
      type: "varchar",
      length: 255,
      default: "init",
    },
    pdfUrl: {
      type: "varchar",
      nullable: true,
    },
    timezone: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    country: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    purchaseDateLocal: {
      type: "timestamp",
      nullable: true,
      default: null,
    },
    expiryDateLocal: {
      type: "timestamp",
      nullable: true,
      default: null,
    },
    createdAtLocal: {
      type: "timestamp",
      nullable: true,
      default: null,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
    isDeleted: {
      type: "boolean",
      default: false,
    },
  },
});
