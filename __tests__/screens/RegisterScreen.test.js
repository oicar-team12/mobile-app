import React from 'react';
import { render } from '@testing-library/react-native';
import RegisterScreen from '../../src/screens/RegisterScreen';

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    signUp: jest.fn(),
  }),
}));

describe('RegisterScreen', () => {
  // Integration Test 2
  it('renders without crashing', () => {
    const mockNavigation = { navigate: jest.fn() };
    render(<RegisterScreen navigation={mockNavigation} />);
  });
});
