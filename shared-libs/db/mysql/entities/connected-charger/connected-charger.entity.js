const { EntitySchema } = require("typeorm");
const { ConnectedChargerStatuses } = require("@shared-libs/constants");

const ConnectedChargerSchema = new EntitySchema({
  name: "ConnectedCharger",
  tableName: "connected_charger",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    identity: {
      type: "varchar",
      nullable: false,
    },
    remoteAddress: {
      type: "varchar",
      nullable: false,
    },
    protocols: {
      type: "simple-array",
      nullable: false,
    },
    headers: {
      type: "json",
      nullable: false,
    },
    connectedAt: {
      type: "timestamp",
      nullable: true,
    },
    disConnectedAt: {
      type: "timestamp",
      nullable: true,
    },
    status: {
      type: "enum",
      enum: Object.values(ConnectedChargerStatuses),
      nullable: false,
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

module.exports = ConnectedChargerSchema;
