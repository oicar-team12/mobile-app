import axios from "axios";
import api from "./apiInterceptors";

// Use device IP instead of localhost for Android
// For iOS simulator, localhost may work
// For real devices and Android emulator, use your computer's IP address
const API_URL = "https://fe64-78-3-126-12.ngrok-free.app/auth"; // Android emulator default
// const API_URL = "http://localhost:8080/auth"; // iOS simulator
// If you're on a real device, use your computer's IP, e.g.:
// const API_URL = "http://192.168.1.100:8080/auth";

// Base API URL for other endpoints
const BASE_URL = "https://fe64-78-3-126-12.ngrok-free.app";

const AuthService = {
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

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

  async logout(accessToken) {
    try {
      await api.delete(`${API_URL}/logout`, {
        data: { accessToken },
      });
      return { success: true };
    } catch (error) {
      throw error.response?.data || { message: "Logout failed" };
    }
  },

  async refresh() {
    try {
      const response = await api.post(`${API_URL}/refresh`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Token refresh failed" };
    }
  },
};

export default AuthService;
