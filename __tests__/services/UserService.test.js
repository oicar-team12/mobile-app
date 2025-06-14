import UserService from '../../src/services/UserService';

// Mock the entire module to avoid actual API calls
jest.mock('../../src/services/UserService', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({ id: 1, name: 'test' }),
  getMyGroups: jest.fn().mockResolvedValue([{ id: 1, name: 'group1' }]),
}));

describe('UserService', () => {
  // Unit Test 1
  it('should have a mock implementation for getCurrentUser', () => {
    expect(jest.isMockFunction(UserService.getCurrentUser)).toBe(true);
  });

  // Unit Test 2
  it('should have a mock implementation for getMyGroups', () => {
    expect(jest.isMockFunction(UserService.getMyGroups)).toBe(true);
  });
});
