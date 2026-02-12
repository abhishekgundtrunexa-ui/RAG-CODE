const { EntitySchema } = require("typeorm");

const ChargerMeterValuesSchema = new EntitySchema({
  name: "ChargerMeterValues",
  tableName: "charger_meter_values",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    chargeBoxId: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    transactionId: {
      type: "varchar",
      nullable: true,
    },
    connectorId: {
      type: "varchar",
      nullable: true,
    },
    energyActiveExportRegister: {
      type: "int",
      nullable: true,
    },
    energyActiveImportRegister: {
      type: "int",
      nullable: true,
    },
    energyReactiveExportRegister: {
      type: "int",
      nullable: true,
    },
    energyReactiveImportRegister: {
      type: "int",
      nullable: true,
    },
    energyActiveExportInterval: {
      type: "int",
      nullable: true,
    },
    energyActiveImportInterval: {
      type: "int",
      nullable: true,
    },
    energyReactiveExportInterval: {
      type: "int",
      nullable: true,
    },
    energyReactiveImportInterval: {
      type: "int",
      nullable: true,
    },
    powerActiveExport: {
      type: "int",
      nullable: true,
    },
    powerActiveImport: {
      type: "int",
      nullable: true,
    },
    powerOffered: {
      type: "int",
      nullable: true,
    },
    powerReactiveExport: {
      type: "int",
      nullable: true,
    },
    powerReactiveImport: {
      type: "int",
      nullable: true,
    },
    powerFactor: {
      type: "int",
      nullable: true,
    },
    currentImport: {
      type: "int",
      nullable: true,
    },
    currentExport: {
      type: "int",
      nullable: true,
    },
    currentOffered: {
      type: "int",
      nullable: true,
    },
    voltage: {
      type: "int",
      nullable: true,
    },
    frequency: {
      type: "int",
      nullable: true,
    },
    temperature: {
      type: "int",
      nullable: true,
    },
    soc: {
      type: "int",
      nullable: true,
    },
    rpm: {
      type: "int",
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

module.exports = ChargerMeterValuesSchema;
