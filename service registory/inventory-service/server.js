const express = require('express');
const cors = require('cors');
const ServiceDiscovery = require('../shared/service-discovery');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;
const SERVICE_NAME = 'INVENTORY-SERVICE';
const INSTANCE_ID = `${SERVICE_NAME}-${Date.now()}`;
const HOST = process.env.HOST || 'localhost';

app.use(cors());
app.use(express.json());

const serviceDiscovery = new ServiceDiscovery();

// In-memory inventory database
let inventory = [
  { productId: 1, quantity: 50, reserved: 0, location: 'Warehouse A' },
  { productId: 2, quantity: 200, reserved: 0, location: 'Warehouse B' },
  { productId: 3, quantity: 75, reserved: 0, location: 'Warehouse A' },
  { productId: 4, quantity: 30, reserved: 0, location: 'Warehouse C' }
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

// Get all inventory
app.get('/api/inventory', async (req, res) => {
  try {
    // Optionally fetch product details from product service
    const inventoryWithProducts = await Promise.all(
      inventory.map(async (item) => {
        try {
          const productUrl = await serviceDiscovery.getServiceInstance('PRODUCT-SERVICE');
          const productResponse = await axios.get(`${productUrl}/api/products/${item.productId}`);
          return {
            ...item,
            product: productResponse.data
          };
        } catch (error) {
          return item; // Return without product details if service unavailable
        }
      })
    );
    res.json(inventoryWithProducts);
  } catch (error) {
    res.json(inventory); // Fallback to inventory only
  }
});

// Get inventory by product ID
app.get('/api/inventory/:productId', (req, res) => {
  const item = inventory.find(i => i.productId === parseInt(req.params.productId));
  if (!item) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }
  res.json(item);
});

// Update inventory quantity
app.put('/api/inventory/:productId/quantity', (req, res) => {
  const { quantity } = req.body;
  const itemIndex = inventory.findIndex(i => i.productId === parseInt(req.params.productId));
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }

  if (quantity < 0) {
    return res.status(400).json({ error: 'Quantity cannot be negative' });
  }

  inventory[itemIndex].quantity = quantity;
  res.json(inventory[itemIndex]);
});

// Reserve inventory
app.post('/api/inventory/:productId/reserve', (req, res) => {
  const { quantity } = req.body;
  const itemIndex = inventory.findIndex(i => i.productId === parseInt(req.params.productId));
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }

  const available = inventory[itemIndex].quantity - inventory[itemIndex].reserved;
  
  if (quantity > available) {
    return res.status(400).json({ 
      error: 'Insufficient inventory',
      available,
      requested: quantity
    });
  }

  inventory[itemIndex].reserved += quantity;
  res.json({
    ...inventory[itemIndex],
    available: inventory[itemIndex].quantity - inventory[itemIndex].reserved
  });
});

// Release reserved inventory
app.post('/api/inventory/:productId/release', (req, res) => {
  const { quantity } = req.body;
  const itemIndex = inventory.findIndex(i => i.productId === parseInt(req.params.productId));
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }

  if (quantity > inventory[itemIndex].reserved) {
    return res.status(400).json({ error: 'Cannot release more than reserved' });
  }

  inventory[itemIndex].reserved -= quantity;
  res.json(inventory[itemIndex]);
});

// Deduct inventory (for completed orders)
app.post('/api/inventory/:productId/deduct', (req, res) => {
  const { quantity } = req.body;
  const itemIndex = inventory.findIndex(i => i.productId === parseInt(req.params.productId));
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }

  if (quantity > inventory[itemIndex].reserved) {
    return res.status(400).json({ error: 'Cannot deduct more than reserved' });
  }

  inventory[itemIndex].quantity -= quantity;
  inventory[itemIndex].reserved -= quantity;
  res.json(inventory[itemIndex]);
});

// Add inventory
app.post('/api/inventory', (req, res) => {
  const { productId, quantity, location } = req.body;
  
  if (!productId || quantity === undefined) {
    return res.status(400).json({ error: 'ProductId and quantity are required' });
  }

  const existingIndex = inventory.findIndex(i => i.productId === productId);
  
  if (existingIndex >= 0) {
    inventory[existingIndex].quantity += quantity;
    res.json(inventory[existingIndex]);
  } else {
    const newItem = {
      productId,
      quantity,
      reserved: 0,
      location: location || 'Warehouse A'
    };
    inventory.push(newItem);
    res.status(201).json(newItem);
  }
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

