const { EntitySchema } = require("typeorm");

const OtaUpdateChargers = new EntitySchema({
  name: "OtaUpdateChargers",
  tableName: "ota_update_chargers",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    otaUpdateId: {
      type: "uuid",
      nullable: false,
    },
    chargerId: {
      type: "uuid",
      nullable: false,
    },
    chargeBoxId: {
      type: "varchar",
      nullable: true,
    },
    evseStationId: {
      type: "uuid",
      nullable: true,
    },
    status: {
      type: "enum",
      enum: [
        "Created",
        "Sent",
        "Downloaded",
        "DownloadFailed",
        "Downloading",
        "Idle",
        "InstallationFailed",
        "Installing",
        "Installed",
        "Skipped"
      ],
      default: "Created",
      nullable: false,
    },
    country: {
      type: "varchar",
      length: 20,
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
  relations: {
    otaUpdateId: {
      type: "many-to-one",
      target: "OtaUpdate",
      joinColumn: { name: "otaUpdateId" },
    }
  },
});

module.exports = OtaUpdateChargers;
