/**
 * Inventory Service Client
 * Handles all communication with Inventory Service using circuit breaker pattern
 */
const ServiceClient = require('./ServiceClient');

class InventoryServiceClient extends ServiceClient {
  constructor(serviceUrl, options = {}) {
    super(serviceUrl, 'inventory-service', options);
  }

  /**
   * Get inventory for a product
   * @param {string} productId - Product ID
   * @returns {Promise} - Inventory data
   */
  async getInventory(productId) {
    return await this.request(`/inventory/${productId}`);
  }

  /**
   * Check inventory availability
   * @param {string} productId - Product ID
   * @param {number} quantity - Required quantity
   * @returns {Promise} - Availability data
   */
  async checkAvailability(productId, quantity) {
    return await this.request(`/inventory/${productId}/availability?quantity=${quantity}`);
  }

  /**
   * Reserve inventory
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to reserve
   * @returns {Promise} - Reservation result
   */
  async reserve(productId, quantity) {
    return await this.request(`/inventory/${productId}/reserve`, 'POST', { quantity });
  }

  /**
   * Release reserved inventory
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to release
   * @returns {Promise} - Release result
   */
  async release(productId, quantity) {
    return await this.request(`/inventory/${productId}/release`, 'POST', { quantity });
  }
}

module.exports = InventoryServiceClient;

