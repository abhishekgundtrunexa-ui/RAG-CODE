const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Faq",
  tableName: "faq",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    title: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    description: {
      type: "text",
      nullable: false,
    },
    category: {
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
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
    createdBy: {
      type: "uuid",
      nullable: true,
    },
    updatedBy: {
      type: "uuid",
      nullable: true,
    },
  },
});
