const { EntitySchema } = require("typeorm");
const { v4: uuidv4 } = require("uuid");

module.exports = new EntitySchema({
  name: "SubscriptionPlan",
  tableName: "subscription_plan",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
      default: uuidv4(),
    },
    name: {
      type: "varchar",
      length: 255,
      unique: true,
    },
    allowedMaxCharger: {
      type: "int",
      default: 5,
    },
    allowedMaxUserAccounts: {
      type: "int",
      default: 5,
    },
    allowedMaxEvseStations: {
      type: "int",
      default: 5,
    },
    allowedMaxRoles: {
      type: "int",
      default: 5,
    },
    amount: {
      type: "int",
      nullable: true,
    },
    days: {
      type: "int",
      nullable: true,
    },
  },
});
