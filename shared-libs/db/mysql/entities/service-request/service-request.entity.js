const { EntitySchema } = require("typeorm");
const { ServiceRequestStatuses } = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "ServiceRequest",
  tableName: "service_request",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    srNumber: {
      type: "varchar",
      nullable: false,
    },
    description: {
      type: "varchar",
      nullable: true,
    },
    imageUrl: {
      type: "varchar",
      nullable: true,
    },
    currentStatus: {
      type: "enum",
      enum: Object.values(ServiceRequestStatuses),
      default: ServiceRequestStatuses.OPEN,
    },
    isDeleted: {
      type: "boolean",
      default: false,
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
    categoryId: {
      type: "uuid",
      nullable: false,
    },
  },
});
