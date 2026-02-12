const { EntitySchema } = require("typeorm");
const { UserColumns } = require("./user-columns.data");

module.exports = new EntitySchema({
  name: "UserView",
  tableName: "user_view",
  columns: {
    ...UserColumns,
    departmentName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    userRoleName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    userRoleCode: {
      type: "uuid",
      nullable: true,
    },
  },
});
