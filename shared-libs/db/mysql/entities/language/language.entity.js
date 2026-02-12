const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Language",
  tableName: "language",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    langFor: {
      type: "varchar",
      nullable: false,
      length: 255,
    },
    langKey: {
      type: "text",
      nullable: false,
    },
    en: {
      type: "text",
      nullable: true,
    },
    fr: {
      type: "text",
      nullable: true,
    },
    es: {
      type: "text",
      nullable: true,
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
