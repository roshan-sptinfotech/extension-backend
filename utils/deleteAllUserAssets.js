const mongoClient = require("../database/connection.js");
const mongodb = require("mongodb");

async function deleteAllUserAssets(userId, session)
{
    //First we delete all the emails of a user
    let filter = { owner: userId };
    const emails = await mongoClient.db("emailReadReceipt").collection("emails").find(filter, { session }).toArray();

    for(let email of emails)
    {
        //For deleting an email, we first delete all of its receivers
        await mongoClient.db("emailReadReceipt").collection("receivers").deleteMany({ emailId: email._id }, { session });

        //Then we delete all the hyperlinks of the email
        await mongoClient.db("emailReadReceipt").collection("hyperlinks").deleteMany({ emailId: email._id }, { session });
    
        //Then we delete all the email views
        await mongoClient.db("emailReadReceipt").collection("emailViews").deleteMany({ emailId: email._id }, { session });
    
        //Then finally we delete the email itself
        await mongoClient.db("emailReadReceipt").collection("emails").deleteOne({ owner: userId }, { session });
    }
}

module.exports = deleteAllUserAssets;