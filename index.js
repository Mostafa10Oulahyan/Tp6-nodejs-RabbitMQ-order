const express = require("express");
const amqp = require("amqplib");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const USERNAME = "mostafa";
const PASSWORD = "azer2020";
const HOST = "rabbitmq-mostafa.alwaysdata.net";
const VHOST = "mostafa_rabbitmq";
const RABBIT_URL = `amqp://${USERNAME}:${PASSWORD}@${HOST}/${VHOST}`;
const QUEUE = "order_created";

let channel;

async function initRabbit() {
    const conn = await amqp.connect(RABBIT_URL);
    channel = await conn.createChannel();
    await channel.assertQueue(QUEUE, { durable: true });
    console.log("✅ RabbitMQ OK. Queue ready:", QUEUE);
}

app.post("/orders", async (req, res) => {
    try {
        const { email, total } = req.body;
        const order = {
            orderId: Date.now(),
            email,
            total,
            createdAt: new Date().toISOString(),
        };
        const payload = Buffer.from(JSON.stringify(order));

        // publish message to queue
        channel.sendToQueue(QUEUE, payload, { persistent: true });

        console.log("📦 Order created, message sent to RabbitMQ:", order.orderId);

        res.status(201).json({
            message: "Commande créée. Email envoyé en arrière-plan (RabbitMQ).",
            order,
        });
    } catch (e) {
        console.error("Error creating order:", e);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
app.get("/",(req,res)=>{
    res.send("good job")
})
initRabbit().then(() => {
    app.listen(3000, () => console.log("🚀 orders-api running on http://localhost:3000"));
}).catch((e) => {
    console.error("❌ RabbitMQ init failed:", e.message);
    process.exit(1);
});
