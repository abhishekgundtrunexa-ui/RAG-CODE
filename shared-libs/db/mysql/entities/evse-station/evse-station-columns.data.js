const EvseStationColumns = {
  id: {
    type: "uuid",
    primary: true,
    generated: "uuid",
  },
  cpoId: {
    type: "uuid",
    nullable: true,
  },
  partnerId: {
    type: "uuid",
    nullable: true,
  },
  name: {
    type: "varchar",
    nullable: true,
    length: 255,
  },
  code: {
    type: "varchar",
    nullable: true,
    length: 255,
  },
  address: {
    type: "varchar",
    length: 255,
    nullable: false,
  },
  city: {
    type: "varchar",
    length: 255,
    nullable: false,
  },
  state: {
    type: "varchar",
    length: 255,
    nullable: false,
  },
  country: {
    type: "varchar",
    length: 255,
    nullable: false,
  },
  areaCode: {
    type: "varchar",
    length: 255,
    nullable: false,
  },
  lat: {
    type: "varchar",
    length: 255,
    nullable: true,
  },
  lng: {
    type: "varchar",
    length: 255,
    nullable: true,
  },
  baseRate: {
    type: "decimal",
    default: 0,
    nullable: true,
  },
  electricityGridRate: {
    type: "decimal",
    default: 0,
    nullable: true,
  },
  taxRate: {
    type: "decimal",
    default: 0,
    nullable: true,
  },
  parkingRate: {
    type: "decimal",
    default: 0,
    nullable: true,
  },
  discount: {
    type: "decimal",
    default: 0,
    nullable: true,
  },
  penalty: {
    type: "decimal",
    default: 0,
    nullable: true,
  },
  preAuthAmount: {
    type: "decimal",
    default: 0,
    nullable: true,
  },
  currency: {
    type: "varchar",
    length: 255,
    nullable: true,
  },
  currencyName: {
    type: "varchar",
    length: 255,
    nullable: true,
  },
  currencySymbol: {
    type: "varchar",
    length: 255,
    nullable: true,
  },
  isDeleted: {
    type: "boolean",
    default: false,
  },
  deletedAt: {
    type: "timestamp",
    nullable: true,
  },
  deletedAtLocal: {
    type: "timestamp",
    nullable: true,
  },
  deletedBy: {
    type: "uuid",
    nullable: true,
  },
  timezone: {
    type: "varchar",
    length: 255,
    nullable: true,
  },
  createdAt: {
    type: "timestamp",
    createDate: true,
  },
  createdAtLocal: {
    type: "timestamp",
    nullable: true,
  },
  updatedAt: {
    type: "timestamp",
    updateDate: true,
  },
  updatedAtLocal: {
    type: "timestamp",
    nullable: true,
  },
  createdBy: {
    type: "uuid",
    nullable: true,
  },
  updatedBy: {
    type: "uuid",
    nullable: true,
  },
  allocationRuleId: {
    type: "uuid",
    default: null,
  },
  baseRateId: {
    type: "uuid",
    nullable: true,
  },
  rating: {
    type: "decimal",
    default: 0,
    nullable: true,
  },
};

module.exports = { EvseStationColumns };
