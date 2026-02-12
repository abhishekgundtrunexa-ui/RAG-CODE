const { EntitySchema } = require("typeorm");
const {
  UserStatuses,
  UserSessionStatuses,
} = require("@shared-libs/constants");

module.exports = new EntitySchema({
  name: "CpoUserSession",
  tableName: "cpo_user_session",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    cpoId: {
      type: "uuid",
      nullable: true,
    },
    cpoUserId: {
      type: "uuid",
    },
    token: {
      type: "varchar",
      nullable: false,
    },
    status: {
      type: "enum",
      enum: UserSessionStatuses,
      default: UserSessionStatuses.CURRENT,
    },
    loginAt: {
      type: "timestamp",
      nullable: true,
    },
    expireAt: {
      type: "timestamp",
      nullable: true,
    },
    expiredAt: {
      type: "timestamp",
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
    country: {
      type: "varchar",
      nullable: true,
    },
    city: {
      type: "varchar",
      nullable: true,
    },
    state: {
      type: "varchar",
      nullable: true,
    },
    lat: {
      type: "decimal",
      precision: 10,
      scale: 8,
      nullable: true,
    },
    lng: {
      type: "decimal",
      precision: 11,
      scale: 8,
      nullable: true,
    },
    platform: {
      type: "varchar",
      nullable: true,
    },
    browser: {
      type: "varchar",
      nullable: true,
    },
    agent: {
      type: "varchar",
      nullable: true,
    },
    timezone: {
      type: "varchar",
      nullable: true,
    },
    browserversion: {
      type: "varchar",
      nullable: true,
    },
    os: {
      type: "varchar",
      nullable: true,
    },
  },
});
