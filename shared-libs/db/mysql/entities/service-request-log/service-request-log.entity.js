const { EntitySchema } = require("typeorm");
const { ServiceRequestStatuses } = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "ServiceRequestLog",
  tableName: "service_request_logs",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    serviceRequestId: {
      type: "uuid",
      nullable: false,
    },
    imageUrl: {
      type: "text",
      nullable: true,
      default: null,
    },
    currentStatus: {
      type: "enum",
      enum: Object.values(ServiceRequestStatuses),
      nullable: false,
    },
    comment: {
      type: "varchar",
      nullable: true,
    },
    assignedTo: {
      type: "uuid",
      nullable: true,
    },
    updatedBy: {
      type: "uuid",
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
