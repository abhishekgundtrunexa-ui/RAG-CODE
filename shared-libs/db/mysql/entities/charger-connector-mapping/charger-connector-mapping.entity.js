const { EntitySchema } = require("typeorm");

const ChargerConnectorMapping = new EntitySchema({
  name: "ChargerConnectorMapping",
  tableName: "charger_connector_mapping",
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
    connectorTypeId: {
      type: "uuid",
      nullable: false,
    },
    connectorId: {
      type: "int",
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
  relations: {
    chargerId: {
      type: "many-to-one",
      target: "Charger",
      joinColumn: { name: "chargerId" },
    },
    connectorType: {
      type: "many-to-one",
      target: "ChargerConnectorType",
      joinColumn: { name: "connectorTypeId" },
    },
  },
});

module.exports = ChargerConnectorMapping;
