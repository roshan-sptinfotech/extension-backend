const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const stripe = require('stripe')('sk_test_51OMr3dBvaPoSPFo4uCjvVmg5yOK3G43xLtybLiZB2H40yWnKrafMtGhzFeSPQYcc86vvbWfYw6FsD9wcWiuN9O1W00UZKemhrC');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(bodyParser.json());

const webhookSecret = 'whsec_5f905ff478b2aaca50d16e4c5d42e8370a14141f00963b5bbb6c65b76590781c';

// Store active subscriptions
const activeSubscriptions = {};

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

            console.log(price);

            const testClock = await stripe.testHelpers.testClocks.create({
                frozen_time: Math.floor(Date.now() / 1000)
            });
            
            const customer = await stripe.customers.create({
                metadata: { userId },
                test_clock: testClock.id, // ✅ Link the test clock
            });
            console.log('hi');
            
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'subscription',
                customer: customer.id,
                line_items: [{ price: price.id, quantity: 1 }],
                success_url: 'https://extension-backend-9ti9.onrender.com:9000/success',
                cancel_url: 'https://extension-backend-9ti9.onrender.com:9000/cancel',
                metadata: { userId },
            });

            console.log('subscription session',session);
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
                success_url: 'http://localhost:9000/success',
                cancel_url: 'http://localhost:9000/cancel',
            });

            res.json({ id: session.id });
        }
    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Handle Stripe Webhooks
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

// ✅ Serve Success & Cancel Pages
app.get('/success', (req, res) => {
    res.sendFile(__dirname + '/public/success.html');
});

app.get('/cancel', (req, res) => {
    res.sendFile(__dirname + '/public/cancel.html');
});

// ✅ Start Server
const PORT = 9000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});