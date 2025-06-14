module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    './jest.setup.js' // Your custom setup file
  ],
  transform: {
    '^.+\\.jsx?$': 'babel-jest', // Transform JS/JSX files using babel-jest
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts|react-navigation|@unimodules|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  globals: {
    __DEV__: true,
  },
  moduleNameMapper: {
    'expo-status-bar': '<rootDir>/__mocks__/expo-status-bar.js',
    // '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js'
  }
};
