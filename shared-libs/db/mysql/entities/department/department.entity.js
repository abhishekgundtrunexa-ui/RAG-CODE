const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Department",
  tableName: "department",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    name: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    code: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    permissions: {
      type: "json",
      nullable: true,
      default: "[]",
    },
    partnerId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    isDefault: {
      type: "boolean",
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
    createdBy: {
      type: "uuid",
      nullable: false,
    },
    updatedBy: {
      type: "uuid",
      nullable: true,
    },
  },
});
