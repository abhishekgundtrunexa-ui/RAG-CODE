const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ApiKeys",
  tableName: "api_keys",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    apiKey: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    isDeleted: {
      type: "boolean",
      default: false,
    },
    createdAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    updatedAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
});
