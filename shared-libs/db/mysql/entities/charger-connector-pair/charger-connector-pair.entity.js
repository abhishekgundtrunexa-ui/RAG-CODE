const { EntitySchema } = require("typeorm");
const { ChargerConnectorPairMapping } = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "ChargerConnectorPair",
  tableName: "charger_connector_pair",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    type: {
      type: "varchar",
      length: 255,
      nullable: false,
      enum: Object.keys(ChargerConnectorPairMapping),
    },
    description: {
      type: "varchar",
      length: 255,
      nullable: false,
      enum: Object.values(ChargerConnectorPairMapping),
    },
    createdBy: {
      type: "uuid",
      nullable: true,
    },
    updatedBy: {
      type: "uuid",
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
