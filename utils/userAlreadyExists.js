const mongoClient = require("../database/connection.js");

async function userAlreadyExists(email, session)
{
    const filter = { email: email.toLowerCase() };
    const result = await mongoClient.db("emailReadReceipt").collection("users").findOne(filter, { session });

    return result? true: false;
}

module.exports = userAlreadyExists;