const Joi = require("joi");
const {
    ChargerRepository,
    EvseStationRepository,
    CpoRepository,
    OcppTransactionsRepository,
} = require("@shared-libs/db/mysql");

// Custom validation functions
const validateChargerExists = async (value, helpers) => {
    try {
        const charger = await ChargerRepository.findOne({
            where: { chargeBoxId: value, isDeleted: false },
        });
        if (!charger) {
            throw new Error("Charger not found");
        }
        return value;
    } catch (error) {
        throw new Error("Charger not found");
    }
};

const validateTransactionExists = async (value, helpers) => {
    try {
        const transaction = await OcppTransactionsRepository.findOne({
            where: { id: value, isDeleted: false },
        });
        if (!transaction) {
            throw new Error("Transaction not found");
        }
        return value;
    } catch (error) {
        throw new Error("Transaction not found");
    }
};

const validateEvseStationExists = async (value, helpers) => {
    try {
        const evseStation = await EvseStationRepository.findOne({
            where: { id: value, isDeleted: false },
        });
        if (!evseStation) {
            throw new Error("EVSE station not found");
        }
        return value;
    } catch (error) {
        throw new Error("EVSE station not found");
    }
};

const validateCpoExists = async (value, helpers) => {
    try {
        const cpo = await CpoRepository.findOne({
            where: { id: value, isDeleted: false },
        });
        if (!cpo) {
            throw new Error("CPO not found");
        }
        return value;
    } catch (error) {
        throw new Error("CPO not found");
    }
};

// Validation for getting transaction by ID
const getTransactionByIdValidation = {
    params: Joi.object().keys({
        transactionId: Joi.string().required().uuid(),
    }),
};

// Validation for adding test transaction data
const addTransactionTestDataValidation = {
    body: Joi.object().keys({
        chargeBoxId: Joi.string().required(),
        connectorId: Joi.number().integer().required(),
        startTime: Joi.string().required(),
        endTime: Joi.string().required(),
        meterStart: Joi.number().positive().required(),
        meterStop: Joi.number().positive().required(),
        paymentProvider: Joi.string().valid("moneris", "stripe", "razorpay", "littlepay").required().default("moneris"),
        cardType: Joi.string().valid("visa", "mastercard", "amex", "americanexpress", "jcb", "discover", "interac", "interacflash").required().default("visa"),
        maskedPan: Joi.string().required(),
    })
};

module.exports = {
    getTransactionByIdValidation,
    addTransactionTestDataValidation,
};
