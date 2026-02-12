const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "UserRole",
  tableName: "user_role",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    departmentId: {
      type: "uuid",
      nullable: true,
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
  },
});
