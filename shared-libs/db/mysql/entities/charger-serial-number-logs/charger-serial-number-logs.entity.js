const { EntitySchema } = require("typeorm");

const ChargerMeterValuesSchema = new EntitySchema({
  name: "ChargerSerialNumberLogs",
  tableName: "charger_serial_number_logs",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    manufacturer: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    variant: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    amperage: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    paymentModule: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    batchCode: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    serialNumber: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    serialNumberDashed: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    generatedAt: {
      type: "timestamp",
      nullable: true,
    },
    registeredAt: {
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

module.exports = ChargerMeterValuesSchema;
