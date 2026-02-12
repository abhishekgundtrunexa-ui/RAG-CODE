const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EmspBusinessTaxDetail",
  tableName: "emsp_business_tax_details",
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
    businessNumber: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    taxAccountNumber: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    federalTax: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    provincialSalesTax: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    harmonizedSalesTax: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    taxCertificate: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    incorporationCertificate: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    businessPanNumber: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    centralGstPercentage: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    stateGstPercentage: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    integratedGstPercentage: {
      type: "varchar",
      length: 255,
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
