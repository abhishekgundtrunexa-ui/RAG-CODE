const Joi = require("joi");
const { SettlementStatuses, TransferStatuses } = require("@shared-libs/constants");

const getSettlementByIdValidation = {
    params: Joi.object().keys({
        settlementId: Joi.string().uuid().required(),
    }),
};

const getSettlementSessionsValidation = {
    params: Joi.object().keys({
        settlementId: Joi.string().uuid().required(),
    }),
};

const getSettlementSessionOverviewValidation = {
    params: Joi.object().keys({
        settlementId: Joi.string().uuid().required(),
    }),
};

const rejectSettlementValidation = {
    params: Joi.object().keys({
        id: Joi.string().uuid().required(),
    }),
};

const updatePartnerTransferStatusValidation = {
    params: Joi.object().keys({
        settlementId: Joi.string().uuid().required(),
    }),
};

module.exports = {
    getSettlementByIdValidation,
    getSettlementSessionsValidation,
    getSettlementSessionOverviewValidation,
    rejectSettlementValidation,
    updatePartnerTransferStatusValidation,
};
