const Joi = require("joi");
const {
    ChargerRepository,
    ChargerConnectorTypeRepository,
    EvseStationRepository,
    CpoRepository,
    ChargerConnectorMappingRepository,
} = require("@shared-libs/db/mysql");
const { customErrorMsg } = require("@shared-libs/constants");

// Custom validation functions
const validateChargerExists = async (value, helpers) => {
    try {
        const charger = await ChargerRepository.findOne({
            where: { id: value, isDeleted: false },
        });
        if (!charger) {
            throw new Error(customErrorMsg.charger.CHARGER_NOT_FOUND);
        }
        return value;
    } catch (error) {
        throw new Error(customErrorMsg.charger.CHARGER_NOT_FOUND);
    }
};

const validateConnectorTypeExists = async (value, helpers) => {
    try {
        const connectorType = await ChargerConnectorTypeRepository.findOne({
            where: { id: value },
        });
        if (!connectorType) {
            throw new Error(customErrorMsg.charger.INVALID_CONNECTOR_TYPE);
        }
        return value;
    } catch (error) {
        throw new Error(customErrorMsg.charger.INVALID_CONNECTOR_TYPE);
    }
};

const validateEvseStationExists = async (value, helpers) => {
    try {
        const evseStation = await EvseStationRepository.findOne({
            where: { id: value, isDeleted: false },
        });
        if (!evseStation) {
            throw new Error(customErrorMsg.charger.EVSE_STATION_NOT_FOUND);
        }
        return value;
    } catch (error) {
        throw new Error(customErrorMsg.charger.EVSE_STATION_NOT_FOUND);
    }
};

const validateCpoExists = async (value, helpers) => {
    try {
        const cpo = await CpoRepository.findOne({
            where: { id: value, isDeleted: false },
        });
        if (!cpo) {
            throw new Error(customErrorMsg.charger.CPO_NOT_FOUND);
        }
        return value;
    } catch (error) {
        throw new Error(customErrorMsg.charger.CPO_NOT_FOUND);
    }
};

const validateSerialNumberUnique = async (value, helpers) => {
    try {
        const existingCharger = await ChargerRepository.findOne({
            where: { serialNumber: value.replace(/-/g, "") },
        });
        if (existingCharger) {
            throw new Error(customErrorMsg.charger.CHARGER_ALREADY_EXISTS);
        }
        return value;
    } catch (error) {
        throw new Error(customErrorMsg.charger.CHARGER_ALREADY_EXISTS);
    }
};

// Validation for charger registration
const registerChargerValidation = {
    body: Joi.object().keys({
        chargerModel: Joi.string().required(),
        connectorTypeId: Joi.string().required().uuid().external(validateConnectorTypeExists),
        country: Joi.string().optional(),
        serialNumber: Joi.string().required().external(validateSerialNumberUnique),
    })
};

// Validation for updating charger configuration
const updateConfigurationValidation = {
    params: Joi.object().keys({
        chargerId: Joi.string().required().uuid(),
    }),
    body: Joi.object().keys({
        chargerModel: Joi.string().optional(),
        connectorTypeId: Joi.string().optional().uuid(),
        energyMeter: Joi.string().optional(),
        paymentModule: Joi.string().optional(),
    })
};

// Validation for assigning CPO and EVSE station
const assignCpoAndEvseStationValidation = {
    params: Joi.object().keys({
        chargerId: Joi.string().required().uuid(),
    }),
    body: Joi.object().keys({
        cpoId: Joi.string().required().uuid(),
        evseStationId: Joi.string().required().uuid(),
    })
};

// Validation for assigning CPO only
const assignCpoValidation = {
    params: Joi.object().keys({
        chargerId: Joi.string().required().uuid(),
    }),
    body: Joi.object().keys({
        cpoId: Joi.string().required().uuid(),
    })
};

// Validation for bulk CPO assignment
const assignCpoBulkValidation = {
    params: Joi.object().keys({
        chargerIds: Joi.array().items(Joi.string().uuid()).required(),
    }),
    body: Joi.object().keys({
        cpoId: Joi.string().required().uuid(),
    })
};

// Validation for assigning EVSE station only
const assignEvseStationValidation = {
    params: Joi.object().keys({
        chargerId: Joi.string().required().uuid(),
    }),
    body: Joi.object().keys({
        evseStationId: Joi.string().required().uuid(),
    })
};

// Validation for bulk EVSE station assignment
const assignEvseStationBulkValidation = {
    params: Joi.object().keys({
        chargerIds: Joi.array().items(Joi.string().uuid()).required(),
    }),
    body: Joi.object().keys({
        evseStationId: Joi.string().required().uuid(),
    })
};

// Validation for setting charger language
const setChargerLanguageValidation = {
    params: Joi.object().keys({
        chargerId: Joi.string().required().uuid(),
    }),
    body: Joi.object().keys({
        language: Joi.string().required(),
        connectorId: Joi.number().integer().min(1).optional().default(1),
    })
};

// Validation for setting charger constant
const setChargerConstantValidation = {
    params: Joi.object().keys({
        chargerId: Joi.string().required().uuid(),
    }),
    body: Joi.object().keys({
        avgChargingDurationInSec: Joi.number().required(),
        maxChargerPowerInKw: Joi.number().required(),
        contingencyPercentage: Joi.number().required(),
        transactionFeePercentage: Joi.number().required(),
    })
};

// Validation for setting charger OCPP config
const setChargerOcppConfigValidation = {
    params: Joi.object().keys({
        chargerId: Joi.string().required().uuid(),
    }),
    body: Joi.object().keys({
        csmsURL: Joi.string().required(),
        ocppVersion: Joi.string().required(),
        certificatePath: Joi.string().required(),
        heartbeatIntervalSeconds: Joi.string().required(),
        heartbeatThreshold: Joi.string().required(),
    })
};

// Validation for setting charger metering config
const setChargerMeteringConfigValidation = {
    params: Joi.object().keys({
        chargerId: Joi.string().required().uuid(),
    }),
    body: Joi.object().keys({
        underVoltageLimitPerPhase: Joi.number().required(),
        overVoltageLimitPerPhase: Joi.number().required(),
        underCurrentLimitPerPhase: Joi.number().required(),
        overCurrentLimitPerPhase: Joi.number().required(),
        maxCurrentLimitPerPhase: Joi.number().required(),
        noLoadTimeLimit: Joi.number().required(),
    })
};
// Validation for updating charger timezone
const updateChargerTimezoneValidation = {
    body: Joi.object().keys({
        inputValue: Joi.string().required(),
        timezone: Joi.string().required(),
    })
};

// Validation for updating print sticker
const updatePrintStickerValidation = {
    params: Joi.object().keys({
        chargerId: Joi.string().required().uuid(),
    }),
};

// Validation for changing charger status
const changeChargerStatusValidation = {
    params: Joi.object().keys({
        chargerId: Joi.string().required().uuid(),
    }),
    body: Joi.object().keys({
        status: Joi.string().required(),
    })
};

// Validation for updating charger location
const updateChargerLocationValidation = {
    params: Joi.object().keys({
        chargeBoxId: Joi.string().required(),
    }),
};

// Validation for adding connector
const addConnectorValidation = {
    params: Joi.object().keys({
        chargerId: Joi.string().required().uuid(),
    }),
    body: Joi.object().keys({
        connectorTypeId: Joi.string().required().uuid(),
        connectorId: Joi.string().optional().uuid(),
    })
};

// Validation for changing charging status
const updateChargingStatusValidation = {
    params: Joi.object().keys({
        chargerId: Joi.string().required().uuid(),
    }),
    body: Joi.object().keys({
        status: Joi.string().required(),
    })
};

// Validation for verifying device admin
const verifyDeviceAdminValidation = {
    body: Joi.object().keys({
        chargeboxId: Joi.string().required(),
        passCode: Joi.string().required(),
    })
};

// Validation for deleting chargers in bulk
const deleteChargersBulkValidation = {
    body: Joi.object().keys({
        chargerIds: Joi.array().items(Joi.string().uuid()).required(),
        otp: Joi.string().optional(),
    })
};

// Validation for deleting charger by ID
const deleteChargerByIdValidation = {
    params: Joi.object().keys({
        chargerId: Joi.string().required().uuid(),
    }),
    body: Joi.object().keys({
        otp: Joi.string().optional(),
    })
};
// Validation for getting feedback average
const getFeedbackAverageValidation = {
    body: Joi.object().keys({
        chargerId: Joi.string().required().uuid(),
        evseStationId: Joi.string().optional(),
        cpoId: Joi.string().optional(),
    })
};

module.exports = {
    registerChargerValidation,
    updateConfigurationValidation,
    assignCpoAndEvseStationValidation,
    assignCpoValidation,
    assignCpoBulkValidation,
    assignEvseStationValidation,
    assignEvseStationBulkValidation,
    setChargerLanguageValidation,
    setChargerConstantValidation,
    setChargerOcppConfigValidation,
    setChargerMeteringConfigValidation,
    updateChargerTimezoneValidation,
    updatePrintStickerValidation,
    changeChargerStatusValidation,
    updateChargerLocationValidation,
    addConnectorValidation,
    updateChargingStatusValidation,
    verifyDeviceAdminValidation,
    deleteChargersBulkValidation,
    deleteChargerByIdValidation,
    getFeedbackAverageValidation,
};
