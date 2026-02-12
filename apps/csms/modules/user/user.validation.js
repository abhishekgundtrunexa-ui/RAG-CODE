const Joi = require("joi");
const {
    UserRepository,
    DepartmentRepository,
    UserRoleRepository,
} = require("@shared-libs/db/mysql");

const validateDepartmentExists = async (value, helpers) => {
    const department = await DepartmentRepository.findOne({
        where: { id: value, isDeleted: false },
    });
    if (!department) {
        throw new Error("Department not found");
    }
    return value;
};


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

// validate user role exists

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

const validateUserRoleExists = async (value, helpers) => {
    const userRole = await UserRoleRepository.findOne({
        where: { id: value, isDeleted: false },
    });
    if (!userRole) {
        throw new Error("User role not found");
    }
    return value;
};


// Validation for adding a new user
const addUserValidation = {
    body: Joi.object().keys({
        fullName: Joi.string().required(),
        email: Joi.string().required().email().external(validateEmailUnique),
        phoneNumber: Joi.string().required().external(validatePhoneNumberUnique),
        userRoleId: Joi.string().required().uuid().external(validateUserRoleExists),
        country: Joi.string().required(),
        department: Joi.string().required().uuid().external(validateDepartmentExists)
    })
};

// Validation for getting user by ID
const getUserByIdValidation = {
    params: Joi.object().keys({
        userId: Joi.string().required().uuid().external(validateUserExists),
    }),
};

// Validation for updating user by ID
const updateUserByIdValidation = {
    params: Joi.object().keys({
        userId: Joi.string().required().uuid().external(validateUserExists),
    }),
    body: Joi.object().keys({
        firstName: Joi.string().optional(),
        lastName: Joi.string().optional(),
        fullName: Joi.string().optional(),
    })
};

// Validation for deleting users in bulk
const deleteUserBulkValidation = {
    body: Joi.object().keys({
        ids: Joi.array().items(
            Joi.string().uuid().external(validateUserExists),
        ).required(),
    })
};

// Validation for deleting user by ID
const deleteUserByIdValidation = {
    params: Joi.object().keys({
        userId: Joi.string().required().uuid().external(validateUserExists),
    }),
};

// Validation for resending user invitation
const resendUserInvitationValidation = {
    params: Joi.object().keys({
        userId: Joi.string().required().uuid().external(validateUserExists),
    }),
};

// Validation for enabling user by ID
const enableUserByIdValidation = {
    params: Joi.object().keys({
        userId: Joi.string().required().uuid().external(validateUserExists),
    }),
};

// Validation for disabling user by ID
const disableUserByIdValidation = {
    params: Joi.object().keys({
        userId: Joi.string().required().uuid().external(validateUserExists),
    }),
};

module.exports = {
    addUserValidation,
    getUserByIdValidation,
    updateUserByIdValidation,
    deleteUserBulkValidation,
    deleteUserByIdValidation,
    resendUserInvitationValidation,
    enableUserByIdValidation,
    disableUserByIdValidation,
};