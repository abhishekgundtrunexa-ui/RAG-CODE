const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ChargerLanguage",
  tableName: "charger_language",
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
    chargeBoxId: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    connectorId: {
      type: "int",
      nullable: false,
    },
    language: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "en",
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
