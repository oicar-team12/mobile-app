import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./apiInterceptors";

// Use device IP instead of localhost for Android
// For iOS simulator, localhost may work
// For real devices and Android emulator, use your computer's IP address
const API_URL = "https://9679-78-0-32-213.ngrok-free.app/auth"; // Android emulator default
// const API_URL = "http://localhost:8080/auth"; // iOS simulator
// If you're on a real device, use your computer's IP, e.g.:
// const API_URL = "http://192.168.1.100:8080/auth";

// Base API URL for other endpoints
export const BASE_URL = "https://9679-78-0-32-213.ngrok-free.app";

const AuthService = {
  async login(email, password) {
    try {
      console.log('[AuthService] Attempting login for:', email);
      
      // Clear any existing tokens before login
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('refresh_attempt_count');
      
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });
      
      if (!response.data || !response.data.accessToken) {
        console.error('[AuthService] Login response missing token:', response.data);
        throw { message: 'Invalid login response - missing token' };
      }
      
      // Store the token immediately
      console.log('[AuthService] Login successful, saving new token');
      await AsyncStorage.setItem('auth_token', response.data.accessToken);
      
      // Store token creation time
      await AsyncStorage.setItem('token_timestamp', Date.now().toString());
      
      // The login response may not contain user info, so we'll add it ourselves
      // This assumes the backend doesn't include user data in login response
      return {
        ...response.data,
        email: email,
        // These will be overwritten if we implement getUserInfo later
        firstName: "",
        lastName: "",
      };
    } catch (error) {
      console.error('[AuthService] Login failed:', error.response?.data || error.message);
      throw error.response?.data || { message: "Login failed" };
    }
  },

  // You can add this method to get user info if your backend supports it
  async getUserInfo(accessToken) {
    try {
      const response = await api.get(`${BASE_URL}/api/users/me`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to get user info" };
    }
  },

  async register(firstName, lastName, email, password) {
    try {
      await axios.post(`${API_URL}/register`, {
        firstName,
        lastName,
        email,
        password,
      });
      return { success: true };
    } catch (error) {
      throw error.response?.data || { message: "Registration failed" };
    }
  },

  /**
   * Get current user profile information from JWT token
   * @returns {Promise<Object>} User profile data
   */
  async getProfile() {
    try {
      // Get the auth token from storage
      const token = await AsyncStorage.getItem('auth_token');
      
      if (!token) {
        throw { message: "No authentication token found" };
      }
      
      // Parse the JWT token to get user info
      // JWT tokens have three parts: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw { message: "Invalid token format" };
      }
      
      // Decode the payload (middle part) - atob doesn't work well in React Native, so we use this approach
      // Decode base64 (with URL-safe chars) to a string
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        Array.from(atob(base64))
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      
      // Return user information from token payload
      return {
        id: payload.userId || payload.sub,
        email: payload.email,
        firstName: payload.firstName || '',
        lastName: payload.lastName || '',
        // Add any other fields that might be in your JWT
      };
    } catch (error) {
      console.error('[AuthService] Failed to get profile:', error);
      throw { message: "Failed to get user profile" };
    }
  },
  
  async logout() {
    try {
      // Get token directly from AsyncStorage
      const token = await AsyncStorage.getItem('auth_token');
      
      // Try to logout first with token in authorization header
      try {
        await axios.delete(`${API_URL}/logout`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        });
        console.log('[AuthService] Backend logout successful');
      } catch (err) {
        console.log("[AuthService] Backend logout failed, still clearing local tokens", err);
        // We'll still clear local storage even if server logout fails
      }

      // Clear all tokens and state from AsyncStorage
      await AsyncStorage.multiRemove([
        "auth_token", 
        "auth_user", 
        "token_timestamp", 
        "refresh_attempt_count"
      ]);
      console.log('[AuthService] All local authentication data cleared');
      
      return { success: true };
    } catch (error) {
      console.error('[AuthService] Logout error:', error.response || error);
      // Still return success since we've cleared local tokens
      return { success: true };
    }
  },

  async refresh() {
    try {
      console.log('[AuthService] Attempting to refresh token');
      
      // Get current token
      const token = await AsyncStorage.getItem("auth_token");
      
      // Check attempt count to prevent infinite loops
      let attemptCount = parseInt(await AsyncStorage.getItem('refresh_attempt_count') || '0', 10);
      attemptCount += 1;
      await AsyncStorage.setItem('refresh_attempt_count', attemptCount.toString());
      
      if (attemptCount > 3) {
        console.error('[AuthService] Too many refresh attempts, forcing logout');
        await this.logout();
        throw { message: "Authentication failed after multiple refresh attempts" };
      }
      
      // Token must be provided in Authorization header for refresh to work with our current setup
      if (!token) {
        console.error('[AuthService] No token available for refresh, forcing logout');
        await this.logout();
        throw { message: "No authentication token available" };
      }
      
      console.log('[AuthService] Refresh token request with token:', token.substring(0, 15) + '...');
      
      // Create a specific axios instance for this request
      const axiosInstance = axios.create();
      
      // Make the refresh call with token in Authorization header
      const response = await axiosInstance.post(`${API_URL}/refresh`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      if (!response.data || !response.data.accessToken) {
        console.error('[AuthService] Refresh response missing token:', response.data);
        throw { message: "Invalid response from refresh endpoint" };
      }
      
      console.log('[AuthService] New token received:', {
        success: true,
        tokenFirstChars: response.data.accessToken.substring(0, 15) + '...'
      });
      
      // Save the new token immediately
      await AsyncStorage.setItem("auth_token", response.data.accessToken);
      
      // Reset refresh attempt counter on success
      await AsyncStorage.setItem('refresh_attempt_count', '0');
      
      // Store token creation time
      await AsyncStorage.setItem('token_timestamp', Date.now().toString());
      
      return response.data;
    } catch (error) {
      console.error('[AuthService] Token refresh failed:', error.response?.data || error.message);
      throw error.response?.data || { message: "Token refresh failed" };
    }
  },
};

export default AuthService;
