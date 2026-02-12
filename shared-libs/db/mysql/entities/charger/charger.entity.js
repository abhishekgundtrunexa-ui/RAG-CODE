const { EntitySchema } = require("typeorm");
const { ChargerColumns } = require("./charger-columns.data");

module.exports = new EntitySchema({
  name: "Charger",
  tableName: "charger",
  columns: ChargerColumns,
  relations: {
    connectorTypeId: {
      type: "many-to-one",
      target: "ChargerConnectorType",
      joinColumn: { name: "connectorTypeId" },
    },
    evseStationId: {
      type: "many-to-one",
      target: "EvseStation",
      joinColumn: { name: "evseStationId" },
    },
    registeredBy: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "registeredBy" },
    },
    chargeUsageTypeId: {
      type: "many-to-one",
      target: "ChargeUsageType",
      joinColumn: { name: "chargeUsageTypeId" },
    },
    cpoId: {
      type: "many-to-one",
      target: "Cpo",
      joinColumn: { name: "cpoId" },
    },
  },
  indices: [
    {
      columns: ["chargeBoxId"],
      unique: true,
    },
  ],
});
