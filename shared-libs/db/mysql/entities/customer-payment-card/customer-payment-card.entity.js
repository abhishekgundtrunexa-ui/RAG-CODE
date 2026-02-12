const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "CustomerPaymentCard",
  tableName: "customer_payment_cards",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    customerId: {
      type: "uuid",
      nullable: false,
    },
    cardNumber: {
      type: "varchar",
      length: 32,
      nullable: false,
    },
    cardHolderName: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    expiryMonth: {
      type: "int",
      nullable: false,
    },
    expiryYear: {
      type: "int",
      nullable: false,
    },
    brand: {
      type: "varchar",
      length: 32,
      nullable: true,
    },
    last4: {
      type: "varchar",
      length: 4,
      nullable: false,
    },
    paymentTokenId: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    isDefault: {
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
    isDeleted: {
      type: "boolean",
      default: false,
    },
  },
  relations: {
    customer: {
      type: "many-to-one",
      target: "Customers",
      joinColumn: { name: "customerId" },
      onDelete: "CASCADE",
    },
  },
});
