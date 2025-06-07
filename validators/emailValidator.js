const joi = require("joi");
const emailValidator = joi.string().email().required().messages({
    "string.email": "An invalid email is given",
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty"
});

module.exports = emailValidator;