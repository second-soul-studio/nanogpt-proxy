export default {
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["jest-junit", "json-summary", "text", "lcov"],
  testEnvironment: 'node',
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  transform: {},
  setupFiles: ['dotenv/config'],
};
