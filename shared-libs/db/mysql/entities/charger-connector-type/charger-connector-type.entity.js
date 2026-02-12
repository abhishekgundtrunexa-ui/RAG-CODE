const { EntitySchema } = require("typeorm");

const { ChargerConnectorTypes } = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "ChargerConnectorType",
  tableName: "charger_connector_type",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    mappingText: {
      type: "varchar",
      enum: Object.values(ChargerConnectorTypes),
      nullable: false,
      length: 255,
    },
    displayText: {
      type: "varchar",
      nullable: false,
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
