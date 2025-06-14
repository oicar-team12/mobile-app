import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { BASE_URL } from '../services/AuthService';

/**
 * Utility for diagnosing authentication issues
 */
export const AuthDiagnostics = {
  /**
   * Run a comprehensive test of the authentication flow
   */
  async runAuthTest() {
    try {
      console.log('================= AUTH DIAGNOSTICS =================');
      
      // Step 1: Check if token exists
      const token = await AsyncStorage.getItem('auth_token');
      console.log('[TEST] Token exists:', !!token);
      if (token) {
        console.log('[TEST] Token first 20 chars:', token.substring(0, 20) + '...');
      }
      
      if (!token) {
        console.log('[TEST] No token found - cannot proceed with tests');
        Alert.alert('Auth Test', 'No authentication token found. Please login first.');
        return;
      }
      
      // Step 2: Try a direct request with the token
      try {
        console.log('[TEST] Making direct request with token...');
        const response = await axios.get(`${BASE_URL}/group/1/availabilities?startDate=2025-06-11&endDate=2025-06-17`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('[TEST] Direct request succeeded!', {
          status: response.status,
          hasData: !!response.data,
          dataLength: Array.isArray(response.data) ? response.data.length : 'not array'
        });
      } catch (directError) {
        console.error('[TEST] Direct request failed:', {
          status: directError.response?.status,
          data: directError.response?.data,
          message: directError.message
        });
      }
      
      // Step 3: Try to refresh the token directly
      try {
        console.log('[TEST] Attempting manual token refresh...');
        const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        
        if (refreshResponse.data?.accessToken) {
          const newToken = refreshResponse.data.accessToken;
          console.log('[TEST] Token refresh succeeded! New token first 20 chars:', 
            newToken.substring(0, 20) + '...');
          
          // Save the new token
          await AsyncStorage.setItem('auth_token', newToken);
          
          // Try request with new token
          try {
            console.log('[TEST] Making request with new token...');
            const newResponse = await axios.get(
              `${BASE_URL}/group/1/availabilities?startDate=2025-06-11&endDate=2025-06-17`, 
              {
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            console.log('[TEST] New token request succeeded!', {
              status: newResponse.status,
              hasData: !!newResponse.data,
              dataLength: Array.isArray(newResponse.data) ? newResponse.data.length : 'not array'
            });
          } catch (newTokenError) {
            console.error('[TEST] New token request failed:', {
              status: newTokenError.response?.status,
              data: newTokenError.response?.data,
              message: newTokenError.message
            });
          }
        } else {
          console.error('[TEST] Token refresh response has no token:', refreshResponse.data);
        }
      } catch (refreshError) {
        console.error('[TEST] Token refresh failed:', {
          status: refreshError.response?.status,
          data: refreshError.response?.data,
          message: refreshError.message
        });
      }
      
      console.log('================= END DIAGNOSTICS =================');
      Alert.alert('Auth Test Complete', 'Check console logs for details');
    } catch (error) {
      console.error('[TEST] Diagnostic test error:', error.message);
      Alert.alert('Auth Test Error', error.message);
    }
  }
};

export default AuthDiagnostics;
