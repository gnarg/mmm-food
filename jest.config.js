export default {
  testEnvironment: 'jsdom',
  transform: {},
  moduleFileExtensions: ['js', 'mjs'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/**/*.test.js'
  ]
};
