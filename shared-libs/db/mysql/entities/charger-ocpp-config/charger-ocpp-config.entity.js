const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ChargerOcppConfig",
  tableName: "charger_ocpp_config",
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
    csmsURL: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "ws://ocpp.chargnex.com:3002/",
    },
    csmsApiURL: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "http://csms.chargnex.com/",
    },
    csmsWsURL: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "ws://ocpp.chargnex.com:3002/",
    },
    csmsWssURL: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "wss://ocpp.chargnex.com/",
    },
    csmsHttpURL: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "http://csms.chargnex.com/",
    },
    csmsHttpsURL: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "https://csms.chargnex.com/",
    },
    ocppVersion: {
      type: "varchar",
      length: 255,
      nullable: true,
      default: "1.6",
    },
    certificatePath: {
      type: "varchar",
      length: 1000,
      nullable: true,
      default: "",
    },
    heartbeatIntervalSeconds: {
      type: "varchar",
      length: 1000,
      nullable: true,
      default: "15",
    },
    heartbeatThreshold: {
      type: "varchar",
      length: 1000,
      nullable: true,
      default: "4",
    },
    lastConfigSentAt: {
      type: "timestamp",
      nullable: true,
    },
    lastConfigUpdatedAt: {
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
