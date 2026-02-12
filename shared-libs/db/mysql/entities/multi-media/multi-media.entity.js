const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Multimedia",
  tableName: "multi_media",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    storeId: {
      type: "uuid",
      nullable: false,
    },
    url: {
      type: "varchar",
      nullable: false,
      length: 255,
    },
    mediaType: {
      type: "enum",
      enum: ["img", "video"],
      nullable: false,
    },
    sequence: {
      type: "int",
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
  },
});
