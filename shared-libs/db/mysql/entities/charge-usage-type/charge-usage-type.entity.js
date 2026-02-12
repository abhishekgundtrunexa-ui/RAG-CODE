const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ChargeUsageType",
  tableName: "charge_usage_type",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    mappingText: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    displayText: {
      type: "varchar",
      length: 255,
      nullable: false,
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
    createdBy: {
      type: "uuid",
      nullable: true,
    },
    updatedBy: {
      type: "uuid",
      nullable: true,
    },
  },
});
