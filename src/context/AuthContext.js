import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import mockApi from "../services/mockApi";

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
          const userData = JSON.parse(storedUser);

          // Validate token with the mock API
          const isValid = await mockApi.validateToken(userData.id, storedToken);

          if (isValid) {
            setUser(userData);
            setToken(storedToken);
          } else {
            // Clear invalid data
            await AsyncStorage.multiRemove([AUTH_USER_KEY, AUTH_TOKEN_KEY]);
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
      const response = await mockApi.login(email, password);

      // Store user and token
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);

      setUser(response.user);
      setToken(response.token);

      return response;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (email, password, name) => {
    setError("");
    try {
      setLoading(true);
      const response = await mockApi.register(email, password, name);

      // Store user and token
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);

      setUser(response.user);
      setToken(response.token);

      return response;
    } catch (e) {
      setError(e.message);
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
      if (user) {
        await mockApi.logout(user.id);
      }

      // Clear stored auth data
      await AsyncStorage.multiRemove([AUTH_USER_KEY, AUTH_TOKEN_KEY]);

      setUser(null);
      setToken(null);
    } catch (e) {
      setError(e.message);
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
