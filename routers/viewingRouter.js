const express = require("express");
const mongodb = require("mongodb");
const viewingRouter = express.Router();

const authMiddleware = require("../middlewares/authentication.js");
const checkServiceExpiration = require("../middlewares/checkServiceExpiration.js");
const asyncHandler = require("../utils/asyncHandler.js");
const mongoClient = require("../database/connection.js");
const getEmailPage = require("../utils/getEmailPage.js");
const getEmailViewPage = require("../utils/getEmailViewPage.js");
const getHyperlinkPage = require("../utils/getHyperlinkPage.js");
const checkAccountActivation = require("../middlewares/checkAccountActivation.js");
const PAGE_SIZE = process.env.PAGE_SIZE;

viewingRouter.post("/user/emails", authMiddleware, checkAccountActivation, checkServiceExpiration, asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();

        const user = req.user;
        const page = Number(req.query.page);
        const options = { session };

        
        if(!page || Number.isNaN(page))
        {
            res.status(400).send({ error: "The page query parameter is a required field and it must be a number" });
            await session.abortTransaction();
            return;
        }
        

        else 
        {

            options.skip = (page-1) * PAGE_SIZE;
            options.limit = Number(PAGE_SIZE);
            // console.log(options.skip, options.limit);

        }


        const filter = { owner: user._id, sent: true };
        // const emails = await mongoClient.db("emailReadReceipt").collection("emails").find(filter, options).toArray();
        const emails = await getEmailPage(user._id, page, Number(PAGE_SIZE), session);
        const responseData = [];

        for(let email of emails)
        {
            const responseEmail = { _id: email._id, subject: email.subject, textContent: email.textContent };
            responseEmail.sentOn = email.createdOn; // set the sentOn field
            responseEmail.status = 0; // set the status field to 0 reads by default

            const filter = { emailId: email._id };
            const receivers = await mongoClient.db("emailReadReceipt").collection("receivers").find(filter, { session }).toArray();
            responseEmail.recipients = receivers.map(element => element.name); // set the recipients field

            const pipelineArray = [
                {
                    $match: { emailId: email._id }
                },
                { 
                    $group: 
                    {
                        _id: { emailId: email._id },
                        count: { $sum: 1 }
                    }
                }
            ];
            const aggregationResult = await mongoClient.db("emailReadReceipt").collection("emailViews").aggregate(pipelineArray, { session }).toArray();
            
            if(aggregationResult.length >= 1)
            {
                const count = aggregationResult[0].count;
                responseEmail.status = count;
            }

            responseData.push(responseEmail); // set the final count of the status field

        }

        const totalEmails = (await mongoClient.db("emailReadReceipt").collection("emails").find(filter, { session }).toArray()).length;

        res.send({ emails: responseData, totalEmails });

        await session.commitTransaction();
    }
    catch(error)
    {
        console.log(error);
        res.status(500).send({ error: "Could not fetch email data" });
        await session.abortTransaction();
    }

    await session.endSession();
}));


viewingRouter.post("/user/links", authMiddleware, checkAccountActivation, checkServiceExpiration, asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();
    
    try
    {
        session.startTransaction();
    
        const user = req.user;
        const page = Number(req.query.page);
        const options = { session };
    
            
        if(!page || Number.isNaN(page))
        {
            res.status(400).send({ error: "The page query parameter is a required field and it must be a number" });
            await session.abortTransaction();
            return;
        }
            
    
        else 
        {
    
            options.skip = (page-1) * PAGE_SIZE;
            options.limit = Number(PAGE_SIZE);
            // console.log(options.skip, options.limit);
    
        }
    
    
        const filter = { owner: user._id, sent: true };
        // const emails = await mongoClient.db("emailReadReceipt").collection("emails").find(filter, options).toArray();
        const emails = await getEmailPage(user._id, page, Number(PAGE_SIZE), session);

        const responseData = [];
    
        for(let email of emails)
        {
            const responseEmail = { _id: email._id, subject: email.subject, textContent: email.textContent };
            responseEmail.sentOn = email.createdOn; // set the sentOn field
            responseEmail.status = 0; // set the status field to 0 reads by default, this represents the number of links in a mail
    
            const filter = { emailId: email._id };
            const receivers = await mongoClient.db("emailReadReceipt").collection("receivers").find(filter, { session }).toArray();
            responseEmail.recipients = receivers.map(element => element.name); // set the recipients field
    
            const pipelineArray = [
                {
                    $match: { emailId: email._id }
                },
                { 
                    $group: 
                    {
                        _id: { emailId: email._id },
                        count: { $sum: 1 }
                    }
                }
            ];
            const aggregationResult = await mongoClient.db("emailReadReceipt").collection("hyperlinks").aggregate(pipelineArray, { session }).toArray();
                
            if(aggregationResult.length >= 1)
            {
                const count = aggregationResult[0].count;
                responseEmail.status = count; // if any hyperlinks were found for this email then we set this field
            }
    
            responseData.push(responseEmail); // set the final count of the status field
    
        }
    
        const totalEmails = (await mongoClient.db("emailReadReceipt").collection("emails").find(filter, { session }).toArray()).length;
    
        res.send({ emails: responseData, totalEmails });
    
        await session.commitTransaction();
    }
    catch(error)
    {
        console.log(error);
        res.status(500).send({ error: "Could not fetch email data" });
        await session.abortTransaction();
    }
    
    await session.endSession();
}));


viewingRouter.post("/email/:emailId", authMiddleware, checkAccountActivation, checkServiceExpiration, asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();

        const filter = {
            _id: new mongodb.ObjectId(req.params.emailId),
            owner: req.user._id
        };


        const email = await mongoClient.db("emailReadReceipt").collection("emails").findOne(filter, { session });

        if(!email)
        {
            res.status(404).send({ error: "Could not find email" });
            await session.abortTransaction();
            return;
        }

        res.send(email);

        await session.commitTransaction();
    }
    catch(error)
    {
        res.status(500).send({ error: "Could not fetch email data" });
        await session.abortTransaction();
    }

    await session.endSession();
}));


/*
{
    token: "some jwt token string"
}
*/
viewingRouter.post("/email-views/:emailId", authMiddleware, checkAccountActivation, checkServiceExpiration, asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();

        const page = Number(req.query.page);
            
        if(!page || Number.isNaN(page))
        {
            res.status(400).send({ error: "The page query parameter is a required field and it must be a number" });
            await session.abortTransaction();
            return;
        }

        const user = req.user;
        const emailId = new mongodb.ObjectId(req.params.emailId);

        //First we fetch the email document if it belongs to this user

        const responseData = {};
        let filter = {
            _id: emailId,
            owner: user._id
        };
        const emailDocument = await mongoClient.db("emailReadReceipt").collection("emails").findOne(filter, { session });

        if(!emailDocument)
        {
            res.status(404).send({ error: "Could not find email" });
            await session.abortTransaction();
            return;
        }


        //Added the emailDocument in the response data object
        responseData.emailDocument = emailDocument;

        //Now we need the email receivers

        filter = { emailId };
        let receiverDocuments = await mongoClient.db("emailReadReceipt").collection("receivers").find(filter, { session }).toArray();
        
        receiverDocuments = receiverDocuments.map(element => element.name);

        //Added the receivers in the response data object
        responseData.recipients = receiverDocuments;

        const pipelineArray = [
            {
                $match: { emailId }
            },
            { 
                $group: 
                {
                    _id: { emailId },
                    count: { $sum: 1 }
                }
            }
        ];


        //Now we find the view status of the email
        responseData.status = 0;
        const aggregationResult = await mongoClient.db("emailReadReceipt").collection("emailViews").aggregate(pipelineArray, { session }).toArray();
        
        if(aggregationResult.length >= 1)
        {
            const count = aggregationResult[0].count;
            responseData.status = count;
        }

        //Now we will fetch a single page of the email view documents
        filter = {
            emailId
        };


        const emailViews = await getEmailViewPage(page, Number(PAGE_SIZE), emailId, session);

        responseData.emailViews = emailViews;

        res.send(responseData);
        await session.commitTransaction();
    }
    catch(error)
    {
        console.log(error);
        res.status(500).send({ error: "Could not fetch email view data" });
        await session.abortTransaction();

    }

    await session.endSession();
}));

viewingRouter.post("/link-clicks/:emailId", authMiddleware, checkAccountActivation, checkServiceExpiration, asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();
    
    try
    {
        session.startTransaction();
    
        const page = Number(req.query.page);
                
        if(!page || Number.isNaN(page))
        {
            res.status(400).send({ error: "The page query parameter is a required field and it must be a number" });
            await session.abortTransaction();
            return;
        }
    
        const user = req.user;
        const emailId = new mongodb.ObjectId(req.params.emailId);
    
        //First we fetch the email document if it belongs to this user
    
        const responseData = {};
        let filter = {
            _id: emailId,
            owner: user._id
        };
        
        const emailDocument = await mongoClient.db("emailReadReceipt").collection("emails").findOne(filter, { session });
    
        if(!emailDocument)
        {
            res.status(404).send({ error: "Could not find email" });
            await session.abortTransaction();
            return;
        }
    
    
        //Added the emailDocument in the response data object
        responseData.emailDocument = emailDocument;
    
        //Now we need the email receivers
    
        filter = { emailId };
        let receiverDocuments = await mongoClient.db("emailReadReceipt").collection("receivers").find(filter, { session }).toArray();
            
        receiverDocuments = receiverDocuments.map(element => element.name);
    
        //Added the receivers in the response data object
        responseData.recipients = receiverDocuments;
    
        const pipelineArray = [
            {
                $match: { emailId }
            },
            { 
                $group: 
                {
                    _id: { emailId },
                    count: { $sum: 1 }
                }
            }
        ];
    
    
        //Now we find the view status of the email
        responseData.status = 0;
        const aggregationResult = await mongoClient.db("emailReadReceipt").collection("hyperlinks").aggregate(pipelineArray, { session }).toArray();
            
        if(aggregationResult.length >= 1)
        {
            const count = aggregationResult[0].count;
            //We have added the hyperlink click status to the response data object
            responseData.status = count;
        }
    
        //Now we will fetch a single page of the hyperlink documents
        filter = {
            emailId
        };
    
    
        const hyperlinks = await getHyperlinkPage(page, Number(PAGE_SIZE), emailId, session);
    
        responseData.hyperlinks = hyperlinks;
    
        res.send(responseData);
        await session.commitTransaction();
    }
    catch(error)
    {
        console.log(error);
        res.status(500).send({ error: "Could not fetch hyperlink data" });
        await session.abortTransaction();
    
    }
    
    await session.endSession();
}));

module.exports = viewingRouter;