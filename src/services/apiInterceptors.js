import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// API URL for token refresh
const BACKEND_URL = "https://9679-78-0-32-213.ngrok-free.app";
const API_URL = `${BACKEND_URL}/auth`; // Android emulator default
// const API_URL = "http://localhost:8080/auth"; // iOS simulator
// const API_URL = "http://192.168.1.100:8080/auth"; // Real device example

// Create an axios instance for authenticated requests
const api = axios.create();

// Request interceptor - Add auth header
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("auth_token");
    console.log('[API Request]', { 
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenFirstChars: token ? token.substring(0, 10) + '...' : 'none' 
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('[Auth Warning] No token found when making API request to:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    console.log('[API Response Error]', { 
      url: originalRequest?.url,
      status: error.response?.status,
      data: error.response?.data,
      headers: originalRequest?.headers
    });

    // Check if this is already a retry attempt to avoid infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('[Auth] Token expired, attempting refresh');
      originalRequest._retry = true;

      try {
        // Get current attempt count to prevent infinite loops
        const attemptCountStr = await AsyncStorage.getItem('refresh_attempt_count') || '0';
        const attemptCount = parseInt(attemptCountStr, 10);
        
        // If we've tried too many times, force logout
        if (attemptCount >= 3) {
          console.error('[Auth] Too many refresh attempts, aborting');
          await AsyncStorage.multiRemove(["auth_token", "auth_user", "refresh_attempt_count", "token_timestamp"]);
          return Promise.reject(new Error('Authentication failed after multiple refresh attempts'));
        }
        
        // Try to refresh the token directly
        const currentToken = await AsyncStorage.getItem("auth_token");
        
        if (!currentToken) {
          console.error('[Auth] No token available for refresh');
          return Promise.reject(error);
        }
        
        console.log('[Auth] Calling refresh endpoint with existing token:', `${API_URL}/refresh`);
        
        // Update attempt count
        await AsyncStorage.setItem('refresh_attempt_count', (attemptCount + 1).toString());
        
        const response = await axios.post(
          `${API_URL}/refresh`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${currentToken}`
            },
            withCredentials: true,
          }
        );
        
        if (!response.data?.accessToken) {
          console.error('[Auth] Invalid refresh response:', response.data);
          throw new Error('Invalid refresh token response');
        }
        
        const newToken = response.data.accessToken;
        console.log('[Auth] Successfully refreshed token:', newToken.substring(0, 15) + '...');

        // Save the new token
        await AsyncStorage.setItem("auth_token", newToken);
        
        // Reset attempt counter on success
        await AsyncStorage.setItem('refresh_attempt_count', '0');
        
        // Update token timestamp
        await AsyncStorage.setItem('token_timestamp', Date.now().toString());

        // Create a clean request config
        const newRequestConfig = {
          ...originalRequest,
          headers: {
            ...originalRequest.headers,
            'Authorization': `Bearer ${newToken}`
          }
        };
        
        console.log('[Auth] Retrying request with new token:', {
          url: newRequestConfig.url,
          method: newRequestConfig.method,
          authHeader: `Bearer ${newToken.substring(0, 15)}...`
        });
        
        // Try the request with the original axios instance but new token
        return axios(newRequestConfig);
      } catch (refreshError) {
        console.error('[Auth] Token refresh failed:', refreshError.response?.data || refreshError.message);
        
        // If refresh fails, clear auth data
        await AsyncStorage.multiRemove(["auth_user", "auth_token", "refresh_attempt_count", "token_timestamp"]);
        
        // The redirection to login should be handled by your navigation logic
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
