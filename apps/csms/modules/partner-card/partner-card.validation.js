const Joi = require("joi");

const validateExpiryDate = (value, helpers) => {
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{4}$/;
    if (!expiryRegex.test(value)) {
        throw new Error("Expiry date must be in MM/YYYY format");
    }

    const [month, year] = value.split('/');
    const expiryDate = new Date(parseInt(year), parseInt(month) - 1);
    const currentDate = new Date();

    if (expiryDate < currentDate) {
        throw new Error("Card has expired");
    }

    return value;
};


const createPartnerCardValidation = {
    body: Joi.object({
        partnerId: Joi.string().uuid().required(),
        stripeCustomerId: Joi.string().max(255).required(),
        stripeCardId: Joi.string().max(255).required(),
        tokenId: Joi.string().max(255).required(),
        cardNumber: Joi.string().max(20).required(),
        expiryDate: Joi.string().length(7).required().custom(validateExpiryDate),
        nameOnCard: Joi.string().max(255).required(),
        cardType: Joi.string().max(50).required(),
        isPrimary: Joi.boolean().optional().default(false),
        isDeleted: Joi.boolean().optional().default(false),
    }),
};


module.exports = {
    createPartnerCardValidation,
};