const { EntitySchema } = require("typeorm");

const ChargerLocalAuthorization = new EntitySchema({
  name: "ChargerLocalAuthorization",
  tableName: "charger_local_authorization",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    chargeBoxId: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    listVersion: {
      type: "int",
      nullable: false,
    },
    idTag: {
      type: "varchar",
      length: 20,
      nullable: false,
    },
    status: {
      type: "enum",
      enum: ["Accepted", "Blocked", "Expired", "Invalid", "ConcurrentTx"],
      nullable: false,
    },
    expiryDate: {
      type: "timestamp",
      nullable: true,
    },
    parentIdTag: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    updateType: {
      type: "enum",
      enum: ["Full", "Differential"],
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
  }
});

module.exports = ChargerLocalAuthorization;
