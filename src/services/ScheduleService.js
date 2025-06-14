import api from "./apiInterceptors";
import { BASE_URL } from "./AuthService";

/**
 * Service for managing schedules
 */
const ScheduleService = {
  /**
   * Get schedules for a specific group based on criteria
   * @param {number} groupId - The ID of the group
   * @param {Object} criteria - Criteria for filtering schedules
   * @param {number} [criteria.userId] - Optional user ID to filter by
   * @param {number} [criteria.shiftId] - Optional shift ID to filter by
   * @param {string} [criteria.startDate] - Optional start date in ISO format (YYYY-MM-DD)
   * @param {string} [criteria.endDate] - Optional end date in ISO format (YYYY-MM-DD)
   * @returns {Promise<Array>} List of schedules grouped by shift
   */
  async getSchedules(groupId, criteria = {}) {
    try {
      // Build query params
      const params = new URLSearchParams();
      if (criteria.userId) params.append("userId", criteria.userId);
      if (criteria.shiftId) params.append("shiftId", criteria.shiftId);
      if (criteria.startDate) params.append("startDate", criteria.startDate);
      if (criteria.endDate) params.append("endDate", criteria.endDate);
      
      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await api.get(`${BASE_URL}/group/${groupId}/schedules${query}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch schedules" };
    }
  }

  // Note: addSchedule and removeSchedule methods are not included
  // as the app is for regular users only, not managers
};

export default ScheduleService;
