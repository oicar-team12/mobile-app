import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AuthService from "../services/AuthService";

// Create Auth Context
const AuthContext = createContext(null);

// Storage Keys
const AUTH_USER_KEY = "auth_user";
const AUTH_TOKEN_KEY = "auth_token";

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load stored user data on startup
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
        const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);

          // Try to refresh the token
          try {
            const response = await AuthService.refresh();
            setToken(response.accessToken);
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.accessToken);
          } catch (e) {
            // Token is invalid, clear auth data
            await AsyncStorage.multiRemove([AUTH_USER_KEY, AUTH_TOKEN_KEY]);
            setUser(null);
            setToken(null);
          }
        }
      } catch (e) {
        console.error("Failed to load authentication data", e);
      } finally {
        setLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    setError("");
    try {
      setLoading(true);
      const response = await AuthService.login(email, password);

      // Create user data object with email and any data from response
      const userData = {
        email: email,
        firstName: response.firstName || "",
        lastName: response.lastName || "",
        // Add more user properties from the response as needed
      };

      // Store user and token
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.accessToken);

      setUser(userData);
      setToken(response.accessToken);

      return response;
    } catch (e) {
      setError(e.message || "Login failed");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (firstName, lastName, email, password) => {
    setError("");
    try {
      setLoading(true);
      await AuthService.register(firstName, lastName, email, password);

      // After registration, log the user in and provide firstName and lastName explicitly
      const loginResponse = await AuthService.login(email, password);

      // Store user data with firstName and lastName
      const userData = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        // Add additional fields from loginResponse if needed
      };

      // Store user and token
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, loginResponse.accessToken);

      setUser(userData);
      setToken(loginResponse.accessToken);

      return loginResponse;
    } catch (e) {
      setError(e.message || "Registration failed");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setError("");
    try {
      setLoading(true);
      if (token) {
        await AuthService.logout(token);
      }

      // Clear stored auth data
      await AsyncStorage.multiRemove([AUTH_USER_KEY, AUTH_TOKEN_KEY]);

      setUser(null);
      setToken(null);
    } catch (e) {
      setError(e.message || "Logout failed");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  // Context value
  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
