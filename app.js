const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const bodyParser = require('body-parser');
const stripe = require('stripe')('sk_test_51OMr3dBvaPoSPFo4uCjvVmg5yOK3G43xLtybLiZB2H40yWnKrafMtGhzFeSPQYcc86vvbWfYw6FsD9wcWiuN9O1W00UZKemhrC');

dotenv.config();
const app = express();
const userRouter = require("./routers/usersRouter.js");
const emailReadReceiptRouter = require("./routers/emailReadReceiptRouter.js");
const viewingRouter = require("./routers/viewingRouter.js");
const paymentRouter = require("./routers/paymentRouter.js");
const { connectDB } = require("./database/connection.js");
const PORT = process.env.PORT || 9000;
const publicPath = path.join(__dirname, "public");

app.use(cors());
app.use(express.json());
app.use(express.static(publicPath));
app.use(bodyParser.json()); // For parsing application/json

// Stripe webhook secret and active subscriptions
const webhookSecret = 'whsec_5f905ff478b2aaca50d16e4c5d42e8370a14141f00963b5bbb6c65b76590781c';
const activeSubscriptions = {};

app.get('/', (req, res) => {
    res.send('Welcome to the Email Extension API!');
});

app.use(userRouter);
app.use(emailReadReceiptRouter);
app.use(viewingRouter);
app.use(paymentRouter);

// Stripe Routes from server.js
app.post('/create-checkout-session', async (req, res) => {
    const { planName, amount, autoDebit, userId } = req.body;

    if (!planName || !amount || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        if (autoDebit) {
            const product = await stripe.products.create({ name: planName });
            const price = await stripe.prices.create({
                unit_amount: amount,
                currency: 'usd',
                recurring: { interval: 'month' },
                product: product.id,
            });

            const testClock = await stripe.testHelpers.testClocks.create({
                frozen_time: Math.floor(Date.now() / 1000)
            });
            
            const customer = await stripe.customers.create({
                metadata: { userId },
                test_clock: testClock.id, 
            });
            
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'subscription',
                customer: customer.id,
                line_items: [{ price: price.id, quantity: 1 }],
                success_url: 'https://extension-backend-9ti9.onrender.com/success', // Adjusted port if necessary
                cancel_url: 'https://extension-backend-9ti9.onrender.com/cancel',   // Adjusted port if necessary
                metadata: { userId },
            });
            res.json({ id: session.id });
        } else {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: { name: planName },
                        unit_amount: amount,
                    },
                    quantity: 1,
                }],
                success_url: `http://localhost:${PORT}/success`,
                cancel_url: `http://localhost:${PORT}/cancel`,
            });
            res.json({ id: session.id });
        }
    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error(`⚠️ Webhook Signature Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`🔍 Webhook Event Type: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        if (session.mode === 'subscription') {
            const userId = session.metadata?.userId;
            const subscriptionId = session.subscription;
            if (userId && subscriptionId) {
                activeSubscriptions[userId] = {
                    subscriptionId,
                    planName: session.planName || "starter", 
                    amount: session.amount_total,
                };
                console.log(`✅ Subscription Stored for ${userId}:`, activeSubscriptions[userId]);
            }
        }
    }

    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata.userId;
        console.log(`✅ Payment succeeded for user ${userId}`);
    }

    if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata.userId;
        console.log(`❌ Payment failed for user ${userId}`);
    }
    res.json({ received: true });
});

app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

app.get('/cancel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cancel.html'));
});


async function startServer() {
    await connectDB(); // Connect to DB before starting the server
    app.listen(PORT, () => console.log(`Server program is running on port ${PORT}`));
}

startServer();


/* 
(Every time)
./mongodb/bin/mongod --dbpath "./mongodb-data-1" --logpath "./mongodb-data-1/mongo.log" --port 7000 --replSet myReplicaSet --fork

./mongodb/bin/mongod --dbpath "./mongodb-data-2" --logpath "./mongodb-data-2/mongo.log" --port 8000 --replSet myReplicaSet --fork

(Only first time)
mongosh --port 7000

rs.initiate();
rs.add("localhost:8000");


*/
// const Cryptr = require("cryptr");
// const encryptionObject = new Cryptr(process.env.BCRYPT_SALT);
// const a = encryptionObject.encrypt("67448ace5f8b6a0b927254a2");
// console.log(a.length);

// const b = encryptionObject.decrypt(a);
// console.log(b);
