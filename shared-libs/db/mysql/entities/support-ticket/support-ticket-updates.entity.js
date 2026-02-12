const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "SupportTicketUpdates",
  tableName: "support_ticket_updates",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    supportTicketId: {
      type: "uuid",
      nullable: false,
    },
    details: {
      type: "text",
      nullable: false,
    },
    creator: {
      type: "varchar",
      length: 255,
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
    createdAtLocal: {
      type: "varchar",
      length: 64,
      nullable: true,
    },
  },
});
