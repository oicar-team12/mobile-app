import React from 'react';
import { render } from '@testing-library/react-native';
import ScheduleScreen from '../../src/screens/ScheduleScreen';

jest.mock('../../src/services/ScheduleService', () => ({
  getSchedules: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: () => true,
}));

describe('ScheduleScreen', () => {
  // Integration Test 4
  it('renders without crashing', () => {
    render(<ScheduleScreen />);
  });
});
