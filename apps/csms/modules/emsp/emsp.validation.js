const Joi = require("joi");
const { EMspRepository } = require("@shared-libs/db/mysql");

// for rejectBankVerification
const validateEmspExists = async (value, helpers) => {
    try {
        const emsp = await EMspRepository.findOne({
            where: { id: value, isDeleted: false },
        });
        if (!emsp) {
            throw new Error("eMSP not found");
        }
        return value;
    } catch (error) {
        throw new Error("eMSP not found");
    }
};

const rejectBankVerificationValidation = {
    params: Joi.object().keys({
        emspId: Joi.string().required().uuid().external(validateEmspExists),
    }),
};

const approveBankVerificationValidation = {
    params: Joi.object().keys({
        emspId: Joi.string().required().uuid().external(validateEmspExists),
    }),
    body: Joi.object().keys({
        taxCertificateDocumentId: Joi.string().required(),
        incorporationCertificateDocumentId: Joi.string().required(),
        bankVerificationLetterDocumentId: Joi.string().required(),
    }),
};

const setSettlementScheduleValidation = {
    params: Joi.object().keys({
        emspId: Joi.string().required().uuid().external(validateEmspExists),
    }),
    body: Joi.object().keys({
        settlementPeriod: Joi.string().required(),
        nextSettlementDate: Joi.date().required(),
    }),
};

module.exports = {
    rejectBankVerificationValidation,
    approveBankVerificationValidation,
    setSettlementScheduleValidation,
};