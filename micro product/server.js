const express = require('express');
const { sequelize, Product } = require('./models');
const amqp = require('amqplib');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const RABBITMQ_URL = 'amqp://localhost'; // RabbitMQ URL
const STOCK_QUEUE_NAME = 'stock_queue';

let channel;

// Connect to RabbitMQ
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(STOCK_QUEUE_NAME);

    channel.consume(STOCK_QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        const { productId, quantity, responseQueue } = JSON.parse(msg.content.toString());
        const correlationId = msg.properties.correlationId;

        try {
          const product = await Product.findByPk(productId);

          if (product && product.stock >= quantity) {
            // Stock is available, proceed to update stock
            product.stock -= quantity;
            await product.save();

            // Send response back to Order service
            channel.sendToQueue(responseQueue, Buffer.from(JSON.stringify({ stockAvailable: true })), {
              correlationId
            });
          } else {
            // Stock is not available
            channel.sendToQueue(responseQueue, Buffer.from(JSON.stringify({ stockAvailable: false })), {
              correlationId
            });
          }
        } catch (error) {
          console.error('Error processing message:', error);
          channel.sendToQueue(responseQueue, Buffer.from(JSON.stringify({ stockAvailable: false })), {
            correlationId
          });
        } finally {
          channel.ack(msg); // Acknowledge the message
        }
      }
    });
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    process.exit(1); // Exit the process if RabbitMQ connection fails
  }
}
connectRabbitMQ().catch(console.error);

// Create a new product
app.post('/products', async (req, res) => {
  const { name, stock } = req.body;
  try {
    const product = await Product.create({ name, stock });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read all products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read a single product
app.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a product
app.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock } = req.body;
  try {
    const product = await Product.findByPk(id);
    if (product) {
      product.name = name !== undefined ? name : product.name;
      product.description = description !== undefined ? description : product.description;
      product.price = price !== undefined ? price : product.price;
      product.stock = stock !== undefined ? stock : product.stock;
      await product.save();
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a product
app.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id);
    if (product) {
      await product.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, async () => {
  console.log('Products service running on port 3001');
  await sequelize.sync();
});
