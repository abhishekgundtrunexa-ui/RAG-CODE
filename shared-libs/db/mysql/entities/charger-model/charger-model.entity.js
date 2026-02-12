const { EntitySchema } = require("typeorm");
const { ChargerModelMapping } = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "ChargerModel",
  tableName: "charger_model",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    type: {
      type: "enum",
      enum: Object.values(ChargerModelMapping),
    },
    description: {
      type: "varchar",
      nullable: false,
      length: 255,
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
