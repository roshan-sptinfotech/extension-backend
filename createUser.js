require('dotenv').config({ path: require('path').join(__dirname, './.env') }); // Load .env file from backend directory

const { MongoClient } = require('mongodb');
const bcryptjs = require('bcryptjs');

// --- START: USER CONFIGURATION ---
// !!! IMPORTANT: Replace these placeholders with the desired user details !!!
const userEmail = 'admin@admin.com'; // Replace with desired email
const userName = 'Admin User';          // Replace with desired name
const userPassword = '12345678'; // Replace with a strong password
const userContact = '0000000000';     // Replace with a valid 10-15 digit contact number
const makeAdmin = false; // Set to true if this user should be an admin
// --- END: USER CONFIGURATION ---

const MONGODB_URI = process.env.MONGODB_SERVER_URL || "mongodb+srv://sptvivek814:y10iwMvhjm0qGCft@cluster0.quacet5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const BCRYPT_SALT = process.env.BCRYPT_SALT;
const TRIAL_DURATION_DAYS = parseInt(process.env.TRIAL_DURATION_DAYS || '7', 10);

if (!BCRYPT_SALT) {
    console.error("Error: BCRYPT_SALT is not defined in your .env file.");
    process.exit(1);
}
if (!MONGODB_URI) {
    console.error("Error: MONGODB_SERVER_URL is not defined in your .env file or as a fallback.");
    process.exit(1);
}

function generateSimpleRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function createUserInDB() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');

        const db = client.db('emailReadReceipt'); // Database name
        const usersCollection = db.collection('users'); // Collection name

        const lowercasedEmail = userEmail.toLowerCase();
        const existingUser = await usersCollection.findOne({ email: lowercasedEmail });
        if (existingUser) {
            console.log(`User with email ${userEmail} already exists.`);
            return;
        }

        const hashedPassword = await bcryptjs.hash(userPassword, BCRYPT_SALT);
        
        let serviceExpirationDate = new Date();
        serviceExpirationDate.setDate(serviceExpirationDate.getDate() + TRIAL_DURATION_DAYS);

        const newUserDocument = {
            name: userName,
            email: lowercasedEmail,
            password: hashedPassword,
            contact: userContact,
            serviceExpirationDate,
            verified: false, // You might want to set this to true if creating manually
            verificationPassword: generateSimpleRandomString(25),
            tokens: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (makeAdmin) {
            newUserDocument.isAdmin = true;
            console.log('User will be created as an admin.');
        }

        const result = await usersCollection.insertOne(newUserDocument);
        console.log(`Successfully created user: ${userName} (${userEmail}) with ID: ${result.insertedId}`);

    } catch (err) {
        console.error('Error creating user:', err);
    } finally {
        await client.close();
        console.log('MongoDB connection closed');
    }
}

createUserInDB();
