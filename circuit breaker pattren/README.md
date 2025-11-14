# Inventory Management System with Microservices and Circuit Breaker Pattern

A comprehensive inventory management system built with Node.js microservices architecture implementing the Circuit Breaker pattern for fault tolerance and resilience.

## Architecture

This system consists of four main components:

1. **API Gateway** (Port 3000) - Single entry point for all client requests
2. **Inventory Service** (Port 3001) - Manages inventory levels, reservations, and availability
3. **Product Service** (Port 3002) - Manages product catalog and product information
4. **Order Service** (Port 3003) - Handles order creation and processing with circuit breaker protection

## Circuit Breaker Pattern

The Circuit Breaker pattern is implemented using the [opossum](https://github.com/nodeshift/opossum) library to prevent cascading failures when services are unavailable. 

The circuit breaker logic is encapsulated in **Service Client** classes (`services/order-service/clients/`), following the **Single Responsibility Principle**:
- Service clients handle all circuit breaker logic and external service communication
- Order service focuses solely on order management business logic
- This separation improves maintainability, testability, and code organization

### Circuit Breaker States:
- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Service is failing, requests are immediately rejected
- **HALF_OPEN**: Testing if service has recovered, allows limited requests

### Configuration:
- Error Threshold: 50% of requests fail (within rolling window)
- Reset Timeout: 30 seconds before attempting to close
- Request Timeout: 5 seconds
- Rolling Window: 10 seconds with 10 buckets for statistics

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Services

### Option 1: Run all services together
```bash
npm run start:all
```

### Option 2: Run services individually

Terminal 1 - API Gateway:
```bash
npm run start:gateway
```

Terminal 2 - Inventory Service:
```bash
npm run start:inventory
```

Terminal 3 - Product Service:
```bash
npm run start:product
```

Terminal 4 - Order Service:
```bash
npm run start:order
```

## API Endpoints

### API Gateway (Port 3000)

All requests should go through the API Gateway:

- `GET /health` - Check health of all services
- `GET /inventory/*` - Proxy to Inventory Service
- `GET /products/*` - Proxy to Product Service
- `GET /orders/*` - Proxy to Order Service

### Inventory Service (Port 3001)

- `GET /health` - Health check
- `GET /inventory` - Get all inventory items
- `GET /inventory/:productId` - Get inventory for specific product
- `GET /inventory/:productId/availability?quantity=X` - Check availability
- `POST /inventory/:productId/reserve` - Reserve inventory
  ```json
  { "quantity": 10 }
  ```
- `POST /inventory/:productId/release` - Release reserved inventory
  ```json
  { "quantity": 10 }
  ```
- `PUT /inventory/:productId` - Update inventory (add stock)
  ```json
  { "quantity": 50 }
  ```

### Product Service (Port 3002)

- `GET /health` - Health check
- `GET /products` - Get all products
- `GET /products/:productId` - Get product by ID
- `GET /products/search/:query` - Search products
- `POST /products` - Create new product
  ```json
  {
    "id": "PROD006",
    "name": "Product Name",
    "description": "Description",
    "price": 99.99,
    "category": "Category",
    "sku": "SKU-006"
  }
  ```
- `PUT /products/:productId` - Update product
- `DELETE /products/:productId` - Delete product

### Order Service (Port 3003)

- `GET /health` - Health check (includes circuit breaker status)
- `GET /circuit-breaker/status` - Get circuit breaker states
- `POST /circuit-breaker/reset` - Reset circuit breakers (admin)
- `GET /orders` - Get all orders
- `GET /orders/:orderId` - Get order by ID
- `POST /orders` - Create new order
  ```json
  {
    "items": [
      { "productId": "PROD001", "quantity": 2 },
      { "productId": "PROD002", "quantity": 1 }
    ]
  }
  ```
- `POST /orders/:orderId/confirm` - Confirm order
- `POST /orders/:orderId/cancel` - Cancel order

## Testing the Circuit Breaker

### Test Scenario 1: Normal Operation

1. Create an order:
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": "PROD001", "quantity": 2}
    ]
  }'
```

### Test Scenario 2: Simulate Service Failure

1. Stop the Inventory Service
2. Try to create an order multiple times (5+ times)
3. The circuit breaker will open after 5 failures
4. Subsequent requests will be rejected immediately with 503 status
5. Check circuit breaker status:
```bash
curl http://localhost:3000/orders/circuit-breaker/status
```

### Test Scenario 3: Service Recovery

1. After the circuit breaker opens, wait 30 seconds
2. Restart the Inventory Service
3. The circuit breaker will transition to HALF_OPEN state
4. After 2 successful requests, it will close again

### Test Scenario 4: Built-in Failure Simulation

The Inventory Service has a built-in failure simulation (30% failure rate) for testing. You can also trigger failures manually:

```bash
curl "http://localhost:3001/inventory?simulateFailure=true"
```

## Example Usage

### 1. Check Service Health
```bash
curl http://localhost:3000/health
```

### 2. Get All Products
```bash
curl http://localhost:3000/products
```

### 3. Check Inventory
```bash
curl http://localhost:3000/inventory/PROD001
```

### 4. Create an Order
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": "PROD001", "quantity": 2},
      {"productId": "PROD002", "quantity": 1}
    ]
  }'
```

### 5. Check Circuit Breaker Status
```bash
curl http://localhost:3000/orders/circuit-breaker/status
```

### 6. Confirm Order
```bash
curl -X POST http://localhost:3000/orders/ORD000001/confirm
```

## Project Structure

```
.
├── services/
│   ├── inventory-service/
│   │   └── index.js           # Inventory microservice
│   ├── product-service/
│   │   └── index.js           # Product microservice
│   └── order-service/
│       ├── index.js           # Order microservice (order management logic only)
│       └── clients/           # Service clients with circuit breaker logic
│           ├── ServiceClient.js           # Base service client with circuit breaker
│           ├── InventoryServiceClient.js  # Inventory service client
│           └── ProductServiceClient.js    # Product service client
├── gateway/
│   └── index.js               # API Gateway
├── package.json
└── README.md
```

### Architecture Principles

The code follows **Single Responsibility Principle (SRP)**:
- **Order Service** (`index.js`): Responsible only for order management logic
- **Service Clients** (`clients/`): Responsible for external service communication and circuit breaker logic
- This separation makes the code more maintainable, testable, and follows clean architecture principles

## Features

- ✅ Microservices architecture
- ✅ Circuit Breaker pattern implementation using [opossum](https://github.com/nodeshift/opossum)
- ✅ API Gateway for routing
- ✅ Fault tolerance and resilience
- ✅ Service health monitoring
- ✅ Inventory reservation system
- ✅ Order management
- ✅ Product catalog management
- ✅ Error handling and graceful degradation
- ✅ Circuit breaker statistics and monitoring

## Environment Variables

You can configure service URLs using environment variables:

```bash
INVENTORY_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
```

## Notes

- All services use in-memory storage for simplicity
- The Inventory Service includes a failure simulation mode for testing
- Circuit breakers are per-service (one for Inventory, one for Product)
- The system is designed for demonstration and can be extended with databases, message queues, etc.

## Future Enhancements

- Add database persistence (MongoDB, PostgreSQL)
- Implement service discovery
- Add distributed tracing
- Implement API rate limiting
- Add authentication and authorization
- Add message queue for async processing
- Add monitoring and logging (Prometheus, Grafana)
- Containerize with Docker

