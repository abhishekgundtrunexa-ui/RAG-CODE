const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "UserCredential",
  tableName: "user_credential",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    userId: {
      type: "uuid",
      nullable: false,
    },
    password: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: null,
    },
    activateChargerId: {
      type: "varchar",
      nullable: true,
    },
    activateChargerOtp: {
      type: "varchar",
      nullable: true,
    },
    activateChargerOtpExpiry: {
      type: "timestamp",
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
