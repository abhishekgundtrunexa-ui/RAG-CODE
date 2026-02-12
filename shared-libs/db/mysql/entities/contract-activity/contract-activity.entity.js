const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "ContractActivity",
    tableName: "contract_activity",
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
        userId: {
            type: "uuid",
            nullable: false,
        },
        action: {
            type: "varchar",
            length: 255,
            nullable: false,
        },
        details: {
            type: "text",
            nullable: false,
        },
        createdAt: {
            type: "timestamp",
            createDate: true,
            nullable: true,
        },
        createdAtLocal: {
            type: "timestamp",
            nullable: true,
        },
        updatedAt: {
            type: "timestamp",
            updateDate: true,
            nullable: true,
        },
        updatedAtLocal: {
            type: "timestamp",
            nullable: true,
        },
        createdBy: {
            type: "uuid",
            nullable: true,
        },
    },
});
