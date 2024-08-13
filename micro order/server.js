const express = require('express');
const { sequelize, Order } = require('./models');
const amqp = require('amqplib');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const RABBITMQ_URL = 'amqp://localhost'; // RabbitMQ URL
const ORDER_QUEUE_NAME = 'order_queue';
const STOCK_QUEUE_NAME = 'stock_queue';

let channel;

// Connect to RabbitMQ
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(ORDER_QUEUE_NAME);
    await channel.assertQueue(STOCK_QUEUE_NAME);
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    process.exit(1); // Exit the process if RabbitMQ connection fails
  }
}
connectRabbitMQ().catch(console.error);

// Create a new order
app.post('/orders', async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const correlationId = generateCorrelationId();
    const responseQueue = await channel.assertQueue('', { exclusive: true });

    // Send stock check request
    channel.sendToQueue(STOCK_QUEUE_NAME, Buffer.from(JSON.stringify({ productId, quantity, responseQueue: responseQueue.queue })), {
      correlationId,
      replyTo: responseQueue.queue
    });

    // Wait for the stock check response
    channel.consume(responseQueue.queue, async (msg) => {
      if (msg && msg.properties.correlationId === correlationId) {
        const { stockAvailable } = JSON.parse(msg.content.toString());

        if (stockAvailable) {
          // Create order
          const order = await Order.create({ productId, quantity, status: 'pending' });
          res.status(201).json(order);
          console.log('Order created:', order);
        } else {
          res.status(400).json({ error: 'Insufficient stock available' });
        }
        channel.deleteQueue(responseQueue.queue); // Clean up temporary queue
        channel.ack(msg); // Acknowledge the message
      }
    }, { noAck: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read all orders
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read a single order
app.get('/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByPk(id);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an order
app.put('/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { productId, quantity, status } = req.body;
  try {
    const order = await Order.findByPk(id);
    if (order) {
      order.productId = productId || order.productId;
      order.quantity = quantity || order.quantity;
      order.status = status || order.status;
      await order.save();
      res.json(order);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an order
app.delete('/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByPk(id);
    if (order) {
      await order.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate a unique correlation ID
function generateCorrelationId() {
  return crypto.randomBytes(16).toString('hex');
}

app.listen(3002, async () => {
  console.log('Orders service running on port 3002');
  await sequelize.sync();
});
