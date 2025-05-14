/**
 * Application configuration settings
 */

// API base URL - can be overridden by environment variables
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export { API_URL };