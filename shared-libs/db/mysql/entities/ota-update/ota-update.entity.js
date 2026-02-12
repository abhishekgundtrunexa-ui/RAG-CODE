const { EntitySchema } = require("typeorm");

const OtaUpdate = new EntitySchema({
  name: "OtaUpdate",
  tableName: "ota_update",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    name: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    description: {
      type: "text",
      nullable: true,
    },
    fileUrl: {
      type: "varchar",
      length: 500,
      nullable: false,
    },
    updateType: {
      type: "enum",
      enum: ["Now", "Scheduled"],
      nullable: false,
    },
    updateDateTime: {
      type: "timestamp",
      nullable: true,
    },
    status: {
      type: "enum",
      enum: ["Created", "In-Progress", "Completed", "Partially-Completed"],
      default: "Created",
      nullable: false,
    },
    totalChargers: {
      type: "int",
      nullable: true,
      default: 0,
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
});

module.exports = OtaUpdate;
