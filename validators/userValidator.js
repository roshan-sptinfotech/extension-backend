const joi = require("joi");
const userValidator = joi.object({
    name: joi.string().required().min(3).max(40).messages({
        "string.empty": "Name cannot be empty",
        "string.min": "Name should contain at least 3 characters",
        "any.required": "Name is required",
        "string.max": "Name cannot be longer than 40 characters"
    }),
    email: joi.string().email().required().messages({
        "string.email": "An invalid email is given",
        "any.required": "Email is required",
        "string.empty": "Email cannot be empty"
    }),
    contact: joi.string().regex(/^\+?[1-9][0-9]{7,14}$/).required().messages({
        "any.required": "Contact number is required",
        "string.pattern.base": "Please give a valid phone number"
    }),
    password: joi.string().min(8).max(40).required().messages({
        "string.empty": "Password cannot be empty",
        "string.min": "Password must be at least 8 characters long",
        "string.max": "Password cannot be longer than 40 characters",
        "any.required": "Password is required"
    })
}).required().messages({
    "any.required": "Please provide user details"
});

module.exports = userValidator;