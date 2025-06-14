import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/AuthService';

const BACKEND_URL = "https://9679-78-0-32-213.ngrok-free.app";

const TestAuth = () => {
  const [results, setResults] = useState([]);

  const addResult = (message) => {
    setResults(prev => [...prev, message]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testCurrentToken = async () => {
    try {
      addResult('Testing current token...');
      const token = await AsyncStorage.getItem('auth_token');
      
      if (!token) {
        addResult('⚠️ No token found in storage!');
        return;
      }
      
      addResult(`Token found: ${token.substring(0, 15)}...`);
      
      // Test a direct request
      try {
        addResult('Making direct request with current token...');
        const response = await axios.get(`${BACKEND_URL}/group/1/availabilities?startDate=2025-06-11&endDate=2025-06-17`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        addResult(`✅ Success! Status: ${response.status}, Items: ${response.data.length}`);
      } catch (error) {
        addResult(`❌ Request failed: ${error.response?.status || error.message}`);
        if (error.response?.data) {
          addResult(`Error data: ${JSON.stringify(error.response.data)}`);
        }
      }
    } catch (error) {
      addResult(`❌ Error: ${error.message}`);
    }
  };
  
  const testTokenRefresh = async () => {
    try {
      addResult('Testing token refresh...');
      
      // 1. Get current token
      const currentToken = await AsyncStorage.getItem('auth_token');
      if (!currentToken) {
        addResult('⚠️ No token to refresh!');
        return;
      }
      
      addResult(`Current token: ${currentToken.substring(0, 15)}...`);
      
      // 2. Try different refresh approaches
      
      // Approach 1: Using AuthService
      try {
        addResult('Method 1: Using AuthService.refresh()');
        const response = await AuthService.refresh();
        
        if (response.accessToken) {
          addResult(`✅ Refresh successful! New token: ${response.accessToken.substring(0, 15)}...`);
        } else {
          addResult('❌ No token in response');
        }
      } catch (error) {
        addResult(`❌ AuthService refresh failed: ${error.message}`);
      }
      
      // Approach 2: Direct axios call with token in Authorization header
      try {
        addResult('Method 2: Direct axios call with Authorization header');
        const response = await axios.post(
          `${BACKEND_URL}/auth/refresh`, 
          {}, 
          {
            headers: {
              'Authorization': `Bearer ${currentToken}`
            },
            withCredentials: true
          }
        );
        
        if (response.data?.accessToken) {
          addResult(`✅ Direct refresh successful! New token: ${response.data.accessToken.substring(0, 15)}...`);
          // Save this token for testing
          await AsyncStorage.setItem('auth_token', response.data.accessToken);
          addResult('New token saved to storage');
        } else {
          addResult(`❌ No token in response: ${JSON.stringify(response.data)}`);
        }
      } catch (error) {
        addResult(`❌ Direct refresh failed: ${error.response?.status || error.message}`);
        if (error.response?.data) {
          addResult(`Error data: ${JSON.stringify(error.response.data)}`);
        }
      }
    } catch (error) {
      addResult(`❌ Error: ${error.message}`);
    }
  };
  
  const testAvailability = async () => {
    try {
      addResult('Testing availability request...');
      const token = await AsyncStorage.getItem('auth_token');
      
      if (!token) {
        addResult('⚠️ No token found!');
        return;
      }
      
      // Test with direct axios
      try {
        addResult('Method 1: Direct axios request');
        const response = await axios.get(
          `${BACKEND_URL}/group/1/availabilities?startDate=2025-06-11&endDate=2025-06-17`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        addResult(`✅ Direct request successful! Items: ${response.data.length}`);
        addResult(`Data sample: ${JSON.stringify(response.data.slice(0, 1))}`);
      } catch (error) {
        addResult(`❌ Direct request failed: ${error.response?.status || error.message}`);
        if (error.response?.data) {
          addResult(`Error data: ${JSON.stringify(error.response.data)}`);
        }
      }
    } catch (error) {
      addResult(`❌ Error: ${error.message}`);
    }
  };
  
  const loginTest = async () => {
    try {
      addResult('Testing login...');
      // Replace with test credentials
      const email = 'pepe@gmail.com';
      const password = 'password';
      
      try {
        const response = await AuthService.login(email, password);
        addResult(`✅ Login successful! Token: ${response.accessToken.substring(0, 15)}...`);
        
        // Test a request with the new token
        const newToken = response.accessToken;
        try {
          addResult('Testing request with fresh login token...');
          const availResponse = await axios.get(
            `${BACKEND_URL}/group/1/availabilities?startDate=2025-06-11&endDate=2025-06-17`,
            {
              headers: {
                'Authorization': `Bearer ${newToken}`
              }
            }
          );
          
          addResult(`✅ Request successful! Items: ${availResponse.data.length}`);
        } catch (error) {
          addResult(`❌ Request with new token failed: ${error.response?.status || error.message}`);
        }
      } catch (error) {
        addResult(`❌ Login failed: ${error.message}`);
      }
    } catch (error) {
      addResult(`❌ Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Authentication Tests</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Test Current Token" onPress={testCurrentToken} />
        <View style={styles.buttonSpacer} />
        <Button title="Test Token Refresh" onPress={testTokenRefresh} />
        <View style={styles.buttonSpacer} />
        <Button title="Test Availability API" onPress={testAvailability} />
        <View style={styles.buttonSpacer} />
        <Button title="Test Login" onPress={loginTest} />
        <View style={styles.buttonSpacer} />
        <Button title="Clear Results" onPress={clearResults} color="#888" />
      </View>
      
      <ScrollView style={styles.results}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
        {results.length === 0 && (
          <Text style={styles.placeholder}>Test results will appear here</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  buttonSpacer: {
    height: 8,
  },
  results: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  placeholder: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default TestAuth;
