const Joi = require("joi");

const loginValidation = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

const checkLoginValidation = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
  }),
};

const forgotPasswordValidation = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
  }),
};

const resetPasswordValidation = {
  body: Joi.object().keys({
    code: Joi.string().required(),
    newPassword: Joi.string().required(),
    confirmPassword: Joi.string().required(),
  }),
};

module.exports = {
  loginValidation,
  checkLoginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};
