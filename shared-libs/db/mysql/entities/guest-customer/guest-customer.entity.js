const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "GuestCustomers",
  tableName: "guest_customers",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    deviceToken: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    isSignedUp: {
      type: "boolean",
      default: false,
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
