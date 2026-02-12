const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "CpoPaymentAccount",
  tableName: "cpo_payment_account",
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
    fullName: {
      type: "varchar",
      nullable: false,
    },
    accountNo: {
      type: "varchar",
      nullable: false,
    },
    bankName: {
      type: "varchar",
      nullable: false,
    },
    swiftCode: {
      type: "varchar",
      nullable: false,
    },
    ifscCode: {
      type: "varchar",
      nullable: false,
    },
    document: {
      type: "varchar",
      nullable: true,
    },
    isDefault: {
      type: "boolean",
      nullable: false,
      default: false,
    },
    isVerified: {
      type: "boolean",
      nullable: false,
      default: false,
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
});
