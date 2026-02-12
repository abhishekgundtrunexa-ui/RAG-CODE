const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "ContractEvseStations",
    tableName: "contract_evse_stations",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid",
        },
        contractId: {
            type: "uuid",
            nullable: false,
        },
        evseStationId: {
            type: "uuid",
            nullable: false,
        },
        isDeleted: {
            type: "boolean",
            default: false,
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
        createdBy: {
            type: "uuid",
            nullable: true,
        },
        updatedBy: {
            type: "uuid",
            nullable: true,
        },
    },
});
