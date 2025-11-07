const express = require('express');
const cors = require('cors');
const ServiceDiscovery = require('../shared/service-discovery');

const app = express();
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = 'PRODUCT-SERVICE';
const INSTANCE_ID = `${SERVICE_NAME}-${Date.now()}`;
const HOST = process.env.HOST || 'localhost';

app.use(cors());
app.use(express.json());

const serviceDiscovery = new ServiceDiscovery();

// In-memory product database
let products = [
  { id: 1, name: 'Laptop', description: 'Gaming Laptop', price: 999.99, category: 'Electronics' },
  { id: 2, name: 'Mouse', description: 'Wireless Mouse', price: 29.99, category: 'Electronics' },
  { id: 3, name: 'Keyboard', description: 'Mechanical Keyboard', price: 79.99, category: 'Electronics' },
  { id: 4, name: 'Monitor', description: '27 inch 4K Monitor', price: 399.99, category: 'Electronics' }
];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: SERVICE_NAME });
});

// Info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    instanceId: INSTANCE_ID,
    version: '1.0.0'
  });
});

// Get all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Get product by ID
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Create product
app.post('/api/products', (req, res) => {
  const { name, description, price, category } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const newProduct = {
    id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
    name,
    description: description || '',
    price: parseFloat(price),
    category: category || 'General'
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Update product
app.put('/api/products/:id', (req, res) => {
  const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
  
  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { name, description, price, category } = req.body;
  products[productIndex] = {
    ...products[productIndex],
    ...(name && { name }),
    ...(description !== undefined && { description }),
    ...(price !== undefined && { price: parseFloat(price) }),
    ...(category !== undefined && { category })
  };

  res.json(products[productIndex]);
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
  
  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  products.splice(productIndex, 1);
  res.status(204).send();
});

// Start server and register with service registry
async function start() {
  // Register with service registry
  await serviceDiscovery.registerService(SERVICE_NAME, INSTANCE_ID, HOST, PORT);

  // Send heartbeat every 30 seconds
  const heartbeatInterval = setInterval(async () => {
    await serviceDiscovery.renewService(SERVICE_NAME, INSTANCE_ID);
  }, 30000);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    clearInterval(heartbeatInterval);
    await serviceDiscovery.deregisterService(SERVICE_NAME, INSTANCE_ID);
    process.exit(0);
  });

  app.listen(PORT, () => {
    console.log(`🚀 ${SERVICE_NAME} running on port ${PORT}`);
    console.log(`📍 Instance ID: ${INSTANCE_ID}`);
  });
}

start().catch(console.error);

