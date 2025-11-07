const express = require('express');
const cors = require('cors');
const ServiceDiscovery = require('../shared/service-discovery');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3003;
const SERVICE_NAME = 'ORDER-SERVICE';
const INSTANCE_ID = `${SERVICE_NAME}-${Date.now()}`;
const HOST = process.env.HOST || 'localhost';

app.use(cors());
app.use(express.json());

const serviceDiscovery = new ServiceDiscovery();

// In-memory orders database
let orders = [];
let orderIdCounter = 1;

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

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    // Enrich orders with product and inventory details
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const enrichedItems = await Promise.all(
          order.items.map(async (item) => {
            try {
              const productUrl = await serviceDiscovery.getServiceInstance('PRODUCT-SERVICE');
              const productResponse = await axios.get(`${productUrl}/api/products/${item.productId}`);
              return {
                ...item,
                product: productResponse.data
              };
            } catch (error) {
              return item;
            }
          })
        );
        return { ...order, items: enrichedItems };
      })
    );
    res.json(enrichedOrders);
  } catch (error) {
    res.json(orders);
  }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id));
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Enrich with product details
  try {
    const enrichedItems = await Promise.all(
      order.items.map(async (item) => {
        try {
          const productUrl = await serviceDiscovery.getServiceInstance('PRODUCT-SERVICE');
          const productResponse = await axios.get(`${productUrl}/api/products/${item.productId}`);
          return {
            ...item,
            product: productResponse.data
          };
        } catch (error) {
          return item;
        }
      })
    );
    res.json({ ...order, items: enrichedItems });
  } catch (error) {
    res.json(order);
  }
});

// Create order
app.post('/api/orders', async (req, res) => {
  const { customerId, items } = req.body;

  if (!customerId || !items || items.length === 0) {
    return res.status(400).json({ error: 'CustomerId and items are required' });
  }

  try {
    // Validate products and check inventory
    const inventoryUrl = await serviceDiscovery.getServiceInstance('INVENTORY-SERVICE');
    const productUrl = await serviceDiscovery.getServiceInstance('PRODUCT-SERVICE');

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      // Get product details
      const productResponse = await axios.get(`${productUrl}/api/products/${item.productId}`);
      const product = productResponse.data;

      // Check inventory
      const inventoryResponse = await axios.get(`${inventoryUrl}/api/inventory/${item.productId}`);
      const inventory = inventoryResponse.data;

      const available = inventory.quantity - inventory.reserved;
      if (item.quantity > available) {
        return res.status(400).json({
          error: `Insufficient inventory for product ${product.name}`,
          productId: item.productId,
          available,
          requested: item.quantity
        });
      }

      // Reserve inventory
      await axios.post(`${inventoryUrl}/api/inventory/${item.productId}/reserve`, {
        quantity: item.quantity
      });

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        subtotal: product.price * item.quantity
      });

      totalAmount += product.price * item.quantity;
    }

    // Create order
    const newOrder = {
      id: orderIdCounter++,
      customerId,
      items: validatedItems,
      totalAmount,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    orders.push(newOrder);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error.message);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// Update order status
app.put('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const orderIndex = orders.findIndex(o => o.id === parseInt(req.params.id));

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const order = orders[orderIndex];
  const oldStatus = order.status;

  orders[orderIndex].status = status;
  orders[orderIndex].updatedAt = new Date().toISOString();

  // If order is cancelled, release reserved inventory
  if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
    try {
      const inventoryUrl = await serviceDiscovery.getServiceInstance('INVENTORY-SERVICE');
      for (const item of order.items) {
        await axios.post(`${inventoryUrl}/api/inventory/${item.productId}/release`, {
          quantity: item.quantity
        });
      }
    } catch (error) {
      console.error('Error releasing inventory:', error.message);
    }
  }

  // If order is confirmed, deduct inventory
  if (status === 'CONFIRMED' && oldStatus === 'PENDING') {
    try {
      const inventoryUrl = await serviceDiscovery.getServiceInstance('INVENTORY-SERVICE');
      for (const item of order.items) {
        await axios.post(`${inventoryUrl}/api/inventory/${item.productId}/deduct`, {
          quantity: item.quantity
        });
      }
    } catch (error) {
      console.error('Error deducting inventory:', error.message);
    }
  }

  res.json(orders[orderIndex]);
});

// Get orders by customer
app.get('/api/orders/customer/:customerId', (req, res) => {
  const customerOrders = orders.filter(o => o.customerId === req.params.customerId);
  res.json(customerOrders);
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

