const ContractColumns = {
  id: {
    type: "uuid",
    primary: true,
    generated: "uuid",
  },
  contractCode: {
    type: "varchar",
    length: 255,
    nullable: true,
  },
  validFrom: {
    type: "timestamp",
    nullable: true,
  },
  validTo: {
    type: "timestamp",
    nullable: true,
  },
  isDeleted: {
    type: "boolean",
    default: false,
  },
  isExpired: {
    type: "boolean",
    default: false,
  },
  emspId: {
    type: "varchar",
    length: 255,
    nullable: false,
    default: null,
  },
  country: {
    type: "varchar",
    length: 255,
    nullable: false,
    default: null,
  },
  createdBy: {
    type: "uuid",
    nullable: true,
  },
  updatedBy: {
    type: "uuid",
    nullable: true,
  },
  createdAt: {
    type: "timestamp",
    createDate: true,
    nullable: true,
  },
  updatedAt: {
    type: "timestamp",
    updateDate: true,
    nullable: true,
  },
};

module.exports = { ContractColumns };
