const mongodb = require("mongodb");
const asyncHandler = require("../utils/asyncHandler.js");
const mongoClient = require("../database/connection.js");
const jwt = require("jsonwebtoken");
const jwtValidator = require("../validators/jwtValidator.js");

/* 
    This function expects the json body to have the following contents:
{
    token: "some json web token string"
}
*/
const authenticationMiddleware = asyncHandler(async (req, res, next) => 
{
    const token = req.body.token;

    if(!token)
        return res.status(400).send({ error: "Please provide an authentication token" });

    const {error} = jwtValidator.validate(token);

    if(error)
        return res.status(400).send({ error: error.details[0].message });

    try
    {
        const salt = process.env.BCRYPT_SALT;
        const payload = jwt.verify(token, salt);
        const _id = new mongodb.ObjectId(payload._id);
        const filter = {
            _id,
            tokens: token
        };

        const user = await mongoClient.db("emailReadReceipt").collection("users").findOne(filter);

        if(!user)
            return res.status(404).send({ error: "User not found" });
        
        /* 
            If we reach here then it means that:
            i) We got a valid token
            ii) The token is not expired
            iii) The token was created using our salt value
            iv) A user exists which has the _id that is embedded inside the token
            v) The user also has the given token still present inside their tokens array.
        */ 

            req.user = user;
            next();
    }
    catch(error)
    {
        if(error.expiredAt)
        {
            /*
            Here we are decoming the payload without verifying the validity of the token so that we can delete 
            the expired token from the database, we also expect that the client side program will also
            delete the expired token 
            */
            let _id = jwt.decode(token)._id;
            _id = new mongodb.ObjectId(_id);
            const filter = {
                _id
            };

            const user = await mongoClient.db("emailReadReceipt").collection("users").findOne(filter);
            user.tokens = user.tokens.filter(element => element !== token);

            //This query deletes the expired token from the database
            await mongoClient.db("emailReadReceipt").collection("users").replaceOne(filter, user);

            return res.status(400).send({ error: "Your token has expired, please login again", expired: true });
        }

        res.status(400).send({ error: "Authentication failed, you may try again after some time" });
    }
    

});

module.exports = authenticationMiddleware;