# Inventory System - Microservices with Service Registry Pattern

A complete inventory management system built with Node.js microservices architecture using the Service Registry pattern for service discovery.

## Architecture

```
┌─────────────┐
│ API Gateway │ (Port 3000)
└──────┬──────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│   Product   │  │  Inventory  │  │    Order    │
│   Service   │  │   Service   │  │   Service   │
│  (Port 3001)│  │ (Port 3002) │  │ (Port 3003) │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                 │                 │
       └─────────────────┴─────────────────┘
                         │
                ┌────────▼────────┐
                │ Service Registry│
                │   (Port 8761)   │
                └─────────────────┘
```

## Services

### 1. Service Registry (Port 8761)
- Central service registry for all microservices
- Handles service registration, discovery, and health checks
- Eureka-compatible API
- Automatic cleanup of expired services

### 2. Product Service (Port 3001)
- Manages product catalog
- CRUD operations for products
- Endpoints: `/api/products`

### 3. Inventory Service (Port 3002)
- Manages stock levels
- Inventory reservation and deduction
- Endpoints: `/api/inventory`

### 4. Order Service (Port 3003)
- Handles order creation and management
- Integrates with Product and Inventory services
- Endpoints: `/api/orders`

### 5. API Gateway (Port 3000)
- Single entry point for all client requests
- Routes requests to appropriate microservices
- Service discovery integration

## Installation

1. Install all dependencies:
```bash
npm run install:all
```

Or install individually:
```bash
cd service-registry && npm install
cd ../shared && npm install
cd ../product-service && npm install
cd ../inventory-service && npm install
cd ../order-service && npm install
cd ../api-gateway && npm install
```

## Running the System

**Important:** Start services in this order:
1. Service Registry (must be started first)
2. Microservices (Product, Inventory, Order - can be started in any order)
3. API Gateway (should be started last)

### Option 1: Run all services manually (in separate terminals)

**Terminal 1 - Service Registry:**
```bash
npm run start:registry
```

**Terminal 2 - Product Service:**
```bash
npm run start:product
```

**Terminal 3 - Inventory Service:**
```bash
npm run start:inventory
```

**Terminal 4 - Order Service:**
```bash
npm run start:order
```

**Terminal 5 - API Gateway:**
```bash
npm run start:gateway
```

### Option 2: Development mode with auto-reload

Use `npm run dev:*` instead of `npm run start:*` for each service. This uses nodemon for automatic restarts on file changes.

### Option 3: Using PM2 (Recommended for production-like testing)

Install PM2 globally:
```bash
npm install -g pm2
```

Start all services:
```bash
pm2 start service-registry/server.js --name registry
pm2 start product-service/server.js --name product
pm2 start inventory-service/server.js --name inventory
pm2 start order-service/server.js --name order
pm2 start api-gateway/server.js --name gateway
```

View logs:
```bash
pm2 logs
```

Stop all services:
```bash
pm2 stop all
pm2 delete all
```

## API Endpoints

### Service Registry
- `GET http://localhost:8761/health` - Health check
- `GET http://localhost:8761/eureka/v2/apps` - List all registered services

### API Gateway (Main Entry Point)
- `GET http://localhost:3000/registry` - View service registry dashboard

### Product Service
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Inventory Service
- `GET /api/inventory` - Get all inventory (with product details)
- `GET /api/inventory/:productId` - Get inventory by product ID
- `PUT /api/inventory/:productId/quantity` - Update quantity
- `POST /api/inventory/:productId/reserve` - Reserve inventory
- `POST /api/inventory/:productId/release` - Release reserved inventory
- `POST /api/inventory/:productId/deduct` - Deduct inventory
- `POST /api/inventory` - Add inventory

### Order Service
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/customer/:customerId` - Get orders by customer
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status

## Testing the System

After starting all services, you can run the test script to verify everything is working:

```bash
npm test
```

This will test:
- Service Registry health
- Product service endpoints
- Inventory service endpoints
- Order service endpoints
- Service discovery
- Inter-service communication

## Example Usage

### 1. Create a Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Mouse",
    "description": "RGB Gaming Mouse",
    "price": 49.99,
    "category": "Electronics"
  }'
```

### 2. Check Inventory
```bash
curl http://localhost:3000/api/inventory/1
```

### 3. Create an Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST001",
    "items": [
      {
        "productId": 1,
        "quantity": 2
      }
    ]
  }'
```

### 4. Update Order Status
```bash
curl -X PUT http://localhost:3000/api/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONFIRMED"
  }'
```

## Service Discovery

All services automatically:
- Register themselves with the service registry on startup
- Send heartbeats every 30 seconds to stay alive
- Deregister gracefully on shutdown

The API Gateway uses service discovery to route requests to available service instances.

## Features

- ✅ Service Registry Pattern
- ✅ Service Discovery
- ✅ Health Checks
- ✅ Heartbeat Mechanism
- ✅ Graceful Shutdown
- ✅ API Gateway
- ✅ Inter-service Communication
- ✅ Inventory Reservation System
- ✅ Order Management with Inventory Integration

## Project Structure

```
.
├── service-registry/     # Service registry server
├── shared/               # Shared utilities (service discovery)
├── product-service/      # Product microservice
├── inventory-service/    # Inventory microservice
├── order-service/        # Order microservice
├── api-gateway/          # API Gateway
├── package.json          # Root package.json
└── README.md            # This file
```

## Notes

- Services use in-memory storage (data is lost on restart)
- For production, replace with proper databases (MongoDB, PostgreSQL, etc.)
- Add authentication/authorization for production use
- Consider adding message queues (RabbitMQ, Kafka) for async communication
- Implement circuit breakers for resilience
- Add logging and monitoring (ELK stack, Prometheus)

## License

ISC

