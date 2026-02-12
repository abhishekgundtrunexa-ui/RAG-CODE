const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "CustomerCredential",
  tableName: "customer_credential",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    customerId: {
      type: "uuid",
      nullable: false,
    },

    otp: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    otpExpiresAt: {
      type: "timestamp",
      nullable: true,
    },
    otpRequestedAt: {
      type: "timestamp",
      nullable: true,
    },

    updateEmailOtp: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    updateEmailOtpExpiresAt: {
      type: "timestamp",
      nullable: true,
    },
    updateEmailOtpRequestedAt: {
      type: "timestamp",
      nullable: true,
    },

    updateMobileOtp: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    updateMobileOtpExpiresAt: {
      type: "timestamp",
      nullable: true,
    },
    updateMobileOtpRequestedAt: {
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
  },
});
