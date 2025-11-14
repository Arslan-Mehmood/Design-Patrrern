/**
 * Base Service Client with Circuit Breaker
 * Encapsulates circuit breaker logic for external service calls
 */
const CircuitBreaker = require('opossum');
const axios = require('axios');

class ServiceClient {
  constructor(serviceUrl, serviceName, options = {}) {
    this.serviceUrl = serviceUrl;
    this.serviceName = serviceName;
    
    // Default circuit breaker options
    const defaultOptions = {
      timeout: 5000, // 5 seconds
      errorThresholdPercentage: 50, // Open after 50% of requests fail
      resetTimeout: 30000, // 30 seconds before attempting to close
      rollingCountTimeout: 10000, // 10 seconds rolling window
      rollingCountBuckets: 10, // Number of buckets in rolling window
      name: serviceName
    };

    const circuitBreakerOptions = { ...defaultOptions, ...options };
    
    // Create the request function
    const requestFunction = async (endpoint, method = 'GET', data = null) => {
      const url = `${this.serviceUrl}${endpoint}`;
      const config = {
        method,
        url,
        timeout: circuitBreakerOptions.timeout,
        ...(data && { data })
      };
      return await axios(config);
    };

    // Create circuit breaker
    this.circuitBreaker = new CircuitBreaker(requestFunction, circuitBreakerOptions);
    
    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup circuit breaker event listeners
   */
  setupEventListeners() {
    this.circuitBreaker.on('open', () => {
      console.log(`[Circuit Breaker] ${this.serviceName} circuit breaker OPENED`);
    });

    this.circuitBreaker.on('halfOpen', () => {
      console.log(`[Circuit Breaker] ${this.serviceName} circuit breaker HALF_OPEN`);
    });

    this.circuitBreaker.on('close', () => {
      console.log(`[Circuit Breaker] ${this.serviceName} circuit breaker CLOSED`);
    });
  }

  /**
   * Make a request to the service with circuit breaker protection
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {object} data - Request body data
   * @returns {Promise} - Axios response
   */
  async request(endpoint, method = 'GET', data = null) {
    try {
      return await this.circuitBreaker.fire(endpoint, method, data);
    } catch (error) {
      // Re-throw with additional context
      error.serviceName = this.serviceName;
      throw error;
    }
  }

  /**
   * Check if error is from circuit breaker
   * @param {Error} error - Error object
   * @returns {boolean}
   */
  static isCircuitBreakerError(error) {
    return error.name === 'CircuitBreakerOpenError' || 
           error.message?.includes('Circuit breaker is open') ||
           error.isCircuitBreakerOpen === true;
  }

  /**
   * Get circuit breaker state
   * @returns {object} - Circuit breaker state and stats
   */
  getState() {
    return {
      state: this.circuitBreaker.opened ? 'OPEN' : 
             this.circuitBreaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
      stats: this.circuitBreaker.stats,
      enabled: this.circuitBreaker.enabled
    };
  }

  /**
   * Reset circuit breaker (close it)
   */
  reset() {
    this.circuitBreaker.close();
  }
}

module.exports = ServiceClient;

