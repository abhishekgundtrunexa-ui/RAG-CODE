const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EmspPaymentConfigSetting",
  tableName: "emsp_payment_config_setting",
  columns: {
    id: {
      type: "char",
      length: 36,
      primary: true,
      generated: "uuid",
    },
    emspId: {
      type: "char",
      length: 36,
      nullable: false,
    },
    tarrif_model: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    electricityGridRate: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
    },
    grossMargin: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
    },
    baseRate: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
    },
    paymentGatewayPartner: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    preauthAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
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
  }
});
