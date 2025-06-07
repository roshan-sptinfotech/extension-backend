const mongoClient = require("../database/connection.js");

function addDays(date, days)
{
    const newDate = new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    return newDate;
}

//These functions expect the _id argument value to be an ObjectId() object value

export async function incrementDays(days, _id, session)
{
    const user = await mongoClient.db("emailReadReceipt").collection("users").findOne({ _id }, { session });
    const oldServiceExpirationDate = user.serviceExpirationDate;
    //Adding the number of milliseconds that are equal to the given number of days
    const newServiceExpirationDate = addDays(oldServiceExpirationDate, days);
    const updateDocument = {
        $set: {
            serviceExpirationDate: newServiceExpirationDate
        }
    };
    await mongoClient.db("emailReadReceipt").collection("users").updateOne({ _id }, updateDocument, { session });
    
}

export async function incrementMonths(months, _id, session)
{
    const user = await mongoClient.db("emailReadReceipt").collection("users").findOne({ _id }, { session });
    const oldServiceExpirationDate = user.serviceExpirationDate;

    //For now we are treating a month to be a period of 28 days
    const newServiceExpirationDate = addDays(oldServiceExpirationDate, months * 28);
    const updateDocument = {
        $set: {
            serviceExpirationDate: newServiceExpirationDate
        }
    };
    await mongoClient.db("emailReadReceipt").collection("users").updateOne({ _id }, updateDocument, { session });
    

}