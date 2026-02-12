const { EntitySchema } = require("typeorm");
const { v4: uuidv4 } = require("uuid");

module.exports = new EntitySchema({
  name: "CpoSubscriptionInvoice",
  tableName: "cpo_subscription_invoice",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
      default: uuidv4(),
    },
    invoiceNumber: {
      type: "varchar",
      nullable: true,
    },
    pdfUrl: {
      type: "varchar",
      nullable: true,
    },
    subscriptionId: {
      type: "uuid",
      nullable: false,
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
