import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// API URL for token refresh
const API_URL = "https://fe64-78-3-126-12.ngrok-free.app/auth"; // Android emulator default
// const API_URL = "http://localhost:8080/auth"; // iOS simulator
// const API_URL = "http://192.168.1.100:8080/auth"; // Real device example

// Create an axios instance for authenticated requests
const api = axios.create();

// Request interceptor - Add auth header
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 (Unauthorized) and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token directly instead of using AuthService
        // to avoid circular dependency
        const response = await axios.post(
          `${API_URL}/refresh`,
          {},
          {
            withCredentials: true,
          }
        );
        const newToken = response.data.accessToken;

        // Save the new token
        await AsyncStorage.setItem("auth_token", newToken);

        // Update the header and retry
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear auth data and redirect to login
        await AsyncStorage.multiRemove(["auth_user", "auth_token"]);
        // The redirection to login should be handled by your navigation logic
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
