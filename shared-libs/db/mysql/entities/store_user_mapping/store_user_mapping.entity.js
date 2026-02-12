const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "StoreUserMapping",
  tableName: "store_user_mapping",
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
    userId: {
      type: "uuid",
      nullable: false,
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
