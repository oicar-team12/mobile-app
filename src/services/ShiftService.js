import api from "./apiInterceptors";
import { BASE_URL } from "./AuthService";

/**
 * Service for managing shifts
 */
const ShiftService = {
  /**
   * Get shifts for a specific group based on criteria
   * @param {number} groupId - The ID of the group
   * @param {Object} criteria - Criteria for filtering shifts
   * @param {string} [criteria.startDate] - Optional start date in ISO format (YYYY-MM-DD)
   * @param {string} [criteria.endDate] - Optional end date in ISO format (YYYY-MM-DD)
   * @returns {Promise<Array>} List of shifts
   */
  async getShifts(groupId, criteria = {}) {
    try {
      // Build query params
      const params = new URLSearchParams();
      if (criteria.startDate) params.append("startDate", criteria.startDate);
      if (criteria.endDate) params.append("endDate", criteria.endDate);
      
      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await api.get(`${BASE_URL}/group/${groupId}/shifts${query}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching shifts:", error);
      throw error.response?.data || { message: "Failed to fetch shifts" };
    }
  },

  /**
   * Get user's assigned shifts from their schedule for a specific group
   * @param {number} groupId - The ID of the group
   * @param {Object} criteria - Criteria for filtering schedules
   * @param {string} [criteria.startDate] - Optional start date in ISO format (YYYY-MM-DD)
   * @param {string} [criteria.endDate] - Optional end date in ISO format (YYYY-MM-DD)
   * @returns {Promise<Array>} List of assigned shifts via schedules
   */
  async getMyAssignedShifts(groupId, criteria = {}) {
    try {
      // Build query params - we don't need to specify userId as the backend will use the current authenticated user
      const params = new URLSearchParams();
      if (criteria.startDate) params.append("startDate", criteria.startDate);
      if (criteria.endDate) params.append("endDate", criteria.endDate);
      
      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await api.get(`${BASE_URL}/group/${groupId}/schedules${query}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching assigned shifts:", error);
      throw error.response?.data || { message: "Failed to fetch assigned shifts" };
    }
  }
};

export default ShiftService;
