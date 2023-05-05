module.exports = {
  'verbose': true,
  'transform': { '.(ts|tsx)': '<rootDir>/node_modules/ts-jest/preprocessor.js' },
  'testMatch': ['**/*.test.ts'],
  'moduleFileExtensions': [ 'ts', 'tsx', 'js' ],
  'coverageDirectory': '.coverage',
  "collectCoverageFrom": ["src/**/*.{js,ts,tsx}"],
  'testPathIgnorePatterns': [
    '/node_modules/',
    // '/build/', // github actions places our build in a build folder which results in jest ignoring our tests
    'd.ts'
  ]
};
