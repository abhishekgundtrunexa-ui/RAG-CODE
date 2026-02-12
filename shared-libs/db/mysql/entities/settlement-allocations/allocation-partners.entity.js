const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "AllocationPartner",
  tableName: "allocation_partners",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    allocationRuleId: {
      type: "uuid",
      nullable: false,
    },
    cpoUserId: {
      type: "uuid",
      nullable: false,
    },
    percentage: {
      type: "decimal",
      precision: 2,
      scale: 5,
      nullable: false,
    },
    bankAccountId: {
      type: "uuid",
      nullable: true,
    },
    isDeleted: {
      type: "boolean",
      default: "false"
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
  relations: {
    cpoUser: {
      type: "many-to-one",
      target: "CpoUser",
      joinColumn: {
        name: "cpoUserId",
        referencedColumnName: "id"
      },
      eager: false
    },
  }
});
