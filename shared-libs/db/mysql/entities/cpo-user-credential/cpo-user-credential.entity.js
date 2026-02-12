const { EntitySchema } = require("typeorm");
const { UserStatuses } = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "CpoUserCredential",
  tableName: "cpo_user_credential",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    cpoUserId: {
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
