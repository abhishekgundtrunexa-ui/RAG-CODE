const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ConfigConstants",
  tableName: "config_constants",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    key: {
      type: "varchar",
      nullable: false,
    },
    value: {
      type: "varchar",
      nullable: false,
    },
    description: {
      type: "text",
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
