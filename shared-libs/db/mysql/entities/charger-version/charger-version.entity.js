const { EntitySchema } = require("typeorm");

const ChargerVersion = new EntitySchema({
  name: "ChargerVersion",
  tableName: "charger_version",
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
    },
    evseStationId: {
      type: "uuid",
      nullable: true,
    },
    firmwareVersion: {
      type: "varchar",
      nullable: true,
    },
    chargerAppVersion: {
      type: "varchar",
      nullable: true,
    },
    voltCheckVersion: {
      type: "varchar",
      nullable: true,
    },
    deviceAgentVersion: {
        type: "varchar",
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

module.exports = ChargerVersion;
