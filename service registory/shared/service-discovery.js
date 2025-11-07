const axios = require('axios');

class ServiceDiscovery {
  constructor(registryUrl = 'http://localhost:8761') {
    this.registryUrl = registryUrl;
    this.serviceCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  // Register service with registry
  async registerService(serviceName, instanceId, host, port, metadata = {}) {
    const serviceData = {
      instance: {
        instanceId: instanceId,
        hostName: host,
        port: {
          $: port,
          '@enabled': 'true'
        },
        app: serviceName.toUpperCase(),
        ipAddr: host,
        status: 'UP',
        healthCheckUrl: `http://${host}:${port}/health`,
        statusPageUrl: `http://${host}:${port}/info`,
        homePageUrl: `http://${host}:${port}/`,
        metadata: metadata
      }
    };

    try {
      await axios.post(
        `${this.registryUrl}/eureka/v2/apps/${serviceName}`,
        serviceData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log(`✓ Registered ${serviceName} with registry`);
      return true;
    } catch (error) {
      console.error(`✗ Failed to register ${serviceName}:`, error.message);
      return false;
    }
  }

  // Send heartbeat to registry
  async renewService(serviceName, instanceId) {
    try {
      await axios.put(
        `${this.registryUrl}/eureka/v2/apps/${serviceName}/${instanceId}`
      );
      return true;
    } catch (error) {
      console.error(`✗ Failed to renew ${serviceName}:`, error.message);
      return false;
    }
  }

  // Discover service instances
  async discoverService(serviceName) {
    const cacheKey = serviceName.toUpperCase();
    const cached = this.serviceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.instances;
    }

    try {
      const response = await axios.get(
        `${this.registryUrl}/eureka/v2/apps/${serviceName}`
      );
      
      const instances = response.data.application?.instance || [];
      const activeInstances = instances.filter(inst => inst.status === 'UP');
      
      this.serviceCache.set(cacheKey, {
        instances: activeInstances,
        timestamp: Date.now()
      });
      
      return activeInstances;
    } catch (error) {
      console.error(`✗ Failed to discover ${serviceName}:`, error.message);
      return [];
    }
  }

  // Get a random instance (load balancing)
  async getServiceInstance(serviceName) {
    const instances = await this.discoverService(serviceName);
    
    if (instances.length === 0) {
      throw new Error(`No instances available for service: ${serviceName}`);
    }
    
    // Simple round-robin or random selection
    const instance = instances[Math.floor(Math.random() * instances.length)];
    const port = typeof instance.port === 'object' ? instance.port.$ : instance.port;
    return `http://${instance.hostName}:${port}`;
  }

  // Deregister service
  async deregisterService(serviceName, instanceId) {
    try {
      await axios.delete(
        `${this.registryUrl}/eureka/v2/apps/${serviceName}/${instanceId}`
      );
      console.log(`✓ Deregistered ${serviceName} from registry`);
      return true;
    } catch (error) {
      console.error(`✗ Failed to deregister ${serviceName}:`, error.message);
      return false;
    }
  }
}

module.exports = ServiceDiscovery;

