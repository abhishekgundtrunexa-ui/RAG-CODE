const { EntitySchema } = require("typeorm");
const { ServiceRequestCategories } = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "ServiceRequestCategory",
  tableName: "service_request_category",
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
      enum: Object.values(ServiceRequestCategories),
    },
    displayText: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    srNo: {
      type: "int",
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
