const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EmspChargerConfigSetting",
  tableName: "emsp_charger_config_setting",
  columns: {
    id: {
      type: "char",
      length: 36,
      primary: true,
      generated: "uuid",
    },
    emspId: {
      type: "char",
      length: 36,
      nullable: false,
    },
    connectorType: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    paymentModule: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    energyMeter: {
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
      length: 255,
      nullable: true,
    },
    maxCurrentPerPhase: {
      type: "varchar",
      length: 255,
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
  }
});
