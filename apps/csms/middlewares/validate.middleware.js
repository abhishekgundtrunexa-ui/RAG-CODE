const Joi = require("joi");
const { pick } = require("@shared-libs/helpers");
require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const Validate = (schema) => async (req, res, next) => {
  if (process.env.USE_JOI == "true") {
    try {
      const validSchema = pick(schema, ["params", "query", "body"]);
      const object = pick(req, Object.keys(validSchema));

      const { value, error } = await Joi.compile(validSchema)
        .prefs({ errors: { label: "key" }, abortEarly: false })
        .validateAsync(object);

      if (error) {
        const errorMessages = error.details.map((details) => details.message);
        return res
          .status(400)
          .json({
            success: false,
            message: "Validation Failed.",
            errorMessages,
          });
      }

      Object.assign(req, value);
      return next();
    } catch (validationError) {
      // Handle errors from external validations (like validateEmailUnique)
      let errorMessage = "Validation failed";

      if (validationError.message) {
        errorMessage = validationError.message;
      } else if (
        validationError.details &&
        validationError.details.length > 0
      ) {
        errorMessage = validationError.details[0].message;
      }

      return res.status(400).json({
        success: false,
        message: "Validation Failed.",
        errorMessage: errorMessage,
      });
    }
  } else {
    return next();
  }
};

module.exports = {
  Validate,
};
