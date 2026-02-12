const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "PartnerAccessView",
  tableName: "partner_access_view",
  columns: {
    partnerId: {
      type: "uuid",
      nullable: false,
      primary: true,
    },
    contractId: {
      type: "uuid",
      nullable: true,
      primary: true,
    },
    relatedPartnerId: {
      type: "uuid",
      nullable: true,
      primary: true,
    },
    contractEvseStationId: {
      type: "uuid",
      nullable: true,
      primary: true,
    },
    directEvseStationId: {
      type: "uuid",
      nullable: true,
      primary: true,
    },
    chargerId: {
      type: "uuid",
      nullable: true,
      primary: true,
    },
    chargeBoxId: {
      type: "uuid",
      nullable: true,
      primary: true,
    },
  },
});
