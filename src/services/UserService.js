import api from "./apiInterceptors";
import { BASE_URL } from "./AuthService";

/**
 * Service for managing user-related operations
 */
const UserService = {
  /**
   * Get current user information from token
   * @returns {Promise<Object>} Current user data
   * @note Actually implemented in AuthService.getProfile()
   */
  async getCurrentUser() {
    try {
      // This endpoint doesn't actually exist in the backend
      // We'll rely on the token information already stored by AuthService
      const authService = await import('./AuthService');
      return authService.default.getProfile();
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw error.response?.data || { message: "Failed to fetch current user information" };
    }
  },

  /**
   * Get groups the current user belongs to
   * @returns {Promise<Array>} List of groups
   */
  async getMyGroups() {
    try {
      // The correct endpoint is "user/groups" based on UserController.java
      const response = await api.get(`${BASE_URL}/user/groups`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user groups:", error);
      throw error.response?.data || { message: "Failed to fetch user groups" };
    }
  }
};

export default UserService;
