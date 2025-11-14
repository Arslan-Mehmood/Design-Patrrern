const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Service URLs
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

// Proxy function
async function proxyRequest(serviceUrl, req, res) {
  try {
    const url = `${serviceUrl}${req.path}`;
    const config = {
      method: req.method,
      url,
      headers: { ...req.headers, host: undefined },
      data: req.body,
      timeout: 10000
    };

    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        error: 'Service unavailable',
        message: 'The requested service is not available'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}

// Health check
app.get('/health', async (req, res) => {
  const services = {
    gateway: 'healthy',
    inventory: 'unknown',
    product: 'unknown',
    order: 'unknown'
  };

  try {
    const inventoryHealth = await axios.get(`${INVENTORY_SERVICE_URL}/health`, { timeout: 2000 });
    services.inventory = inventoryHealth.data.status;
  } catch (error) {
    services.inventory = 'unhealthy';
  }

  try {
    const productHealth = await axios.get(`${PRODUCT_SERVICE_URL}/health`, { timeout: 2000 });
    services.product = productHealth.data.status;
  } catch (error) {
    services.product = 'unhealthy';
  }

  try {
    const orderHealth = await axios.get(`${ORDER_SERVICE_URL}/health`, { timeout: 2000 });
    services.order = orderHealth.data.status;
  } catch (error) {
    services.order = 'unhealthy';
  }

  res.json({
    status: 'healthy',
    service: 'api-gateway',
    services
  });
});

// Inventory Service Routes
app.all('/inventory/*', (req, res) => {
  proxyRequest(INVENTORY_SERVICE_URL, req, res);
});

// Product Service Routes
app.all('/products/*', (req, res) => {
  proxyRequest(PRODUCT_SERVICE_URL, req, res);
});

// Order Service Routes
app.all('/orders/*', (req, res) => {
  proxyRequest(ORDER_SERVICE_URL, req, res);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Inventory Management API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      inventory: '/inventory/*',
      products: '/products/*',
      orders: '/orders/*'
    },
    services: {
      inventory: INVENTORY_SERVICE_URL,
      product: PRODUCT_SERVICE_URL,
      order: ORDER_SERVICE_URL
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚪 API Gateway running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Inventory: http://localhost:${PORT}/inventory/*`);
  console.log(`   Products: http://localhost:${PORT}/products/*`);
  console.log(`   Orders: http://localhost:${PORT}/orders/*`);
});

