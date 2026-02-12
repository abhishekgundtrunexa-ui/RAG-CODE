const Joi = require("joi");

const setChargerConfigurationsValidation = {
  params: Joi.object().keys({
    serial_number: Joi.string().required(),
  }),
  body: Joi.object().keys({
    connectorTypeId: Joi.string().required().uuid(),
    paymentModule: Joi.string().required(),
    wiringType: Joi.string().required(),
    typicalVoltage: Joi.number().required().positive(),
    maxCurrentLimitPerPhase: Joi.number().required().positive(),
    partnerId: Joi.string().required().uuid(),
    evseStationId: Joi.string().required().uuid(),
    paymentConfig: Joi.object()
      .keys({
        paymentProvider: Joi.string().required(),
        paymentManufacturerId: Joi.string().required(),
        paymentDeviceId: Joi.string().required(),
      })
      .required(),
    cards: Joi.array()
      .items(
        Joi.object().keys({
          cardUid: Joi.string().required(),
          cardLabel: Joi.string().required(),
          expiryDate: Joi.string().optional(),
          expiryTime: Joi.string().optional(),
        })
      )
      .optional(),
  }),
};

module.exports = {
  setChargerConfigurationsValidation,
};
