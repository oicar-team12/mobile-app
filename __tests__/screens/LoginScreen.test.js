import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../../src/screens/LoginScreen';

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    signIn: jest.fn(),
  }),
}));

describe('LoginScreen', () => {
  // Integration Test 1
  it('renders without crashing', () => {
    const mockNavigation = { navigate: jest.fn() };
    render(<LoginScreen navigation={mockNavigation} />);
  });
});
