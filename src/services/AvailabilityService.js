import api from "./apiInterceptors.js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./AuthService";

/**
 * Service for managing user availability
 */
const AvailabilityService = {
  /**
   * Get availabilities for a specific group based on criteria
   * @param {number} groupId - The ID of the group
   * @param {Object} criteria - Criteria for filtering availabilities
   * @param {number} [criteria.userId] - Optional user ID to filter by
   * @param {string} [criteria.startDate] - Optional start date in ISO format (YYYY-MM-DD)
   * @param {string} [criteria.endDate] - Optional end date in ISO format (YYYY-MM-DD)
   * @returns {Promise<Array>} List of availabilities grouped by user
   */
  async getAvailabilities(groupId, criteria = {}) {
    try {
      if (!groupId) {
        console.error('[AvailabilityService] Missing groupId parameter');
        throw new Error('Group ID is required');
      }
      
      // Build query params
      const params = new URLSearchParams();
      if (criteria.userId) params.append("userId", criteria.userId);
      if (criteria.startDate) params.append("startDate", criteria.startDate);
      if (criteria.endDate) params.append("endDate", criteria.endDate);
      
      const query = params.toString() ? `?${params.toString()}` : "";
      const endpoint = `${BASE_URL}/group/${groupId}/availabilities${query}`;
      
      console.log('[AvailabilityService] Fetching availabilities:', {
        endpoint,
        params: Object.fromEntries(params)
      });
      
      const response = await api.get(endpoint);
      
      console.log('[AvailabilityService] Fetch successful:', {
        status: response.status,
        dataCount: response.data?.length || 0
      });
      
      return response.data || [];
    } catch (error) {
      console.error('[AvailabilityService] Failed to fetch availabilities:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      
      // Propagate the error for proper handling in components
      throw error;
    }
  },

  /**
   * Add a new availability for the current user
   * @param {number} groupId - The ID of the group
   * @param {Object} availability - The availability data
   * @param {string} availability.date - Date in ISO format (YYYY-MM-DD)
   * @param {boolean} availability.available - Whether the user is available
   * @returns {Promise<Object>} The created availability object (constructed with date and status)
   */
  async addAvailability(groupId, availability) {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      
      if (!availability || !availability.date) {
        throw new Error('Availability date is required');
      }
      
      console.log('[AvailabilityService] Adding availability:', {
        groupId,
        date: availability.date,
        available: availability.available
      });
      
      // Make the API call to add availability
      await api.post(`${BASE_URL}/group/${groupId}/availability`, {
        date: availability.date,
        available: availability.available === undefined ? true : availability.available
      });
      
      console.log('[AvailabilityService] Successfully added availability');
      
      // The backend doesn't return availability data with ID
      // After adding, we'll need to fetch the latest availabilities to get the ID
      // For now, return what we know
      return {
        date: availability.date,
        available: availability.available === undefined ? true : availability.available,
        // ID will be missing and needs to be retrieved by a follow-up getAvailabilities call
      };
    } catch (error) {
      console.error('[AvailabilityService] Failed to add availability:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      throw error;
    }
  },

  /**
   * Delete an existing availability
   * @param {number} groupId - The ID of the group
   * @param {number} availabilityId - The ID of the availability to delete
   * @returns {Promise<void>}
   */
  async removeAvailability(groupId, availabilityId) {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      
      if (!availabilityId) {
        throw new Error('Availability ID is required');
      }
      
      console.log('[AvailabilityService] Removing availability:', {
        groupId,
        availabilityId
      });
      
      await api.delete(`${BASE_URL}/group/${groupId}/availability/${availabilityId}`);
      console.log('[AvailabilityService] Successfully removed availability');
    } catch (error) {
      console.error('[AvailabilityService] Failed to remove availability:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      throw error;
    }
  },
  
  /**
   * Fetches all availabilities for a user within a date range and then refetches after an operation
   * This improves reliability by ensuring we always have the latest data with correct IDs
   * @param {number} groupId - The ID of the group
   * @param {Object} criteria - The criteria for filtering availabilities
   * @returns {Promise<Object>} An object mapping dates to availability objects
   */
  async refreshAvailabilities(groupId, criteria = {}) {
    try {
      // Get fresh data from the server
      const data = await this.getAvailabilities(groupId, criteria);
      
      // Process into a more usable format for the UI
      const processedData = {};
      
      if (data && data.length > 0) {
        // The first item contains the user's availabilities
        const userAvailabilities = data[0]?.availabilities || [];
        
        userAvailabilities.forEach(avail => {
          if (avail && avail.date) {
            processedData[avail.date] = {
              id: avail.id,
              date: avail.date,
              available: avail.available
            };
          }
        });
      }
      
      return processedData;
    } catch (error) {
      console.error('[AvailabilityService] Failed to refresh availabilities:', error);
      throw error;
    }
  }
};

export default AvailabilityService;
