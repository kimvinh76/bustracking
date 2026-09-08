// Jest Configuration for Backend Testing
export default {
  // Test environment
  testEnvironment: 'node',
  
  // Transform ES6 modules
  transform: {},
  
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'services/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    '!**/node_modules/**'
  ],
  
  // Verbose output
  verbose: true,
  
  // Timeout for tests (10 seconds)
  testTimeout: 10000
};
