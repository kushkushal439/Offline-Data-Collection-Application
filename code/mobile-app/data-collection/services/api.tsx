const API_URL = ' http://172.20.10.9:8080';
// const API_URL = 'https://dass-project-backend.onrender.com';

// API endpoints
export const ENDPOINTS = {
  LOGIN: `${API_URL}/api/users/login`,
  SIGNUP: `${API_URL}/api/users/signup`,
  FORMS: `${API_URL}/api/forms/AvailableForms`,
  SYNC_ENTRIES: `${API_URL}/api/forms/syncentries`,
  SYNC_MEDIA: `${API_URL}/api/files/upload`,
};