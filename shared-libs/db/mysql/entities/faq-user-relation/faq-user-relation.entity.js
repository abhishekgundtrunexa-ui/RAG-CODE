const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "FaqUserRelation",
  tableName: "faq_user_relation",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    faqId: {
      type: "uuid",
      nullable: false,
    },
    userTypeId: {
      type: "uuid",
      nullable: false,
    },
    userRoleId: {
      type: "uuid",
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
  },
});
