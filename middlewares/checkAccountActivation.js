const mongoClient = require("../database/connection.js");

//This should be used after the authentication middleware
async function checkAccountActivation(req, res, next)
{
    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();
        const user = req.user;

        if(!user.verified)
        {

            res.status(400).send({ error: "Your account is not verified yet", verified: false });
            await session.abortTransaction();
            return;
        }
        


        await session.commitTransaction();
        next();

    }
    catch(error)
    {
        await session.abortTransaction();
        res.status(500).send({ error: "Some problem occurred at the server side" });
    }

    await session.endSession();
}

module.exports = checkAccountActivation;