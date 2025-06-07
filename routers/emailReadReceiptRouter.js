const express = require("express");
const Cryptr = require("cryptr");
const mongodb = require("mongodb");

const emailReadReceiptRouter = express.Router();
const authMiddleware = require("../middlewares/authentication.js");
const asyncHandler = require("../utils/asyncHandler.js");
const checkServiceExpiration = require("../middlewares/checkServiceExpiration.js");
const mongoClient = require("../database/connection.js");
const detectUserAgent = require("../utils/detectUserAgent.js");
const generateRedirectionPage = require("../utils/generateRedirectionPage.js");
const encryptionObject = new Cryptr(process.env.BCRYPT_SALT);
const checkAccountActivation = require("../middlewares/checkAccountActivation.js");

emailReadReceiptRouter.post("/create-email", authMiddleware, checkAccountActivation, checkServiceExpiration, asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();

        const user = req.user;
        const newEmail = {
            subject: "No Subject",
            owner: user._id,
            sent: false,
            createdOn: new Date()
        };
        const result = await mongoClient.db("emailReadReceipt").collection("emails").insertOne(newEmail, { session });


        const encryptedImageName = encryptionObject.encrypt(result.insertedId.toString()) + ".png";

        res.status(201).send({ trackingImageName: encryptedImageName });

        await session.commitTransaction();
    }
    catch(error)
    {
        await session.abortTransaction();
        res.status(500).send({ error: "Could not initiate a new email tracking request" });
    }

    await session.endSession();
}));

/*
This function expects a request body of the following shape
{
    "token": "<some jwt token>",
    "emailId": <encrypted email id>
}
*/

emailReadReceiptRouter.delete("/delete-email", authMiddleware, checkAccountActivation, asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();
        let emailId = req.body.emailId;

        if(!emailId)
        {
            res.status(400).send({ error: "Please provide a database email id" });

            await session.abortTransaction();
        }


        const pngIndex = emailId.lastIndexOf(".png");
        emailId = emailId.slice(0, pngIndex);
        const _id = encryptionObject.decrypt(emailId);

        const filter = {
            _id: new mongodb.ObjectId(_id),
            owner: req.user._id
        };

        //Now we have to delete this email only if the currently authenticated user has created the email
        await mongoClient.db("emailReadReceipt").collection("emails").deleteOne(filter, { session });

        res.send({ message: "Your email was deleted" });

        await session.commitTransaction();
    }
    catch(error)
    {
        await session.abortTransaction();
        res.status(400).send({ error: "Could not delete your email" });
    }

    await session.endSession();
}));

/* 
This function expects a request body of the following shape
{
    emailId: "encrypted email id",
    subject: "some subject",
    hyperlinks: [{ position: 1, href: "<our request url>" }]
    receivers: ["receiver 1", "receiver 2"],
    emailBody: "some string value",
    createdOn: <date object>
}
*/
emailReadReceiptRouter.post("/complete-email", authMiddleware, checkAccountActivation, asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();
        let emailId = req.body.emailId;
        
        //Now we have the actual _id field's value of the respective email document in the database
        emailId = encryptionObject.decrypt(emailId);

        const filter = {
            _id: new mongodb.ObjectId(emailId)
        };

        const createdOn = new Date(req.body.createdOn);

        const updateDocument = {
            $set: {
                sent: true,
                subject: req.body.subject,
                body: req.body.emailBody,
                createdOn: createdOn,
                textContent: req.body.textContent.slice(0, 200)
            }
        };

        await mongoClient.db("emailReadReceipt").collection("emails").updateOne(filter, updateDocument, { session });
        
        //Now we have to add the receivers in the receivers collection and the hyperlinks in the hyperlinks 
        //collection

        for(let element of req.body.receivers)
        {
            const receiverDocument = {
                emailId: new mongodb.ObjectId(emailId),
                name: element
            };

            await mongoClient.db("emailReadReceipt").collection("receivers").insertOne(receiverDocument, { session });
        }


        for(let element of req.body.hyperlinks)
        {
            const hyperlinkDocument = {
                href: element.href,
                position: element.position,
                emailId: new mongodb.ObjectId(emailId),
                clickCount: 0
            };            

            await mongoClient.db("emailReadReceipt").collection("hyperlinks").insertOne(hyperlinkDocument, { session });
        }

        res.send({ message: "Your email tracking request was accepted" });
        await session.commitTransaction();
    }
    catch(error)
    {
        await session.abortTransaction();
        res.status(400).send({ error: "Could not complete you email tracking request" });
    }

    await session.endSession();
}));

emailReadReceiptRouter.post("/ping", authMiddleware, checkAccountActivation, checkServiceExpiration, asyncHandler(async (req, res, next) => 
{
    res.send({ message: "Server program is reachable" });
}));

emailReadReceiptRouter.get("/image/:imageName", asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();
    

    try
    {
        session.startTransaction();

        //This is in encrypted form which is then in URI encoded form.
        let emailId = req.query.emailId;
        emailId = decodeURIComponent(emailId);
        emailId = encryptionObject.decrypt(emailId);

        //Now emailId is a mongodb ObjectId value in string form.

        const filter = { _id: new mongodb.ObjectId(emailId) };        
        const emailDocument = await mongoClient.db("emailReadReceipt").collection("emails").findOne(filter, { session });

        //We only count image requests for sent emails and yes these requests can arrive even for emails
        //which haven't been sent yet
        if(emailDocument.sent)
        {
            const userDevice = detectUserAgent(req.headers["user-agent"]);
            const viewTime = new Date();
            const viewDocument = {
                userDevice,
                viewTime,
                emailId: new mongodb.ObjectId(emailId)
            };
            await mongoClient.db("emailReadReceipt").collection("emailViews").insertOne(viewDocument, { session });
        }

        res.status(404).send();
        await session.commitTransaction();
    }
    catch(error)
    {
        await session.abortTransaction();
    }

    await session.endSession();
}));

emailReadReceiptRouter.get("/link", asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();
    console.log("Click");
    try
    {
        session.startTransaction();
        const position = Number(req.query.position);
        const actualURL = decodeURIComponent(req.query.actualURL); 
        let emailId = decodeURIComponent(req.query.emailId);
        emailId = encryptionObject.decrypt(emailId);

        //Now we have the database level email id value will be stored in the _id field of some email document
        //in the database
        const filter = {
            position,
            emailId: new mongodb.ObjectId(emailId)
        };

        const updateDocument = {
            $inc: {
                clickCount: 1
            }
        };

        await mongoClient.db("emailReadReceipt").collection("hyperlinks").updateOne(filter, updateDocument, { session });

        // const redirectionHtmlCode = generateRedirectionPage(actualURL);
        // res.send(redirectionHtmlCode);

        res.set("Location", actualURL);
        res.status(302).send();

        await session.commitTransaction();
    }
    catch(error)
    {
        console.log(error);
        await session.abortTransaction();
        res.status(500).send({ error: "Could not get your resource" });
    }

    await session.endSession();
}));


/*
This function is used to generate read status for already sent emails so that the chrome extension can print
the read or unread tick icon accordingly for each sent email

This function expects a request message with the following contents:
{
    "token": <some jwt token string>,
    "date": <string>, //can be a date or time like string value example: 9:33 AM, 12:45 PM, Dec 2, Nov 30 etc
    "textContent": "the first 160 characters of the text content of an email"
}
*/
emailReadReceiptRouter.post("/email-read-status",authMiddleware, checkAccountActivation, checkServiceExpiration, asyncHandler(async (req, res, next) => 
{

}));


module.exports = emailReadReceiptRouter;