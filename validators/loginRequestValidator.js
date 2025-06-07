const joi = require("joi");

const loginRequestValidator = joi.object({
    email: joi.string().email().required().messages({
        "string.email": "An invalid email is given",
        "any.required": "Email is required",
        "string.empty": "Email cannot be empty"
    }),
    password: joi.string().min(8).max(40).required().messages({
        "string.empty": "Password cannot be empty",
        "string.min": "Password must be at least 8 characters long",
        "string.max": "Password cannot be longer than 40 characters",
        "any.required": "Password is required"
    })

}).required().messages({
    "any.required": "Please give some login details"
});

module.exports = loginRequestValidator;