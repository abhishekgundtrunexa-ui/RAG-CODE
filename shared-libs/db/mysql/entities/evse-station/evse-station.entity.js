const { EntitySchema } = require("typeorm");
const { EvseStationColumns } = require("./evse-station-columns.data");

module.exports = new EntitySchema({
  name: "EvseStation",
  tableName: "evse_station",
  columns: EvseStationColumns,
  relations: {
    cpoId: {
      type: "many-to-one",
      target: "Cpo",
      joinColumn: { name: "cpoId" },
    },
    baseRateId: {
        type: "many-to-one",
        target: "CpoBaseRate",
        joinColumn: { name: "baseRateId" },
    }
  }
});
