const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ChargerAuthCodes",
  tableName: "charger_auth_codes",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    chargerId: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    chargeBoxId: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    authCode1: {
      type: "int",
      nullable: false,
      default: null,
    },
    authCode2: {
      type: "int",
      nullable: false,
      default: null,
    },
    authCode3: {
      type: "int",
      nullable: false,
      default: null,
    },
    isAttempted: {
      type: "boolean",
      default: false,
    },
    timezone: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    country: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    createdAtLocal: {
      type: "timestamp",
      nullable: true,
      default: null,
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
