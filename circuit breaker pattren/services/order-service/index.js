const express = require('express');
const cors = require('cors');
const InventoryServiceClient = require('./clients/InventoryServiceClient');
const ProductServiceClient = require('./clients/ProductServiceClient');
const ServiceClient = require('./clients/ServiceClient');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Service URLs
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

// Initialize service clients (they handle circuit breaker logic internally)
const inventoryClient = new InventoryServiceClient(INVENTORY_SERVICE_URL);
const productClient = new ProductServiceClient(PRODUCT_SERVICE_URL);

// In-memory order storage
let orders = {};
let orderCounter = 1;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'order-service',
    circuitBreakers: {
      inventory: inventoryClient.getState(),
      product: productClient.getState()
    }
  });
});

// Get circuit breaker status
app.get('/circuit-breaker/status', (req, res) => {
  res.json({
    inventory: inventoryClient.getState(),
    product: productClient.getState()
  });
});

// Reset circuit breakers (admin endpoint)
app.post('/circuit-breaker/reset', (req, res) => {
  inventoryClient.reset();
  productClient.reset();
  res.json({
    success: true,
    message: 'Circuit breakers reset'
  });
});

// Create order
app.post('/orders', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order items'
      });
    }

    // Validate products and check inventory
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const { productId, quantity } = item;

      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid item: ${JSON.stringify(item)}`
        });
      }

      try {
        // Get product details
        const productResponse = await productClient.getProduct(productId);
        const product = productResponse.data.data;

        // Check inventory availability
        const inventoryResponse = await inventoryClient.checkAvailability(productId, quantity);
        const availability = inventoryResponse.data.data;

        if (!availability.isAvailable) {
          return res.status(400).json({
            success: false,
            error: `Insufficient inventory for product ${productId}`,
            available: availability.available,
            requested: quantity
          });
        }

        orderItems.push({
          productId,
          quantity,
          price: product.price,
          subtotal: product.price * quantity
        });

        totalAmount += product.price * quantity;
      } catch (error) {
        // Check if error is from circuit breaker
        if (ServiceClient.isCircuitBreakerError(error)) {
          return res.status(503).json({
            success: false,
            error: 'Service temporarily unavailable (Circuit Breaker OPEN)',
            service: error.serviceName || 'unknown'
          });
        }

        if (error.response?.status === 404) {
          return res.status(404).json({
            success: false,
            error: `Product ${productId} not found`
          });
        }

        throw error;
      }
    }

    // Reserve inventory
    for (const item of orderItems) {
      try {
        await inventoryClient.reserve(item.productId, item.quantity);
      } catch (error) {
        // If reservation fails, release already reserved items
        for (const reservedItem of orderItems.slice(0, orderItems.indexOf(item))) {
          try {
            await inventoryClient.release(reservedItem.productId, reservedItem.quantity);
          } catch (releaseError) {
            console.error('Error releasing inventory:', releaseError);
          }
        }

        if (ServiceClient.isCircuitBreakerError(error)) {
          return res.status(503).json({
            success: false,
            error: 'Inventory service unavailable (Circuit Breaker OPEN)'
          });
        }

        throw error;
      }
    }

    // Create order
    const orderId = `ORD${String(orderCounter++).padStart(6, '0')}`;
    const order = {
      id: orderId,
      items: orderItems,
      totalAmount,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    orders[orderId] = order;

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: error.message
    });
  }
});

// Get all orders
app.get('/orders', (req, res) => {
  res.json({
    success: true,
    data: Object.values(orders)
  });
});

// Get order by ID
app.get('/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = orders[orderId];

  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  res.json({
    success: true,
    data: order
  });
});

// Confirm order (release reserved inventory and mark as confirmed)
app.post('/orders/:orderId/confirm', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orders[orderId];

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Order is already ${order.status}`
      });
    }

    // Release reserved inventory (in real scenario, you'd deduct from inventory)
    for (const item of order.items) {
      try {
        await inventoryClient.release(item.productId, item.quantity);
      } catch (error) {
        if (ServiceClient.isCircuitBreakerError(error)) {
          return res.status(503).json({
            success: false,
            error: 'Inventory service unavailable (Circuit Breaker OPEN)'
          });
        }
        console.error(`Error releasing inventory for ${item.productId}:`, error);
      }
    }

    order.status = 'CONFIRMED';
    order.confirmedAt = new Date().toISOString();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm order',
      message: error.message
    });
  }
});

// Cancel order (release reserved inventory)
app.post('/orders/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orders[orderId];

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Order is already cancelled'
      });
    }

    // Release reserved inventory
    for (const item of order.items) {
      try {
        await inventoryClient.release(item.productId, item.quantity);
      } catch (error) {
        if (ServiceClient.isCircuitBreakerError(error)) {
          return res.status(503).json({
            success: false,
            error: 'Inventory service unavailable (Circuit Breaker OPEN)'
          });
        }
        console.error(`Error releasing inventory for ${item.productId}:`, error);
      }
    }

    order.status = 'CANCELLED';
    order.cancelledAt = new Date().toISOString();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🛒 Order Service running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Circuit Breaker Status: http://localhost:${PORT}/circuit-breaker/status`);
});
