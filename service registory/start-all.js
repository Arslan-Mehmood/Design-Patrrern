const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'Service Registry', dir: 'service-registry', delay: 2000 },
  { name: 'Product Service', dir: 'product-service', delay: 3000 },
  { name: 'Inventory Service', dir: 'inventory-service', delay: 3000 },
  { name: 'Order Service', dir: 'order-service', delay: 3000 },
  { name: 'API Gateway', dir: 'api-gateway', delay: 3000 }
];

console.log('🚀 Starting all microservices...\n');

let currentIndex = 0;

function startService(index) {
  if (index >= services.length) {
    console.log('\n✅ All services started!');
    console.log('\n📍 Service URLs:');
    console.log('   - Service Registry: http://localhost:8761');
    console.log('   - API Gateway: http://localhost:3000');
    console.log('   - Product Service: http://localhost:3001');
    console.log('   - Inventory Service: http://localhost:3002');
    console.log('   - Order Service: http://localhost:3003');
    console.log('\n⚠️  Press Ctrl+C to stop all services\n');
    return;
  }

  const service = services[index];
  console.log(`Starting ${service.name}...`);

  const child = spawn('npm', ['start'], {
    cwd: path.join(__dirname, service.dir),
    stdio: 'inherit',
    shell: true
  });

  child.on('error', (error) => {
    console.error(`Failed to start ${service.name}:`, error);
  });

  setTimeout(() => {
    startService(index + 1);
  }, service.delay);
}

startService(0);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down all services...');
  process.exit(0);
});

