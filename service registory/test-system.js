const axios = require('axios');

const API_GATEWAY = 'http://localhost:3000';
const REGISTRY = 'http://localhost:8761';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testService(name, testFn) {
  try {
    log(`\n🧪 Testing ${name}...`, 'blue');
    await testFn();
    log(`✅ ${name} test passed`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${name} test failed: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('🚀 Starting System Tests\n', 'yellow');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Service Registry Health
  const registryTest = await testService('Service Registry Health', async () => {
    const response = await axios.get(`${REGISTRY}/health`);
    if (response.data.status !== 'UP') {
      throw new Error('Registry not healthy');
    }
    log(`   Registry has ${response.data.services} registered services`);
  });
  registryTest ? passed++ : failed++;

  // Test 2: Get All Products
  const productsTest = await testService('Get All Products', async () => {
    const response = await axios.get(`${API_GATEWAY}/api/products`);
    log(`   Found ${response.data.length} products`);
  });
  productsTest ? passed++ : failed++;

  // Test 3: Get Product by ID
  const productByIdTest = await testService('Get Product by ID', async () => {
    const response = await axios.get(`${API_GATEWAY}/api/products/1`);
    log(`   Product: ${response.data.name} - $${response.data.price}`);
  });
  productByIdTest ? passed++ : failed++;

  // Test 4: Get Inventory
  const inventoryTest = await testService('Get Inventory', async () => {
    const response = await axios.get(`${API_GATEWAY}/api/inventory`);
    log(`   Found ${response.data.length} inventory items`);
  });
  inventoryTest ? passed++ : failed++;

  // Test 5: Get Inventory by Product ID
  const inventoryByIdTest = await testService('Get Inventory by Product ID', async () => {
    const response = await axios.get(`${API_GATEWAY}/api/inventory/1`);
    log(`   Available quantity: ${response.data.quantity - response.data.reserved}`);
  });
  inventoryByIdTest ? passed++ : failed++;

  // Test 6: Create Order
  const createOrderTest = await testService('Create Order', async () => {
    const orderData = {
      customerId: 'TEST001',
      items: [
        { productId: 1, quantity: 1 }
      ]
    };
    const response = await axios.post(`${API_GATEWAY}/api/orders`, orderData);
    log(`   Order created: ID ${response.data.id}, Total: $${response.data.totalAmount}`);
    return response.data.id;
  });
  const orderId = createOrderTest ? (await axios.post(`${API_GATEWAY}/api/orders`, {
    customerId: 'TEST001',
    items: [{ productId: 1, quantity: 1 }]
  })).data.id : null;
  createOrderTest ? passed++ : failed++;

  // Test 7: Get Order by ID
  if (orderId) {
    const getOrderTest = await testService('Get Order by ID', async () => {
      const response = await axios.get(`${API_GATEWAY}/api/orders/${orderId}`);
      log(`   Order status: ${response.data.status}`);
    });
    getOrderTest ? passed++ : failed++;
  }

  // Test 8: Update Order Status
  if (orderId) {
    const updateOrderTest = await testService('Update Order Status', async () => {
      const response = await axios.put(`${API_GATEWAY}/api/orders/${orderId}/status`, {
        status: 'CONFIRMED'
      });
      log(`   Order status updated to: ${response.data.status}`);
    });
    updateOrderTest ? passed++ : failed++;
  }

  // Test 9: Service Registry Dashboard
  const registryDashboardTest = await testService('Service Registry Dashboard', async () => {
    const response = await axios.get(`${API_GATEWAY}/registry`);
    const apps = response.data.applications?.application || [];
    log(`   Registered services: ${apps.map(app => app.name).join(', ')}`);
  });
  registryDashboardTest ? passed++ : failed++;

  // Summary
  log('\n' + '='.repeat(50), 'yellow');
  log(`\n📊 Test Results: ${passed} passed, ${failed} failed`, failed > 0 ? 'red' : 'green');
  log('='.repeat(50) + '\n', 'yellow');

  if (failed === 0) {
    log('🎉 All tests passed! System is working correctly.', 'green');
  } else {
    log('⚠️  Some tests failed. Please check the service logs.', 'yellow');
  }
}

// Run tests
runTests().catch(error => {
  log(`\n💥 Test runner error: ${error.message}`, 'red');
  log('\nMake sure all services are running:', 'yellow');
  log('  1. Service Registry (port 8761)', 'yellow');
  log('  2. Product Service (port 3001)', 'yellow');
  log('  3. Inventory Service (port 3002)', 'yellow');
  log('  4. Order Service (port 3003)', 'yellow');
  log('  5. API Gateway (port 3000)', 'yellow');
  process.exit(1);
});

