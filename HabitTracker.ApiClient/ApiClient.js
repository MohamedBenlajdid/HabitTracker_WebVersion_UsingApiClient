// HabitTracker.ApiClient/ApiClient.js

/**
 * JavaScript equivalent of the C# ApiClient.
 * Uses fetch (available in Node 18+ and modern browsers).
 * For older Node versions, install and import 'node-fetch' or 'undici'.
 */
class ApiClient {
  /**
   * Static getter/setter for CurrentUserId using sessionStorage
   * to persist across page reloads/navigations.
   */
  static get CurrentUserId() {
    const id = sessionStorage.getItem('currentUserId');
    return id ? parseInt(id, 10) : null;
  }

  static set CurrentUserId(value) {
    if (value == null) {
      sessionStorage.removeItem('currentUserId');
    } else {
      sessionStorage.setItem('currentUserId', String(value));
    }
  }

  /**
   * @param {string} baseUrl - Base URL of the API (default: "http://localhost:5266/")
   */
  constructor(baseUrl = "http://localhost:5266/") {
    this.baseUrl = baseUrl;
    // No need to store userId here – we use the static getter.
  }

  /**
   * Builds the default headers, including the X-User-Id header.
   * @returns {Record<string, string>}
   */
  _getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };
    const userId = ApiClient.CurrentUserId;
    if (userId != null) {
      headers["X-User-Id"] = String(userId);
    }
    return headers;
  }

  /**
   * Performs a GET request and returns the parsed JSON body.
   * @template T
   * @param {string} endpoint
   * @returns {Promise<T>}
   */
  async getAsync(endpoint) {
    const response = await fetch(this.baseUrl + endpoint, {
      method: "GET",
      headers: this._getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Performs a POST request and returns the full Response object.
   * @param {string} endpoint
   * @param {any} data - The payload to send (will be JSON-serialized)
   * @returns {Promise<Response>}
   */
  async postAsync(endpoint, data) {
    return await fetch(this.baseUrl + endpoint, {
      method: "POST",
      headers: this._getHeaders(),
      body: JSON.stringify(data),
    });
  }

  /**
   * Performs a PUT request and returns the full Response object.
   * @param {string} endpoint
   * @param {any} data
   * @returns {Promise<Response>}
   */
  async putAsync(endpoint, data) {
    return await fetch(this.baseUrl + endpoint, {
      method: "PUT",
      headers: this._getHeaders(),
      body: JSON.stringify(data),
    });
  }

  /**
   * Performs a DELETE request and returns the full Response object.
   * @param {string} endpoint
   * @returns {Promise<Response>}
   */
  async deleteAsync(endpoint) {
    return await fetch(this.baseUrl + endpoint, {
      method: "DELETE",
      headers: this._getHeaders(),
    });
  }

  /**
   * Reads the response body as JSON and parses it.
   * @template T
   * @param {Response} response
   * @returns {Promise<T>}
   */
  async readResponseAsync(response) {
    return await response.json();
  }
}

export default ApiClient;