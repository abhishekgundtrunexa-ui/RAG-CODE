const { EntitySchema } = require("typeorm");
const { UserStatuses } = require("@shared-libs/constants");

module.exports = new EntitySchema({
    name: "EmspUser",
    tableName: "emsp_user",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid",
        },
        emspId: {
            type: "uuid",
            nullable: false,
        },
        apexEmailVerified: {
            type: "boolean",
            default: false
        },
        departmentId: {
            type: "uuid",
            nullable: false,
        },
        stripeCustomerId: {
            type: "varchar",
            length: 255,
            nullable: true,
        },
        name: {
            type: "varchar",
            length: 255,
            nullable: false,
        },
        state: {
            type: "varchar",
            length: 100,
            nullable: true,
        },
        pincode: {
            type: "varchar",
            length: 20,
            nullable: true,
        },
        email: {
            type: "varchar",
            length: 255,
            nullable: false,
            unique: true,
        },
        phone: {
            type: "varchar",
            length: 255,
            nullable: true,
        },
        profilePicture: {
            type: "varchar",
            length: 255,
            nullable: true,
        },
        isBillingAddressSame: {
            type: "boolean",
            default: false
        },
        status: {
            type: "enum",
            enum: UserStatuses,
            nullable: false,
            default: UserStatuses.REGISTERED,
        },
        lastLogin: {
            type: "timestamp",
            nullable: true,
        },
        resetPasswordCode: {
            type: "varchar",
            length: 255,
            nullable: true,
        },
        resetPasswordExpiresAt: {
            type: "timestamp",
            nullable: true,
        },
        resetPasswordRequestedAt: {
            type: "timestamp",
            nullable: true,
        },
        country: {
            type: "varchar",
            nullable: true
        },
        isEmsp: {
            type: "boolean",
            default: false
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
    }
});
