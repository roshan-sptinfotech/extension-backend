const mongoClient = require("../database/connection.js");
const mongodb = require("mongodb");

async function updateSubscriptionExpiration(userId, planName)
{
    try
    {
        userId = new mongodb.ObjectId(userId);
        // Getting the current time stamp in seconds by dividing by 1000
        let newSubscriptionExpiration = new Date().getTime() / 1000;
        
        if(planName === "Starter")
            newSubscriptionExpiration += 60 * 60 * 24 * 14;

        else if(planName === "Basic")
            newSubscriptionExpiration += 60 * 60 * 24 * 30;
        
        else if(planName === "Pro Subscription")
            newSubscriptionExpiration += 60 * 60 * 24 * 30 * 2;

        // Getting the final time stamp back in milliseconds by multiplying by 1000
        newSubscriptionExpiration *= 1000;

        newSubscriptionExpiration = new Date(newSubscriptionExpiration);

        const filter = { _id: userId };
        const updateDocument = {
            $set: { serviceExpirationDate: newSubscriptionExpiration }
        };

        await mongoClient.db("emailReadReceipt").collection("users").updateOne(filter, updateDocument);
    }
    catch(error)
    {
        console.log("Could not update the service expiration date for the user", error);
        throw error;
    }
}

module.exports = updateSubscriptionExpiration;