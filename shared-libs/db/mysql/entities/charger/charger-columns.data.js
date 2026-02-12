const { ChargerStatuses, ChargingStatuses } = require("@shared-libs/constants");

const ChargerColumns = {
  id: {
    type: "uuid",
    primary: true,
    generated: "uuid",
  },
  uniqueId: {
    type: "varchar",
    nullable: true,
    length: 255,
  },
  serialNumber: {
    type: "varchar",
    nullable: false,
    length: 255,
  },
  chargeBoxId: {
    type: "varchar",
    nullable: true,
    length: 255,
  },
  deviceName: {
    type: "varchar",
    nullable: true,
    length: 255,
  },
  chargingMode: {
    type: "varchar",
    nullable: true,
    default: "Online",
    length: 255,
  },
  vendor: {
    type: "varchar",
    nullable: false,
    default: "Chargnex",
    length: 255,
  },
  activationDate: {
    type: "timestamp",
    nullable: true,
  },
  activationDateLocal: {
    type: "timestamp",
    nullable: true,
  },
  registeredAt: {
    type: "timestamp",
    nullable: true,
  },
  registeredAtLocal: {
    type: "timestamp",
    nullable: true,
  },
  lat: {
    type: "decimal",
    nullable: true,
  },
  lng: {
    type: "decimal",
    nullable: true,
  },
  validTill: {
    type: "timestamp",
    nullable: true,
  },
  validTillLocal: {
    type: "timestamp",
    nullable: true,
  },
  status: {
    type: "enum",
    enum: Object.values(ChargerStatuses),
    default: ChargerStatuses.GENERATED,
  },
  activationCode: {
    type: "varchar",
    nullable: true,
    length: 255,
  },
  cardPassCode: {
    type: "varchar",
    nullable: true,
    length: 255,
  },
  activationExpiresAt: {
    type: "timestamp",
    nullable: true,
  },
  activationRequestedAt: {
    type: "timestamp",
    nullable: true,
  },
  deviceAdminPassCode: {
    type: "int",
    nullable: false,
    default: null,
  },
  baseCost: {
    type: "decimal",
    nullable: false,
    default: 0,
  },
  currency: {
    type: "varchar",
    nullable: false,
    length: 3,
    default: "USD",
  },
  currencyName: {
    type: "varchar",
    length: 255,
    nullable: true,
    default: "US Dollar",
  },
  currencySymbol: {
    type: "varchar",
    length: 255,
    nullable: true,
    default: "$",
  },
  chargerModel: {
    type: "varchar",
    nullable: true,
    length: 255,
  },
  connectorPair: {
    type: "varchar",
    nullable: true,
    length: 255,
  },
  energyMeter: {
    type: "varchar",
    nullable: true,
    length: 255,
  },
  paymentModule: {
    type: "varchar",
    nullable: true,
    length: 255,
  },
  country: {
    type: "varchar",
    nullable: true,
    length: 255,
  },
  timezone: {
    type: "varchar",
    nullable: true,
    length: 255,
  },
  lastHeartbeat: {
    type: "timestamp",
    nullable: true,
  },
  chargingStatus: {
    type: "enum",
    enum: Object.values(ChargingStatuses),
    nullable: true,
  },
  isStickerPrinted: {
    type: "boolean",
    default: false,
  },
  stickerPrintedAt: {
    type: "timestamp",
    nullable: true,
  },
  stickerPrintedAtLocal: {
    type: "timestamp",
    nullable: true,
  },
  stickerPrintedBy: {
    type: "uuid",
    nullable: true,
  },
  isConfigured: {
    type: "boolean",
    default: false,
  },
  isDeleted: {
    type: "boolean",
    default: false,
  },
  connectorTypeId: {
    type: "uuid",
    nullable: false,
  },
  chargeUsageTypeId: {
    type: "uuid",
    nullable: false,
  },
  evseStationId: {
    type: "uuid",
    nullable: true,
  },
  partnerId: {
    type: "uuid",
    nullable: true,
  },
  cpoId: {
    type: "uuid",
    nullable: true,
  },
  latestTransactionId: {
    type: "int",
    default: 0,
  },
  authCode: {
    type: "int",
    default: null,
  },
  registeredBy: {
    type: "uuid",
    nullable: true,
  },
  updatedBy: {
    type: "uuid",
    nullable: true,
  },
  deletedBy: {
    type: "uuid",
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
  deletedAt: {
    type: "timestamp",
    nullable: true,
  },
  deletedAtLocal: {
    type: "timestamp",
    nullable: true,
  },
  serialNumberExpireAt: {
    type: "timestamp",
    nullable: true,
  },
  authCodeExpireAt: {
    type: "timestamp",
    nullable: true,
  },
  rating: {
    type: "decimal",
    default: 0,
    nullable: true,
  },
};

module.exports = { ChargerColumns };
