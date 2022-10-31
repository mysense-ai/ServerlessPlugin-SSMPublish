/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  preset: 'ts-jest',
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: [ 'ts', 'tsx', 'js' ],
  coverageDirectory: '.coverage',
  collectCoverageFrom: ['src/**/*.{js,ts,tsx}'],
  testPathIgnorePatterns: [
    '/node_modules/',
    // '/build/', // Travis places our build in a build folder which results in jest ignoring our tests
    'd.ts'
  ]
};
