const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ChargerBookings",
  tableName: "charger_bookings",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    bookingId: {
      type: "varchar",
    },
    customerId: {
      type: "uuid",
    },
    chargerId: {
      type: "uuid",
    },
    chargeBoxId: {
      type: "varchar",
    },
    evseStationId: {
      type: "uuid",
    },
    bookingTime: {
      type: "timestamp",
    },
    ocppTransactionId: {
      type: "varchar",
      nullable: true,
      default: null,
    },
    idTag: {
      type: "varchar",
    },
    connectorId: {
      type: "int",
    },
    isFinished: {
      type: "boolean",
      default: false,
    },
    isDeleted: {
      type: "boolean",
      default: false,
    },
    createdAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    updatedAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
});
