const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory inventory data (for demo purposes)
let inventory = [
  { id: '1', name: 'Laptop', quantity: 10, price: 999.99 },
  { id: '2', name: 'Mouse', quantity: 50, price: 29.99 },
  { id: '3', name: 'Keyboard', quantity: 30, price: 79.99 },
  { id: '4', name: 'Monitor', quantity: 20, price: 299.99 }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get all inventory items
app.get('/api/inventory', (req, res) => {
  res.json(inventory);
});

// Get single inventory item
app.get('/api/inventory/:id', (req, res) => {
  const item = inventory.find(i => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json(item);
});

// Create inventory item
app.post('/api/inventory', (req, res) => {
  const { name, quantity, price } = req.body;
  const newItem = {
    id: String(inventory.length + 1),
    name,
    quantity: parseInt(quantity),
    price: parseFloat(price)
  };
  inventory.push(newItem);
  res.status(201).json(newItem);
});

// Update inventory item
app.put('/api/inventory/:id', (req, res) => {
  const index = inventory.findIndex(i => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  inventory[index] = { ...inventory[index], ...req.body, id: req.params.id };
  res.json(inventory[index]);
});

// Delete inventory item
app.delete('/api/inventory/:id', (req, res) => {
  const index = inventory.findIndex(i => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  inventory.splice(index, 1);
  res.status(204).send();
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Inventory API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

