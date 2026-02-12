const { EntitySchema } = require("typeorm");
const { RefundIssueCategoryStatus, RefundPriorityStatus, RefundAssignedToStatus, TicketStatus, RefundStatus, CreatedBy } = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "SupportTicket",
  tableName: "support_ticket",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    ticketId: {
      type: "varchar",
      nullable: false,
      unique: true,
    },
    issueCategory: {
      type: "enum",
      enum: RefundIssueCategoryStatus,
      nullable: false,
    },
    priority: {
      type: "enum",
      enum: RefundPriorityStatus,
      nullable: false,
    },
    assignedTo: {
      type: "enum",
      enum: RefundAssignedToStatus,
      nullable: true,
    },
    customerName: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    country: {
      type: "varchar",
      length: 8,
      nullable: true,
    },
    customerPhoneNumber: {
      type: "varchar",
      length: 32,
      nullable: true,
    },
    customerEmail: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    sessionId: {
      type: "varchar",
      length: 64,
      nullable: true,
    },
    chargeBoxId: {
      type: "varchar",
      length: 64,
      nullable: true,
    },
    subject: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    description: {
      type: "text",
      nullable: true,
    },
    amount: {
      type: "float",
      nullable: true,
    },
    refundAmount: {
      type: "float",
      nullable: true,
    },
    ticketStatus: {
      type: "enum",
      enum: TicketStatus,
      default: TicketStatus.OPEN,
      nullable: false,
    },
    refundStatus: {
      type: "enum",
      enum: RefundStatus,
      default: RefundStatus.PENDING,
      nullable: true,
    },
    isRefund: {
      type: "boolean",
      default: false,
      nullable: false,
    },
    originalReceipt: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    refundReceipt: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    timezone: {
      type: "varchar",
      length: 64,
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
    respondedAt: {
      type: "timestamp",
      nullable: true,
    },
    createdAtLocal: {
      type: "varchar",
      length: 64,
      nullable: true,
    },
    updatedAtLocal: {
      type: "varchar",
      length: 64,
      nullable: true,
    },
    respondedAtLocal: {
      type: "varchar",
      length: 64,
      nullable: true,
    },
    createdBy: {
      type: "varchar",
    },
  },
});
