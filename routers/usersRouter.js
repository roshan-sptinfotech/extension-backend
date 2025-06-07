const express = require("express");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const mongodb = require("mongodb");

const { client: mongoClient } = require("../database/connection.js");
const asyncHandler = require("../utils/asyncHandler.js");
const userValidator = require("../validators/userValidator.js");
const loginRequestValidator = require("../validators/loginRequestValidator.js");
const createUserToken = require("../utils/createUserToken.js");
const userAlreadyExists = require("../utils/userAlreadyExists.js");
const authMiddleware = require("../middlewares/authentication.js");
const deleteAllUserAssets = require("../utils/deleteAllUserAssets.js");
const generateRandomString = require("../utils/generateRandomString.js");
const Cryptr = require("cryptr");
const encryptionObject = new Cryptr(process.env.BCRYPT_SALT);
const sendEmail = require("../utils/sendEmail.js");
const createVerificationMailBody = require("../utils/createVerificationMailBody.js");
const generateRedirectionPage = require("../utils/generateRedirectionPage.js");
const generateHomepageRedirectionPage = require("../utils/generateHomepageRedirectionPage.js");
const generatePasswordResetEmail = require("../utils/generatePasswordResetEmail.js");
const emailValidator = require("../validators/emailValidator.js");
const userRouter = express.Router();


/*
The request message's body should have the following shape for its json contents
{
    user: {
    
    name: "yashsharma._.21"
    email: "meteor131720@gmail.com",
    contact: "+91 8630070492",
    password: "some password"
    
    }
}
*/
userRouter.post("/create-user", asyncHandler(async (req, res, next) => {

    //Starting a new client session
    const session = mongoClient.startSession();

    try
    {

        session.startTransaction();
        
        const userData = req.body.user;
        const { error } = userValidator.validate(userData);

        if(error)
        {
            await session.abortTransaction();
            return res.status(400).send({ error: error.details[0].message });
        }


        //Checking if a user with the given email already exists or not
        if(await userAlreadyExists(userData.email, session))
        {   
            await session.abortTransaction();
            return res.status(400).send({ error: "A user with the given email already exists" });
        }

        const trialDays = Number(process.env.TRIAL_DURATION_DAYS);
        let serviceExpirationDate = Date.now() + (60*60*24*trialDays) * 1000;
        serviceExpirationDate = new Date(serviceExpirationDate);

        let verificationPassword = generateRandomString(25);

        //Added the basic user fields

        //saved the verification password to the newly created user document object
        let userDocument = {
            ...userData, 
            serviceExpirationDate,
            verified: false,
            verificationPassword //unencrypted form of this string value is stored in the database
        };

        userDocument.email = userDocument.email.toLowerCase();

        const result = await mongoClient.db("emailReadReceipt").collection("users").insertOne(userDocument, { session });
        
        //Please note that the payload of the token will contain an object of this shape:
        // { _id: <string> } and not an ObjectId() value. So convert it back into an ObjectId() value before
        //using it inside queries
        const token = createUserToken(result.insertedId);

        userDocument = await mongoClient.db("emailReadReceipt").collection("users").findOne({ _id: result.insertedId }, { session });
        
        const securePassword = await bcryptjs.hash(userDocument.password, process.env.BCRYPT_SALT);

        const updateDocument = {
            $set: 
            {
                tokens: [token],
                password: securePassword
            }
        };
        
        await mongoClient.db("emailReadReceipt").collection("users").updateOne({ _id: result.insertedId }, updateDocument, { session });


        verificationPassword = encryptionObject.encrypt(verificationPassword);
        const emailBody = createVerificationMailBody(userDocument._id.toString(), verificationPassword);
        await sendEmail(userDocument.email, "Account Verification", emailBody);


        await session.commitTransaction();

        res.status(201).send({
            token,
            message: "User was created"
        });


    }
    catch(error)
    {
        console.error("Error during /create-user:", error); // Log the full error
        if (session.inTransaction()) { // Check if a transaction is active
            await session.abortTransaction();
        }
        res.status(500).send({ error: "The server ran into an error during account creation. Check server logs for details." });
    }

    await session.endSession();

}));


userRouter.get("/verify-account", asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();

        const password = req.query.password;
        let userId = req.query.userId;

        if(!password || !userId)
        {
            res.status(400).send({ error: "Both password and userId query parameters are required" });
            await session.abortTransaction();
            return;
        }

        userId = new mongodb.ObjectId(userId);

        const filter = { _id: userId };
        const userDocument = await mongoClient.db("emailReadReceipt").collection("users").findOne(filter, { session });

        if(!userDocument)
        {
            res.status(404).send({ error: "User not found" });
            await session.abortTransaction();
            return;
        }

        let verificationPassword = decodeURIComponent(password);
        verificationPassword = encryptionObject.decrypt(verificationPassword);


        
        if(!userDocument.verificationPassword)
        {
            const code = generateHomepageRedirectionPage();
            res.send(code);
            await session.abortTransaction();
            return;
        }

        //If some incorrect password was given
        if(userDocument.verificationPassword !== verificationPassword)
        {
            res.status(400).send({ error: "Could not verify your account" });
            await session.abortTransaction();
            return;
        }

        const updateDocument = {
            $set: { verified: true },
            $unset: { verificationPassword: "" }
        };
        await mongoClient.db("emailReadReceipt").collection("users").updateOne({ _id: userDocument._id }, updateDocument, { session });

        const code = generateHomepageRedirectionPage();
        res.send(code);
        
        await session.commitTransaction();

    }
    catch(error)
    {
        res.status(500).send({ error: "Could not verify your account" });
        await session.abortTransaction();
    }

    await session.endSession();
}));
/*
This function expects the following contents in the body part of the request message
{
    "email": "a@gmail.com",
    "password": "some password"
}

*/

userRouter.post("/log-in", asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();
    
    try
    {
        session.startTransaction();

        const loginData = req.body;
        const {error} = loginRequestValidator.validate(loginData);

        if(error)
        {
            await session.abortTransaction();
            return res.status(400).send({ error: error.details[0].message });
        }

        if(!(await userAlreadyExists(loginData.email, session)))
        {
            await session.abortTransaction();
            return res.status(404).send({ error: "User not found" });
        }
            
        let filter = {
            email: loginData.email.toLowerCase()
        };

        const user = await mongoClient.db("emailReadReceipt").collection("users").findOne(filter, { session });

        const isCorrectPassword = await bcryptjs.compare(loginData.password, user.password);
        
        if(!isCorrectPassword)
        {
            await session.abortTransaction();
            return res.status(400).send({ error: "Incorrect password provided" });
        }

        //User can only login from upto five devices
        if(user.tokens.length >= 5)
        {
            await session.abortTransaction();
            return res.status(400).send({ error: "Cannot login from more than 5 devices at a time" });
        }

        const token = createUserToken(user._id);

        user.tokens.push(token);

        await mongoClient.db("emailReadReceipt").collection("users").replaceOne({ _id: user._id }, user, { session });


        await session.commitTransaction();
        res.status(201).send({ token, message: "Logged in successfully" });
    }
    catch(error)
    {
        console.log(error);
        res.status(500).send({ error: "The server ran into an error" });
        await session.abortTransaction();
    }
    
    await session.endSession();
    
}));

userRouter.post("/log-out", authMiddleware, asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();

        const token = req.body.token;

        const user = req.user;
        user.tokens = user.tokens.filter(element => element !== token);
        
        const filter = {
            _id: user._id
        };

        await mongoClient.db("emailReadReceipt").collection("users").replaceOne(filter, user, { session });

        
        await session.commitTransaction();
        res.send({ message: "Logged out from your account" });
    }
    catch(error)
    {
        await session.abortTransaction();
    }

    await session.endSession();
}));

// Log out from all devices, needs a token to work
userRouter.post("/log-out-all", authMiddleware, asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();
        const user = req.user;
        user.tokens = [];
        const filter = {
            _id: user._id
        };

        await mongoClient.db("emailReadReceipt").collection("users").replaceOne(filter, user, { session });

        await session.commitTransaction();
        res.send({ message: "Logged out from all devices" });
    }
    catch(error)
    {
        await session.abortTransaction();
        res.status(500).send({ error: "Could not log out from all devices" });
    }

    await session.endSession();
}));

/*
This function expects the following contents in the body part of the request message
{
    "email": "a@gmail.com",
    "password": "some password"
}

*/
userRouter.post("/logout-all-notoken", asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();

        const logoutData = req.body;
        const {error} = loginRequestValidator.validate(logoutData);

        if(error)
        {
            await session.abortTransaction();
            return res.status(400).send({ error: error.details[0].message });
        }

        if(!(await userAlreadyExists(logoutData.email, session)))
        {
            await session.abortTransaction();
            return res.status(404).send({ error: "User not found" });
        }
            
        let filter = {
            email: logoutData.email.toLowerCase()
        };

        const user = await mongoClient.db("emailReadReceipt").collection("users").findOne(filter, { session });

        const isCorrectPassword = await bcryptjs.compare(logoutData.password, user.password);
        
        if(!isCorrectPassword)
        {
            await session.abortTransaction();
            return res.status(400).send({ error: "Incorrect password provided" });
        }

        filter = { 
            email: logoutData.email.toLowerCase() 
        };

        const updateDocument = {
            $set: { tokens: [] }
        };

        await mongoClient.db("emailReadReceipt").collection("users").updateOne(filter, updateDocument, { session });


        await session.commitTransaction();
        res.send({ message: "Logged out from all devices" });

    }
    catch(error)
    {
        console.log(error);
        await session.abortTransaction();
        res.status(500).send({ error: "Could not log out from all devices" });
    }



    await session.endSession();
}));


//WORK
//We will need to modify this function later when other entity records are connected with a user record
userRouter.delete("/user-delete", authMiddleware, asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();

        const user = req.user;

        
        await deleteAllUserAssets(user._id, session);

        

        filter = {
            _id: user._id
        };

        //Deleting the user document
        await mongoClient.db("emailReadReceipt").collection("users").deleteOne(filter, { session });

        res.send({ message: "Your account was deleted" });


        await session.commitTransaction();
    }
    catch(error)
    {
        await session.abortTransaction();
        res.status(500).send({ error: "Your account could not be deleted" });
    }

    await session.endSession();
}));


/* This function expects an "email" query parameter
*/
userRouter.post("/forgot-password-begin", asyncHandler(async (req, res, next) => 
{
    const email = req.query.email;
    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();

        const {error} = emailValidator.validate(email);

        if(error)
        {
            res.status(400).send({ error: error.details[0].message });
            await session.abortTransaction();
            return;
        }

        let filter = { email };
        let userDocument = await mongoClient.db("emailReadReceipt").collection("users").findOne(filter, { session });

        //No user with the given email was found
        if(!userDocument)
        {
            res.status(404).send({ error: "User not found" });
            await session.abortTransaction();
            return;
        }

        //If the user exists then we send them an email to change the password and also 
        //write the random password reset string in the user document that is stored within the database

        let passwordResetCode = generateRandomString(30);

        const updateDocument = {
            $set: { passwordResetCode }
        };
        
        //Written the passwordResetCode to the user's document
        await mongoClient.db("emailReadReceipt").collection("users").updateOne(filter, updateDocument, { session });

        passwordResetCode = encryptionObject.encrypt(passwordResetCode);
        const htmlCode = generatePasswordResetEmail(userDocument._id.toString(), passwordResetCode);
        await sendEmail(email, "Password Reset Request", htmlCode);
        


        await session.commitTransaction();
        res.send({ message: "Check your email inbox" });
    
    }
    catch(error)
    {
        console.log(error);
        res.status(500).send({ error: "Could not create a reset request" });
        await session.abortTransaction();
    }

    await session.endSession();

}));

userRouter.post("/forgot-password-end", asyncHandler(async (req, res, next) => 
{
    let userId = req.query.userId;
    let passwordResetCode = req.query.password;
    const newPassword = req.body.password;

    if(newPassword.length <= 7)
        return res.status(400).send({ error: "Password must be at least 8 characters long" });

    if(!userId || !passwordResetCode)
        return res.status(400).send({ error: "The userId and password query parameters are required" });

    passwordResetCode = decodeURIComponent(passwordResetCode);
    //Now we have the actual password reset code
    passwordResetCode = encryptionObject.decrypt(passwordResetCode);

    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();

        //Now we have the _id value of the user document object whose password has to be reset

        //First we check if a user with the given id exists or not 
        userId = new mongodb.ObjectId(userId);

        let filter = { _id: userId };
        const userDocument = await mongoClient.db("emailReadReceipt").collection("users").findOne(filter, { session });

        if(!userDocument)
        {
            res.status(404).send({ error: "User not found" });
            await session.abortTransaction();
            return;
        }

        //If a user exists with the given userId

        //If the password has already been reset then there will be no passwordResetCode field on the user document
        if(!userDocument.passwordResetCode)
        {
            res.status(400).send({ error: "Please initiate a password reset request first from the login page" });
            await session.abortTransaction();
            return;
        }

        //If an incorrect password reset code was provided
        if(userDocument.passwordResetCode !== passwordResetCode)
        {
            res.status(400).send({ error: "Incorrect password reset code provided" });
            await session.abortTransaction();
            return;
        }

        //If a correct password reset code was provided then we change the password and remove the passwordResetCode
        //field from the user document object in the database.

        const newPasswordHash = await bcryptjs.hash(newPassword, process.env.BCRYPT_SALT);

        //Writing the new password hash and removing the passwordResetCode field from the database
        await mongoClient.db("emailReadReceipt").collection("users").updateOne(filter, {  
            $set: { password: newPasswordHash },
            $unset: { passwordResetCode: "" }
        }, { session });



        await session.commitTransaction();

        res.send({ message: "Your password was successfully reset" });
    }
    catch(error)
    {
        res.status(500).send({ error: "Could not reset your password" });
        await session.abortTransaction();
    }

    await session.endSession();
}));


userRouter.post("/resend-activation-mail", authMiddleware, asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();

        const user = req.user;

        //If user is already verified then we do not need to resent the email
        if(user.verified)
        {
            res.status(400).send({ error: "Your account is already verified" });
            await session.abortTransaction();
            return;
        }

        let verificationPassword = generateRandomString(25);
        

        //Now we update the user document object's verificationPassword field also

        const filter = { _id: user._id };
        const updateDocument = { 
            $set: { verificationPassword }
         };

        await mongoClient.db("emailReadReceipt").collection("users").updateOne(filter, updateDocument, { session });

        //Now we encrypt the verificationPassword before writing it in the email's anchor element
        verificationPassword = encryptionObject.encrypt(verificationPassword);

        const htmlCode = createVerificationMailBody(user._id.toString(), verificationPassword);
        await sendEmail(user.email, "Account Verification", htmlCode); 

        await session.commitTransaction();
        res.send({ message: "The account activation mail has been resent" });
    }
    catch(error)
    {
        res.status(500).send({ error: "Could not resend activation mail" });
        await session.abortTransaction();
    }


    await session.endSession();
}));

/* 
    This function expects a request message with the at least the following field in its body 
    {
        "token": <some jwt token string>
    } 
*/

userRouter.patch("/subscribe", authMiddleware, asyncHandler(async (req, res, next) => 
{
    const session = mongoClient.startSession();

    try
    {
        session.startTransaction();
        // You may write the payment processing related code here
        // Feel free to use the utils/updateServiceExpiration.js file's code to update the "serviceExpirationDate"
        // field of the respective user's document in the database 

        await session.commitTransaction();
    }
    catch(error)
    {
        await session.abortTransaction();
        res.status(500).send({ error: "Could not complete the subscription request" });
    }

    await session.endSession();
}));

userRouter.post("/user", authMiddleware, asyncHandler(async (req, res, next) => 
{
    const safeUserData = { 
        name: req.user.name,
        email: req.user.email,
        _id: req.user._id 
    };

    res.send(safeUserData);
}));

module.exports = userRouter;