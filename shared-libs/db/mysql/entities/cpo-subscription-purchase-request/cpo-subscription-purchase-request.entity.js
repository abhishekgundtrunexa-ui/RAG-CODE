const { EntitySchema } = require("typeorm");
const { v4: uuidv4 } = require("uuid");

module.exports = new EntitySchema({
  name: "CpoSubscriptionPurchaseRequest",
  tableName: "cpo_subscription_purchase_request",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
      default: uuidv4(),
    },
    subscriptionPlanId: {
      type: "uuid",
      nullable: true,
    },
    cardDetailsId: {
      type: "uuid",
      nullable: true,
    },
    cpoId: {
      type: "uuid",
      nullable: true,
    },
    cpoAdminId: {
      type: "uuid",
      nullable: true,
    },
    status: {
      type: "varchar",
      length: 255,
      default: "Initiated",
    },
    transactionPaymentId: {
      type: "uuid",
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
