const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ChargerCard",
  tableName: "charger_card",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    chargerId: {
      type: "uuid",
      nullable: false,
    },
    serialNumber: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    chargeBoxId: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    cardUid: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    cardUidRaw: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    cardLabel: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    expiryDateRaw: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    expiryTimeRaw: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    expiryDate: {
      type: "timestamp",
      nullable: true,
    },
    isExpired: {
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
