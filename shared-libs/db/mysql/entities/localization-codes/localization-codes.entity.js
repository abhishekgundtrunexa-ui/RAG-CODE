const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "LocalizationCodes",
  tableName: "localization_codes",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    iso_code: {
      type: "varchar",
      nullable: false,
    },
    country_name: {
      type: "varchar",
      nullable: false,
    },
    region: {
      type: "varchar",
      nullable: false,
    },
    country_code_alpha: {
      type: "varchar",
      nullable: false,
    },
    country_code_numeric: {
      type: "int",
      nullable: false,
    },
    currency_code_alpha: {
      type: "varchar",
      nullable: false,
    },
    currency_code_numeric: {
      type: "int",
      nullable: false,
    },
    dial_code: {
      type: "varchar",
      nullable: false,
    },
    iso_3166_2: {
      type: "varchar",
      nullable: true,
    },
    isDeleted: {
      type: "boolean",
      default: false,
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
