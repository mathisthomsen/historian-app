const path = require('path')
const nextJest = require('next/jest')

const projectRoot = path.join(__dirname, '..')
const createJestConfig = nextJest({
  dir: projectRoot,
})

const customJestConfig = {
  rootDir: projectRoot,
  setupFilesAfterEnv: [path.join(projectRoot, 'config', 'jest.setup.js')],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/generated/**/*',
  ],
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.api.test.{js,ts}',
    '<rootDir>/app/**/*.test.{js,jsx,ts,tsx}',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 