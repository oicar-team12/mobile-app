import React from 'react';
import { render } from '@testing-library/react-native';
import ProfileScreen from '../../src/screens/ProfileScreen';

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    signOut: jest.fn(),
    user: { username: 'testuser', email: 'test@example.com' },
  }),
}));

describe('ProfileScreen', () => {
  // Integration Test 3
  it('renders without crashing', () => {
    render(<ProfileScreen />);
  });
});
