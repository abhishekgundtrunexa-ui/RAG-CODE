const { EntitySchema } = require("typeorm");
const { v4: uuidv4 } = require("uuid");

module.exports = new EntitySchema({
  name: "ChargerPaymentConfig",
  tableName: "charger_payment_config",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
      default: uuidv4(),
    },
    chargerId: {
      type: "varchar",
      nullable: true,
    },
    chargeBoxId: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    lowerLimit: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    upperLimit: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    paymentGatewayURL: {
      type: "varchar",
      nullable: true,
    },
    preauthAmountMultiplier: {
      type: "varchar",
      nullable: true,
    },
    paymentMfg: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    paymentMfgId: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    paymentProvider: {
      type: "varchar",
      nullable: false,
    },
    paymentDeviceId: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    deviceType: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    posCode: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    scanTimeout: {
      type: "varchar",
      nullable: true,
      length: 255,
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
