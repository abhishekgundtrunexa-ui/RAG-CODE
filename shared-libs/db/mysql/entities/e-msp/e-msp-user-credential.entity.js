const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EmspUserCredential",
  tableName: "emsp_user_credential",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    emspUserId: {
      type: "uuid",
      nullable: false,
    },
    password: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: null,
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
