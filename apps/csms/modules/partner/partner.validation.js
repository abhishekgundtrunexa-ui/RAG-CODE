const Joi = require("joi");
const { UserRepository } = require("@shared-libs/db/mysql");

// validate if partner id exists
const partnerIdExists = async (value, helpers) => {
    try {
        const partner = await UserRepository.findOne({
            where: { id: value, isDeleted: false, },
        });
        if (!partner) {
            throw new Error("Partner not found");
        }
        return value;
    } catch (error) {
        throw new Error("Partner not found");
    }

};



// for rejectBankVerification
const rejectBankVerificationValidation = {
    params: Joi.object().keys({
        id: Joi.string().required().uuid().external(partnerIdExists),
    }),
};

// for approveBankVerification
const approveBankVerificationValidation = {
    params: Joi.object().keys({
        id: Joi.string().required().uuid().external(partnerIdExists),
    }),
    body: Joi.object().keys({
        taxCertificateDocumentId: Joi.string().required(),
        incorporationCertificateDocumentId: Joi.string().required(),
        bankVerificationLetterDocumentId: Joi.string().required(),
    }),
};

module.exports = {
    rejectBankVerificationValidation,
    approveBankVerificationValidation,
};