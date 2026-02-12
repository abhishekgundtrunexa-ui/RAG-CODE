const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "AllocationRule",
  tableName: "allocation_rules",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    ruleName: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    totalAllocation: {
      type: "decimal",
      precision: 5,
      scale: 2,
      default: 0.00,
    },
    cpoId: {
      type: "char",
      length: 36,
      nullable: true,
    },
    validFrom: {
      type: "timestamp",
      default: null
    },   
    validTill: {
      type: "timestamp",
      default: null,
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
});
