// Mock user database
const users = [
  {
    id: "1",
    email: "user@example.com",
    password: "password123",
    name: "Test User",
  },
];

// Mock token storage
let authTokens = {};

// Simulate API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API for authentication
const mockApi = {
  // Login user
  login: async (email, password) => {
    await delay(800); // Simulate network delay

    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      throw new Error("User not found");
    }

    if (user.password !== password) {
      throw new Error("Invalid password");
    }

    // Create a mock token
    const token = `mock-jwt-token-${Math.random().toString(36).substring(2)}`;

    // Store token
    authTokens[user.id] = token;

    // Return user data (excluding password) and token
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  },

  // Register user
  register: async (email, password, name) => {
    await delay(1000); // Simulate network delay

    // Check if user already exists
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("User already exists");
    }

    // Create new user
    const newUser = {
      id: (users.length + 1).toString(),
      email,
      password,
      name,
    };

    // Add to mock database
    users.push(newUser);

    // Create a mock token
    const token = `mock-jwt-token-${Math.random().toString(36).substring(2)}`;

    // Store token
    authTokens[newUser.id] = token;

    // Return user data (excluding password) and token
    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      token,
    };
  },

  // Logout user
  logout: async (userId) => {
    await delay(500); // Simulate network delay

    // Delete token
    if (authTokens[userId]) {
      delete authTokens[userId];
    }

    return { success: true };
  },

  // Check if token is valid (for persisting login)
  validateToken: async (userId, token) => {
    await delay(300);
    return authTokens[userId] === token;
  },
};

export default mockApi;
