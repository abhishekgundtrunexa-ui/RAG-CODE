const Joi = require("joi");
const {
    UserRepository,
} = require("@shared-libs/db/mysql");

// Custom validation functions
const validateEmailUnique = async (value, helpers) => {
    try {
        const existingUser = await UserRepository.findOne({
            where: { email: value, isDeleted: false },
        });
        if (existingUser) {
            throw new Error("User with this email already exists");
        }
        return value;
    } catch (error) {
        throw new Error("User with this email already exists");
    }
};

const validatePhoneNumberUnique = async (value, helpers) => {
    if (!value) return value; // Skip validation if no phone number provided

    try {
        const existingUser = await UserRepository.findOne({
            where: { phoneNumber: value, isDeleted: false }
        });
        if (existingUser) {
            throw new Error("Phone number already exists");
        }
        return value;
    } catch (error) {
        throw new Error("Phone number already exists");
    }
};

// validate user exists
const validateUserExists = async (value, helpers) => {
    const user = await UserRepository.findOne({
        where: { id: value, isDeleted: false },
    });
    if (!user) {
        throw new Error("User not found");
    }
    return value;
};

// Validation for adding a super admin
const addSuperAdminValidation = {
    body: Joi.object().keys({
        fullName: Joi.string().required(),
        email: Joi.string().required().email().external(validateEmailUnique),
        phoneNumber: Joi.string().required().external(validatePhoneNumberUnique),
        country: Joi.string().required(),
        permissions: Joi.array().items(
            Joi.object({
                module: Joi.string().required(),
                enabled: Joi.boolean().required(),
                subModules: Joi.array().items(
                    Joi.object({
                        name: Joi.string().required(),
                        access: Joi.string().required(),
                    })
                ).optional(),
            })
        ).optional(),
        otp: Joi.string().optional(),
    })
};

// Validation for updating a super admin
const updateSuperAdminValidation = {
    params: Joi.object().keys({
        id: Joi.string().required().uuid(),
    }),
    body: Joi.object().keys({
        fullName: Joi.string().required(),
        email: Joi.string().required().email(),
        phoneNumber: Joi.string().required(),
        country: Joi.string().required(),
        permissions: Joi.array().items(
            Joi.object({
                module: Joi.string().required(),
                enabled: Joi.boolean().required(),
                subModules: Joi.array().items(
                    Joi.object({
                        name: Joi.string().required(),
                        access: Joi.string().required(),
                    })
                ).optional(),
            })
        ).optional(),
        otp: Joi.string().optional(),
    })
};

// Validation for deleting super admin
const deleteSuperAdminValidation = {
    body: Joi.object().keys({
        ids: Joi.array().items(
            Joi.string().uuid().external(validateUserExists),
        ).required(),
        otp: Joi.string().optional(),
    })
};

// Validation for getting super admin by ID
const getSuperAdminByIdValidation = {
    params: Joi.object().keys({
        id: Joi.string().required().uuid().external(validateUserExists),
    }),
};

module.exports = {
    addSuperAdminValidation,
    updateSuperAdminValidation,
    deleteSuperAdminValidation,
    getSuperAdminByIdValidation,
};
