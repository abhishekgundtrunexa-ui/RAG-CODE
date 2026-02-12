const Joi = require("joi");
const {
    DepartmentRepository,
    UserRoleRepository,
    UserRepository,
} = require("@shared-libs/db/mysql");

// Custom validation functions for database checks
const validateDepartmentExists = async (value, helpers) => {
    try {
        const department = await DepartmentRepository.findOne({
            where: { id: value, isDeleted: false },
        });
        if (!department) {
            throw new Error("Department not found");
        }
        return value;
    } catch (error) {
        throw new Error("Department not found");
    }
};

const validateUserRoleExists = async (value, helpers) => {
    try {
        const userRole = await UserRoleRepository.findOne({
            where: { id: value, isDeleted: false },
        });
        if (!userRole) {
            throw new Error("User role not found");
        }
        return value;
    } catch (error) {
        throw new Error("User role not found");
    }
};

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

// validate phone number is not exists for another user
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

// Validation for adding a new user
const addUserValidation = {
    body: Joi.object().keys({
        fullName: Joi.string().required(),
        email: Joi.string().required().email().external(validateEmailUnique),
        phoneNumber: Joi.string().required().external(validatePhoneNumberUnique),
        departmentId: Joi.string().required().uuid().external(validateDepartmentExists),
        userRoleId: Joi.string().required().uuid().external(validateUserRoleExists),
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

// Validation for updating a user
const updateUserValidation = {
    params: Joi.object().keys({
        id: Joi.string().required().uuid().external(validateUserExists),
    }),
    body: Joi.object().keys({
        fullName: Joi.string().required(),
        email: Joi.string().required().email(),
        phoneNumber: Joi.string().required(),
        departmentId: Joi.string().required().uuid(),
        userRoleId: Joi.string().required().uuid(),
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

// Validation for deleting user(s) - only accepts body with ids array
const deleteUserValidation = {
    body: Joi.object().keys({
        ids: Joi.array().items(
            Joi.string().uuid().external(validateUserExists),
        ).required(),
        otp: Joi.string().optional(),
    })
};

// Validation for getting user by ID
const getUserByIdValidation = {
    params: Joi.object().keys({
        id: Joi.string().required().uuid().external(validateUserExists),
    }),
};

module.exports = {
    addUserValidation,
    updateUserValidation,
    deleteUserValidation,
    getUserByIdValidation,
};