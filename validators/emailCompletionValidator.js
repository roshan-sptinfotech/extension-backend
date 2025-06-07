// const joi = require("joi");

// /* 
// This function expects a request body of the following shape
// {
//     emailId: "encrypted email id", (Done)
//     subject: "some subject", (Done)
//     hyperlinks: [{ position: 1, href: "<our request url>" }]
//     receivers: ["receiver 1", "receiver 2"], (Done)
//     emailBody: "some string value" (Done)
// }
// */

// const hyperlinkValidator = joi.object({
//     href: joi.string().required().messages({
//         "any.required": "href field is required",
//         "string.empty": "href field cannot be empty"
//     }),
//     position: joi.number().required().messages({
//         "number.base": "A hyperlink position has to be a number value"
//     })
// });

// const emailCompletionValidator = joi.object({
//     emailId: joi.string().required().messages({
//         "any.required": "emailId is required",
//         "string.empty": "emailId cannot be empty"
//     }),
//     subject: joi.string().required().messages({
//         "string.empty": "Subject cannot be empty",
//         "any.required": "Subject is required"
//     }),
//     emailBody: joi.string().required().messages({
//         "string.empty": "At least an empty string has to be provided",
//         "any.required": "At least an empty string has to be provided"
//     }),
//     receivers: joi.array().required(joi.string().
//     messages({ "string.base": "Receivers should be string values" }))
//     .messages({
//         "any.required": "A receivers list is required"
//     }),
//     hyperlinks: joi.array(hyperlinkValidator).required().messages({  
//         "any.required": "At least an empty hyperlink array is needed"
//     })

// }).required().messages({
//     "any.required": "Please give email completion request details"
// });

// module.exports = loginRequestValidator;