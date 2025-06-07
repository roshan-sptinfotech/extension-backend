const asyncHandler = require("../utils/asyncHandler.js");

/*  WORK => We still have to check the working of this function
    We assume that this middleware function will run after the authentication has been done
    so that we can access the req.user object.
*/
const checkServiceExpiration = asyncHandler(async (req, res, next) => 
{
    const user = req.user;
    const currentDateTimestamp = Date.now();
    const serviceExpirationTimestamp = user.serviceExpirationDate.getTime();
    


    // console.log(currentDateTimestamp, serviceExpirationTimestamp);

    const errorMessage = "Your subscription has expired. Please extend your subscription to continue the use of this service";

    if(currentDateTimestamp >= serviceExpirationTimestamp)
        return res.status(400).send({ error: errorMessage, subscriptionExpired: true });

    next();
});

module.exports = checkServiceExpiration;