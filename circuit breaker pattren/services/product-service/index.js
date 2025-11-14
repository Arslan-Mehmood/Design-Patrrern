const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// In-memory product catalog
let products = {
  'PROD001': {
    id: 'PROD001',
    name: 'Laptop Computer',
    description: 'High-performance laptop for professionals',
    price: 1299.99,
    category: 'Electronics',
    sku: 'LAP-001'
  },
  'PROD002': {
    id: 'PROD002',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse',
    price: 29.99,
    category: 'Electronics',
    sku: 'MOU-002'
  },
  'PROD003': {
    id: 'PROD003',
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical gaming keyboard',
    price: 149.99,
    category: 'Electronics',
    sku: 'KEY-003'
  },
  'PROD004': {
    id: 'PROD004',
    name: 'Monitor 27"',
    description: '4K Ultra HD monitor',
    price: 399.99,
    category: 'Electronics',
    sku: 'MON-004'
  },
  'PROD005': {
    id: 'PROD005',
    name: 'USB-C Hub',
    description: 'Multi-port USB-C hub',
    price: 49.99,
    category: 'Accessories',
    sku: 'HUB-005'
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'product-service' });
});

// Get all products
app.get('/products', (req, res) => {
  res.json({
    success: true,
    data: Object.values(products)
  });
});

// Get product by ID
app.get('/products/:productId', (req, res) => {
  const { productId } = req.params;
  const product = products[productId];

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }

  res.json({
    success: true,
    data: product
  });
});

// Search products
app.get('/products/search/:query', (req, res) => {
  const { query } = req.params;
  const lowerQuery = query.toLowerCase();

  const results = Object.values(products).filter(product =>
    product.name.toLowerCase().includes(lowerQuery) ||
    product.description.toLowerCase().includes(lowerQuery) ||
    product.category.toLowerCase().includes(lowerQuery)
  );

  res.json({
    success: true,
    data: results
  });
});

// Create new product
app.post('/products', (req, res) => {
  const { id, name, description, price, category, sku } = req.body;

  if (!id || !name || !price) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: id, name, price'
    });
  }

  if (products[id]) {
    return res.status(409).json({
      success: false,
      error: 'Product with this ID already exists'
    });
  }

  products[id] = {
    id,
    name,
    description: description || '',
    price: parseFloat(price),
    category: category || 'General',
    sku: sku || `SKU-${id}`
  };

  res.status(201).json({
    success: true,
    data: products[id]
  });
});

// Update product
app.put('/products/:productId', (req, res) => {
  const { productId } = req.params;
  const updates = req.body;

  if (!products[productId]) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }

  products[productId] = {
    ...products[productId],
    ...updates,
    id: productId // Prevent ID change
  };

  res.json({
    success: true,
    data: products[productId]
  });
});

// Delete product
app.delete('/products/:productId', (req, res) => {
  const { productId } = req.params;

  if (!products[productId]) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }

  delete products[productId];

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

app.listen(PORT, () => {
  console.log(`🛍️  Product Service running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});


