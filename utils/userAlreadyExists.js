// const mongoClient = require("../database/connection.js"); // No longer needed if db is passed

async function userAlreadyExists(db, email, session) // Added db as the first parameter
{
    if (!db) {
        console.error("Database connection not provided to userAlreadyExists");
        // Consider throwing an error or returning a more specific error indicator
        throw new Error("Database connection is not available in userAlreadyExists.");
    }
    const filter = { email: email.toLowerCase() };
    const result = await db.collection("users").findOne(filter, { session });

    return result ? true : false;
}

module.exports = userAlreadyExists;