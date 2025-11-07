const express = require('express');
const cors = require('cors');
const ServiceDiscovery = require('../shared/service-discovery');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = 'API-GATEWAY';
const INSTANCE_ID = `${SERVICE_NAME}-${Date.now()}`;
const HOST = process.env.HOST || 'localhost';

app.use(cors());
app.use(express.json());

const serviceDiscovery = new ServiceDiscovery();

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

// Service registry dashboard
app.get('/registry', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:8761/eureka/v2/apps');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch registry data' });
  }
});

// Helper function to proxy requests
async function proxyRequest(serviceName, req, res) {
  
  try {
    const serviceUrl = await serviceDiscovery.getServiceInstance(serviceName);
    console.log(serviceUrl);
    const targetUrl = `${serviceUrl}${req.path}`;
    console.log(targetUrl);
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: `${serviceName} unavailable`, details: error.message };
    res.status(status).json(message);
  }
}

// Product Service Routes
app.all('/api/products*', async (req, res) => {
  console.log('PRODUCT-SERVICE');
  await proxyRequest('PRODUCT-SERVICE', req, res);
});

// Inventory Service Routes
app.all('/api/inventory*', async (req, res) => {
  await proxyRequest('INVENTORY-SERVICE', req, res);
});

// Order Service Routes
app.all('/api/orders*', async (req, res) => {
  await proxyRequest('ORDER-SERVICE', req, res);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ${SERVICE_NAME} running on port ${PORT}`);
  console.log(`📍 Gateway URL: http://localhost:${PORT}`);
  console.log(`📍 Registry Dashboard: http://localhost:${PORT}/registry`);
});

