const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "PartnerCard",
  tableName: "partner_card",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    partnerId: {
      type: "uuid",
      nullable: false,
    },
    stripeCustomerId: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    stripeCardId: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    tokenId: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    cardNumber: {
      type: "varchar",
      length: 4,
      nullable: false,
    },
    expMonth: {
      type: "varchar",
      length: 2, // MM/YYYY format
      nullable: false,
    },
    expYear: {
      type: "varchar",
      length: 4, // MM/YYYY format
      nullable: false,
    },
    cvc: {
      type: "varchar",
      length: 4, // MM/YYYY format
      nullable: false,
    },
    nameOnCard: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    cardType: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    isPrimary: {
      type: "boolean",
      default: false,
      nullable: false,
    },
    isDeleted: {
      type: "boolean",
      default: false,
      nullable: false,
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
});
