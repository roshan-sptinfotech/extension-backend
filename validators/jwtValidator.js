const joi = require("joi");
const jwtValidator = joi.string().required().messages({
    "string.empty": "Token cannot be empty",
    "any.required": "Token is required",
    "string.base": "Token must be a string"
});

module.exports = jwtValidator;