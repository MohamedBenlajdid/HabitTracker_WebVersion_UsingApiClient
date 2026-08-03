// HabitTracker.ApiClient/ApiClient.js

/**
 * JavaScript equivalent of the C# ApiClient.
 * Uses fetch (available in Node 18+ and modern browsers).
 * For older Node versions, install and import 'node-fetch' or 'undici'.
 * 
 * Authentication:
 *   - Access token is kept in memory (static variable) – not persisted.
 *   - Refresh token is stored in localStorage (for demo; production should use HttpOnly Secure Cookie).
 *   - Automatic token refresh on 401 responses.
 */
class ApiClient {
  // ---------- Static token storage ----------
  static accessToken = null; // in-memory only

  static get RefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  static set RefreshToken(value) {
    if (value == null) {
      localStorage.removeItem('refreshToken');
    } else {
      localStorage.setItem('refreshToken', value);
    }
  }

  // ---------- Constructor ----------
  /**
   * @param {string} baseUrl - Base URL of the API (default: "https://habittracker-securedapis-project.onrender.com/")
   */
  constructor(baseUrl = "https://habittracker-securedapis-project.onrender.com/") {
    this.baseUrl = baseUrl;
  }

  // ---------- Private helpers ----------
  /**
   * Builds the default headers including Authorization Bearer if available.
   * @returns {Record<string, string>}
   */
  _getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };
    if (ApiClient.accessToken) {
      headers["Authorization"] = `Bearer ${ApiClient.accessToken}`;
    }
    return headers;
  }

  /**
   * Core request method with automatic 401 handling and token refresh.
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} endpoint - API endpoint (e.g., "api/Habits")
   * @param {any} [data] - Optional payload for POST/PUT
   * @param {number} [retryCount=0] - Internal retry counter (max 1)
   * @returns {Promise<Response>}
   */
  async _send(method, endpoint, data = null, retryCount = 0) {
    const url = this.baseUrl + endpoint;
    const options = {
      method,
      headers: this._getHeaders(),
    };
    if (data) {
      options.body = JSON.stringify(data);
    }

    let response = await fetch(url, options);

    // If 401 and we haven't retried yet, try to refresh the token
    if (response.status === 401 && retryCount === 0) {
      const refreshed = await this._refreshToken();
      if (refreshed) {
        // Retry the original request with the new token
        return this._send(method, endpoint, data, retryCount + 1);
      } else {
        // Refresh failed – session is truly expired
        throw new Error("Session expired. Please log in again.");
      }
    }

    return response;
  }

  /**
   * Calls the refresh endpoint to obtain a new access token using the refresh token.
   * @returns {Promise<boolean>} - True if refresh succeeded, false otherwise.
   */
  async _refreshToken() {
    const refreshToken = ApiClient.RefreshToken;
    if (!refreshToken) return false;

    try {
      const response = await fetch(this.baseUrl + "api/Authentication/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refreshToken),
      });

      if (!response.ok) return false;

      const tokens = await response.json();
      // Expect { accessToken: "...", refreshToken: "..." } from the API
      ApiClient.accessToken = tokens.accessToken;
      ApiClient.RefreshToken = tokens.refreshToken; // update if rotated
      return true;
    } catch {
      return false;
    }
  }

  // ---------- Public API methods ----------
  /**
   * Performs a GET request and returns the parsed JSON body.
   * @template T
   * @param {string} endpoint
   * @returns {Promise<T>}
   */
  async getAsync(endpoint) {
    const response = await this._send('GET', endpoint);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Performs a POST request and returns the full Response object.
   * @param {string} endpoint
   * @param {any} data
   * @returns {Promise<Response>}
   */
  async postAsync(endpoint, data) {
    return await this._send('POST', endpoint, data);
  }

  /**
   * Performs a PUT request and returns the full Response object.
   * @param {string} endpoint
   * @param {any} data
   * @returns {Promise<Response>}
   */
  async putAsync(endpoint, data) {
    return await this._send('PUT', endpoint, data);
  }

  /**
   * Performs a DELETE request and returns the full Response object.
   * @param {string} endpoint
   * @returns {Promise<Response>}
   */
  async deleteAsync(endpoint) {
    return await this._send('DELETE', endpoint);
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

  /**
   * Logs out the current user:
   * - Calls the logout endpoint to invalidate the refresh token.
   * - Clears both tokens from memory and localStorage.
   * @returns {Promise<void>}
   */
  async logout() {
    const refreshToken = ApiClient.RefreshToken;
    if (refreshToken) {
      try {
        await fetch(this.baseUrl + "api/Authentication/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(refreshToken),
        });
      } catch {
        // Ignore network errors during logout – still clean up locally
      }
    }
    ApiClient.accessToken = null;
    ApiClient.RefreshToken = null;
  }
}

export default ApiClient;