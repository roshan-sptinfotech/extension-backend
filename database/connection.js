const mongodb = require("mongodb");
const serverApiVersion = mongodb.ServerApiVersion;

const connectionURL = process.env.MONGODB_SERVER_URL;

const clientOptions = {
    serverApi: 
    {
        version: serverApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
};

const mongoClient = new mongodb.MongoClient(connectionURL, clientOptions);

module.exports = mongoClient;