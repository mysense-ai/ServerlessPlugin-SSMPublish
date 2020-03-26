module.exports = {
  'verbose': true,
  'transform': { '.(ts|tsx)': '<rootDir>/node_modules/ts-jest/preprocessor.js' },
  'testMatch': ['**/*.test.ts'],
  'moduleFileExtensions': [ 'ts', 'tsx', 'js' ],
  'coverageDirectory': '.coverage',
  "collectCoverageFrom": ["src/**/*.{js,ts,tsx}"],
  'testPathIgnorePatterns': [
    '/node_modules/',
    '/build/',
    'd.ts'
  ]
};
