const { EntitySchema } = require("typeorm");
const { ContractColumns } = require("./contract-columns.data");

module.exports = new EntitySchema({
  name: "ContractView",
  tableName: "contract_view",
  columns: {
    ...ContractColumns,

    createdByEmail: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    createdByName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    updatedByEmail: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    updatedByName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },

    cpoId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    cpoName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    cpoEmail: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    cpoSplitPercentage: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    cpoVerificationStatus: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    cpoCreatedAt: {
      type: "timestamp",
      nullable: true,
    },

    siteHostId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    siteHostName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    siteHostEmail: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    siteHostSplitPercentage: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    siteHostVerificationStatus: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    siteHostCreatedAt: {
      type: "timestamp",
      nullable: true,
    },

    investors: {
      type: "json",
      nullable: true,
    },

    evseStationCount: {
      type: "int",
      nullable: true,
      default: 0,
    },

    chargerCount: {
      type: "int",
      nullable: true,
      default: 0,
    },

    partnerCount: {
      type: "int",
      nullable: true,
      default: 0,
    },

    investorCount: {
      type: "int",
      nullable: true,
      default: 0,
    },
  },
});
