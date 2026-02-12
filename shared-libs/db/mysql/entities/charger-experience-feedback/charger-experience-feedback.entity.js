const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ChargerExperienceFeedback",
  tableName: "charger_experience_feedback",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    chargeBoxId: {
      type: "uuid",
      nullable: false,
    },
    transactionUuid: {
      type: "uuid",
      nullable: false,
    },
    rating: {
      type: "float",
      nullable: false,
    },
    isDeleted: {
      type: "boolean",
      default: false,
    },
    timezone: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    country: {
      type: "varchar",
      nullable: true,
      length: 255,
    },
    cpoId: {
      type: "uuid",
      nullable: true
    },
    evseStationId: {
      type: "uuid",
      nullable: false
    },
    createdAtLocal: {
      type: "timestamp",
      nullable: true,
      default: null,
    },
    review: {
      type: "varchar",
      nullable: true,
    },
    feedbackMessages: {
      type: "json",
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
