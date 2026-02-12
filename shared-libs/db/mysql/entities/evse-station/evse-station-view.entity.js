const { EntitySchema } = require("typeorm");
const { EvseStationColumns } = require("./evse-station-columns.data");

module.exports = new EntitySchema({
  name: "EvseStationView",
  tableName: "evse_station_view",
  columns: {
    ...EvseStationColumns,
    cpoName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    chargerCount: {
      type: "int",
      nullable: true,
      default: 0,
    },
    createdByUserFirstName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    createdByUserLastName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
  },
});
