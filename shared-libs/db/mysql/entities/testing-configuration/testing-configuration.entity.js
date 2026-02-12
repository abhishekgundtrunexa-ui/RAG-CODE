const { EntitySchema } = require("typeorm");
const { TestingConfigStatuses } = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "TestingConfiguration",
  tableName: "testing_configuration",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    serialNumber: {
      type: "varchar",
      nullable: false,
    },
    chargeBoxId: {
      type: "varchar",
      nullable: false,
    },
    type: {
      type: "varchar",
      nullable: false,
    },
    description: {
      type: "varchar",
      nullable: true,
    },
    startDate: {
      type: "varchar",
      nullable: true,
    },
    endDate: {
      type: "varchar",
      nullable: true,
    },
    meterStart: {
      type: "int",
      nullable: true,
    },
    meterStop: {
      type: "int",
      nullable: true,
    },
    preAuthAmount: {
      type: "int",
      nullable: true,
    },
    captureAmount: {
      type: "int",
      nullable: true,
    },
    versionNo: {
      type: "varchar",
      nullable: true,
    },
    status: {
      type: "enum",
      enum: Object.values(TestingConfigStatuses),
      default: "PENDING",
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
      default: () => "CURRENT_TIMESTAMP",
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
    },
  },
});
