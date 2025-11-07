const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8761;

app.use(cors());
app.use(express.json());

// In-memory service registry
const services = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', services: services.size });
});

// Register a service
app.post('/eureka/v2/apps/:appName', (req, res) => {
  const { appName } = req.params;
  const instance = req.body.instance;
  
  if (!instance || !instance.instanceId || !instance.hostName || !instance.port) {
    return res.status(400).json({ error: 'Invalid service instance data' });
  }

  // Handle port as object { $: port } or number
  const port = typeof instance.port === 'object' ? instance.port.$ : instance.port;
  const portObj = typeof instance.port === 'object' ? instance.port : { $: instance.port, '@enabled': 'true' };

  const serviceKey = `${appName.toUpperCase()}`;
  
  if (!services.has(serviceKey)) {
    services.set(serviceKey, []);
  }

  const existingInstances = services.get(serviceKey);
  const instanceIndex = existingInstances.findIndex(
    inst => inst.instanceId === instance.instanceId
  );

  const serviceInstance = {
    instanceId: instance.instanceId,
    hostName: instance.hostName,
    port: portObj,
    status: instance.status || 'UP',
    healthCheckUrl: instance.healthCheckUrl || `http://${instance.hostName}:${port}/health`,
    statusPageUrl: instance.statusPageUrl || `http://${instance.hostName}:${port}/info`,
    homePageUrl: instance.homePageUrl || `http://${instance.hostName}:${port}/`,
    lastUpdated: new Date().toISOString(),
    leaseInfo: {
      renewalIntervalInSecs: 30,
      durationInSecs: 90,
      lastRenewalTimestamp: Date.now()
    }
  };

  if (instanceIndex >= 0) {
    existingInstances[instanceIndex] = serviceInstance;
  } else {
    existingInstances.push(serviceInstance);
  }

  services.set(serviceKey, existingInstances);
  
  console.log(`✓ Service registered: ${appName} - ${instance.instanceId} at ${instance.hostName}:${port}`);
  res.status(204).send();
});

// Heartbeat/renewal
app.put('/eureka/v2/apps/:appName/:instanceId', (req, res) => {
  const { appName, instanceId } = req.params;
  const serviceKey = `${appName.toUpperCase()}`;
  
  if (services.has(serviceKey)) {
    const instances = services.get(serviceKey);
    const instance = instances.find(inst => inst.instanceId === instanceId);
    
    if (instance) {
      instance.leaseInfo.lastRenewalTimestamp = Date.now();
      instance.lastUpdated = new Date().toISOString();
      res.status(200).json(instance);
      return;
    }
  }
  
  res.status(404).json({ error: 'Service instance not found' });
});

// Get all applications
app.get('/eureka/v2/apps', (req, res) => {
  const applications = {
    applications: {
      application: Array.from(services.entries()).map(([name, instances]) => ({
        name,
        instance: instances
      }))
    }
  };
  res.json(applications);
});

// Get specific application instances
app.get('/eureka/v2/apps/:appName', (req, res) => {
  const { appName } = req.params;
  const serviceKey = `${appName.toUpperCase()}`;
  
  if (services.has(serviceKey)) {
    const instances = services.get(serviceKey);
    res.json({
      application: {
        name: serviceKey,
        instance: instances.filter(inst => inst.status === 'UP')
      }
    });
  } else {
    res.status(404).json({ error: 'Application not found' });
  }
});

// Deregister a service
app.delete('/eureka/v2/apps/:appName/:instanceId', (req, res) => {
  const { appName, instanceId } = req.params;
  const serviceKey = `${appName.toUpperCase()}`;
  
  if (services.has(serviceKey)) {
    const instances = services.get(serviceKey);
    const filtered = instances.filter(inst => inst.instanceId !== instanceId);
    
    if (filtered.length === 0) {
      services.delete(serviceKey);
    } else {
      services.set(serviceKey, filtered);
    }
    
    console.log(`✗ Service deregistered: ${appName} - ${instanceId}`);
    res.status(200).json({ message: 'Service deregistered' });
  } else {
    res.status(404).json({ error: 'Service not found' });
  }
});

// Cleanup expired services (heartbeat timeout)
setInterval(() => {
  const now = Date.now();
  const timeout = 120000; // 2 minutes
  
  services.forEach((instances, serviceKey) => {
    const activeInstances = instances.filter(instance => {
      const timeSinceRenewal = now - instance.leaseInfo.lastRenewalTimestamp;
      return timeSinceRenewal < timeout;
    });
    
    if (activeInstances.length === 0) {
      services.delete(serviceKey);
      console.log(`✗ Removed expired service: ${serviceKey}`);
    } else if (activeInstances.length < instances.length) {
      services.set(serviceKey, activeInstances);
      console.log(`⚠ Cleaned up expired instances for: ${serviceKey}`);
    }
  });
}, 30000); // Check every 30 seconds

app.listen(PORT, () => {
  console.log(`🚀 Service Registry running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Eureka API: http://localhost:${PORT}/eureka/v2/apps`);
});

