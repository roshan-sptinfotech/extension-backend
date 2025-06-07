
const { MongoClient, ServerApiVersion } = require('mongodb');

// Ensure dotenv is configured in your main server file before this is imported if using .env for MONGODB_SERVER_URL
const uri = "mongodb+srv://sptvivek814:y10iwMvhjm0qGCft@cluster0.quacet5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectDB() {
  try {
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1); // Exit application if DB connection fails
  }
}

// Export the client and the connect function
module.exports = { client, connectDB };
