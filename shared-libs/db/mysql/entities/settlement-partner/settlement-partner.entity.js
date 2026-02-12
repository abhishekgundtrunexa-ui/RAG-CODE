const { EntitySchema } = require("typeorm");
const { PartnerTypes, TransferStatuses } = require("@shared-libs/constants");

module.exports = new EntitySchema({
    name: "SettlementPartner",
    tableName: "settlement_partner",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid",
        },
        settlementId: {
            type: "uuid",
            nullable: false,
        },
        partnerId: {
            type: "uuid",
            nullable: false,
        },
        partnerName: {
            type: "varchar",
            nullable: false,
        },
        partnerEmail: {
            type: "varchar",
            nullable: false,
        },
        partnerType: {
            type: "enum",
            enum: PartnerTypes,
            nullable: false,
        },
        splitPercentage: {
            type: "int",
            nullable: false,
        },
        amount: {
            type: "decimal",
            nullable: false,
        },
        transferStatus: {
            type: "enum",
            enum: TransferStatuses,
            nullable: false,
        },
        transferredBy: {
            type: "uuid",
            nullable: false,
        },
        bankName: {
            type: "varchar",
            nullable: false,
        },
        accountNumber: {
            type: "varchar",
            nullable: false,
        },
        timezone: {
            type: "varchar",
            nullable: false,
        },
        createdAt: {
            type: "timestamp",
            createDate: true,
        },
        updatedAt: {
            type: "timestamp",
            updateDate: true,
        },
        createdAtLocal: {
            type: "timestamp",
            nullable: true,
        },
        updatedAtLocal: {
            type: "timestamp",
            nullable: true,
        },
    },
});