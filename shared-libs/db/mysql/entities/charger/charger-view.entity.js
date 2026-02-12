const { EntitySchema } = require("typeorm");
const { ChargerColumns } = require("./charger-columns.data");

module.exports = new EntitySchema({
  name: "ChargerView",
  tableName: "charger_view",
  columns: {
    ...ChargerColumns,
    deletedByUserName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    deletedByUserEmail: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    evseStationId: {
      type: "uuid",
      nullable: true,
    },
    evseStationName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    evseStationAddress: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    evseStationCity: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    evseStationLat: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    evseStationLng: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    registeredByUserId: {
      type: "uuid",
      nullable: true,
    },
    registeredByUserFirstName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    registeredByUserLastName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    registeredByUserEmail: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    connectorType: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    contractId: {
      type: "uuid",
      nullable: true,
    },
    cpoUserName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    siteHostUserName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    investorUserNames: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    contractCpoId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    contractSiteHostId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    contractInvestor1Id: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    contractInvestor2Id: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    activatedByUserName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    activatedByUserEmail: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    rfidCardUid1: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    rfidCardLabel1: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    rfidCardUid2: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    rfidCardLabel2: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
  },
  relations: {
    connectorTypeId: {
      type: "many-to-one",
      target: "ChargerConnectorType",
      joinColumn: { name: "connectorTypeId" },
    },
    evseStationId: {
      type: "many-to-one",
      target: "EvseStation",
      joinColumn: { name: "evseStationId" },
    },
    registeredBy: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "registeredBy" },
    },
    chargeUsageTypeId: {
      type: "many-to-one",
      target: "ChargeUsageType",
      joinColumn: { name: "chargeUsageTypeId" },
    },
    cpoId: {
      type: "many-to-one",
      target: "Cpo",
      joinColumn: { name: "cpoId" },
    },
  },
});
