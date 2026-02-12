const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EmspBankAccount",
  tableName: "emsp_bank_account",
  columns: {
    id: {
      type: "char",
      length: 36,
      primary: true,
      generated: "uuid",
    },
    emspId: {
      type: "char",
      length: 36,
      nullable: false,
    },
    bankName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    branchNumber: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    institutionNumber: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    accountNumber: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    ifscCode: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    accountType: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    bankAddress: {
      type: "text",
      nullable: true,
    },
    bankVerificationLetter: {
      type: "varchar",
      length: 255,
      nullable: true,
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
