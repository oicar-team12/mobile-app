import React from 'react';
import { render } from '@testing-library/react-native';
import ShiftScreen from '../../src/screens/ShiftScreen';

jest.mock('../../src/services/ShiftService', () => ({
  getShifts: jest.fn(() => Promise.resolve([])),
  takeShift: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: () => true,
}));

describe('ShiftScreen', () => {
  // Integration Test 5
  it('renders without crashing', () => {
    render(<ShiftScreen />);
  });
});
