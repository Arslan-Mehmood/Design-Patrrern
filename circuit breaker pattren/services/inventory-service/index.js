const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory inventory storage
let inventory = {
  'PROD001': { productId: 'PROD001', quantity: 100, reserved: 0 },
  'PROD002': { productId: 'PROD002', quantity: 50, reserved: 0 },
  'PROD003': { productId: 'PROD003', quantity: 200, reserved: 0 },
  'PROD004': { productId: 'PROD004', quantity: 75, reserved: 0 },
  'PROD005': { productId: 'PROD005', quantity: 30, reserved: 0 }
};

// Simulate occasional failures (for testing circuit breaker)
let requestCount = 0;
const FAILURE_RATE = 0.3; // 30% failure rate for testing

// Middleware to simulate failures
app.use((req, res, next) => {
  requestCount++;
  // Simulate service failure for testing circuit breaker
  if (req.query.simulateFailure === 'true' || (requestCount % 10 >= 7 && requestCount % 10 <= 9)) {
    return res.status(500).json({ 
      error: 'Inventory service temporarily unavailable',
      message: 'Simulated service failure'
    });
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'inventory-service' });
});

// Get all inventory
app.get('/inventory', (req, res) => {
  res.json({
    success: true,
    data: Object.values(inventory)
  });
});

// Get inventory for a specific product
app.get('/inventory/:productId', (req, res) => {
  const { productId } = req.params;
  const item = inventory[productId];

  if (!item) {
    return res.status(404).json({
      success: false,
      error: 'Product not found in inventory'
    });
  }

  res.json({
    success: true,
    data: item
  });
});

// Check availability
app.get('/inventory/:productId/availability', (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.query;
  const item = inventory[productId];

  if (!item) {
    return res.status(404).json({
      success: false,
      error: 'Product not found in inventory'
    });
  }

  const available = item.quantity - item.reserved;
  const requestedQty = parseInt(quantity) || 1;
  const isAvailable = available >= requestedQty;

  res.json({
    success: true,
    data: {
      productId,
      available,
      requested: requestedQty,
      isAvailable
    }
  });
});

// Reserve inventory
app.post('/inventory/:productId/reserve', (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid quantity'
    });
  }

  const item = inventory[productId];

  if (!item) {
    return res.status(404).json({
      success: false,
      error: 'Product not found in inventory'
    });
  }

  const available = item.quantity - item.reserved;

  if (available < quantity) {
    return res.status(400).json({
      success: false,
      error: 'Insufficient inventory',
      available,
      requested: quantity
    });
  }

  item.reserved += quantity;

  res.json({
    success: true,
    data: {
      productId,
      reserved: quantity,
      available: item.quantity - item.reserved,
      totalReserved: item.reserved
    }
  });
});

// Release reserved inventory
app.post('/inventory/:productId/release', (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid quantity'
    });
  }

  const item = inventory[productId];

  if (!item) {
    return res.status(404).json({
      success: false,
      error: 'Product not found in inventory'
    });
  }

  if (item.reserved < quantity) {
    return res.status(400).json({
      success: false,
      error: 'Cannot release more than reserved',
      reserved: item.reserved,
      requested: quantity
    });
  }

  item.reserved -= quantity;

  res.json({
    success: true,
    data: {
      productId,
      released: quantity,
      available: item.quantity - item.reserved,
      totalReserved: item.reserved
    }
  });
});

// Update inventory (add stock)
app.put('/inventory/:productId', (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid quantity'
    });
  }

  if (!inventory[productId]) {
    inventory[productId] = {
      productId,
      quantity: 0,
      reserved: 0
    };
  }

  inventory[productId].quantity += quantity;

  res.json({
    success: true,
    data: inventory[productId]
  });
});

app.listen(PORT, () => {
  console.log(`📦 Inventory Service running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});


