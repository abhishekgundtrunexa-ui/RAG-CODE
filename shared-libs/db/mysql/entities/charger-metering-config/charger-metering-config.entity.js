const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ChargerMeteringConfig",
  tableName: "charger_metering_config",
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
    underVoltageLimitPerPhase: {
      type: "decimal",
      nullable: true,
    },
    overVoltageLimitPerPhase: {
      type: "decimal",
      nullable: true,
    },
    underCurrentLimitPerPhase: {
      type: "decimal",
      nullable: true,
    },
    overCurrentLimitPerPhase: {
      type: "decimal",
      nullable: true,
    },
    maxCurrentLimitPerPhase: {
      type: "decimal",
      nullable: true,
    },
    noLoadTimeLimit: {
      type: "decimal",
      nullable: true,
    },
    emModelName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    wiringType: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    typicalVoltage: {
      type: "varchar",
      nullable: true,
    },
    chargerCapacity: {
      type: "decimal",
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
