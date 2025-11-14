/**
 * Product Service Client
 * Handles all communication with Product Service using circuit breaker pattern
 */
const ServiceClient = require('./ServiceClient');

class ProductServiceClient extends ServiceClient {
  constructor(serviceUrl, options = {}) {
    super(serviceUrl, 'product-service', options);
  }

  /**
   * Get product by ID
   * @param {string} productId - Product ID
   * @returns {Promise} - Product data
   */
  async getProduct(productId) {
    return await this.request(`/products/${productId}`);
  }

  /**
   * Get all products
   * @returns {Promise} - List of products
   */
  async getAllProducts() {
    return await this.request('/products');
  }

  /**
   * Search products
   * @param {string} query - Search query
   * @returns {Promise} - Search results
   */
  async searchProducts(query) {
    return await this.request(`/products/search/${query}`);
  }
}

module.exports = ProductServiceClient;

